use std::collections::HashSet;
use std::sync::Mutex;
use std::time::{Duration, Instant as WallInstant, SystemTime, UNIX_EPOCH};

use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use jsonwebtoken::jwk::JwkSet;
use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use ring::digest;
use ring::rand::{SecureRandom, SystemRandom};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use subtle::ConstantTimeEq;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::Mutex as AsyncMutex;
use tokio::time::{timeout_at, Instant};

use crate::chat::{self, Chat, ChatContext, ChatReply, ModelInfo};
use crate::island::WINDOW_LABEL;
use crate::openai_compat::{self, Attachment};
use crate::{net, platform, secrets};

const ISSUER: &str = "https://auth.openai.com";
const DISCOVERY_URL: &str = "https://auth.openai.com/.well-known/openid-configuration";
const AUTHORIZE_URL: &str = "https://auth.openai.com/api/accounts/authorize";
const TOKEN_URL: &str = "https://auth.openai.com/api/accounts/oauth/token";
const JWKS_URL: &str = "https://auth.openai.com/.well-known/jwks.json";
const REVOKE_URL: &str = "https://auth.openai.com/api/accounts/oauth/revoke";
const MODELS_URL: &str = "https://api.openai.com/v1/models";
const RESPONSES_URL: &str = "https://api.openai.com/v1/responses";
const DYNAMIC_CLIENT: &str = "dynamic_agent_client";
const RESOURCE: &str = "https://api.openai.com/v1";
const SCOPES: &str =
    "openid profile email offline_access resource.invoke chatgpt.tokens.use.direct";
const CALLBACK_PATH: &str = "/auth/callback";
const MAX_HTTP_REQUEST: usize = 16 * 1024;
const MAX_OAUTH_RESPONSE: usize = 64 * 1024;
const MAX_INDEX_BYTES: usize = 2048;
const MAX_SSE_LINE: usize = 1024 * 1024;
const MAX_ANSWER_BYTES: usize = 4 * 1024 * 1024;
const AUTH_TIMEOUT: Duration = Duration::from_secs(300);
const REQUEST_TIMEOUT: Duration = Duration::from_secs(15);
const STREAM_TIMEOUT: Duration = Duration::from_secs(300);
const DELTA_INTERVAL: Duration = Duration::from_millis(1000 / 15);
const REFRESH_MARGIN_SECS: u64 = 60;

static STORAGE_LOCK: Mutex<()> = Mutex::new(());
static AUTH_LOCK: AsyncMutex<()> = AsyncMutex::const_new(());
static REFRESH_LOCK: AsyncMutex<()> = AsyncMutex::const_new(());

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountSummary {
    pub profile_id: String,
    pub label: String,
    pub connected: bool,
    pub plan_enabled: bool,
    pub active: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountStatus {
    pub accounts: Vec<AccountSummary>,
    pub active_profile_id: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignOutResult {
    pub remote_revoked: bool,
    pub local_cleared: bool,
}

#[derive(Clone, Default, Deserialize, Serialize)]
struct ProfileIndex {
    profiles: Vec<String>,
    active: Option<String>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProfileRecord {
    client_id: String,
    subject: String,
    email: Option<String>,
    plan_enabled: bool,
    expires_at: u64,
    generation: Option<String>,
    #[serde(default)]
    cleanup_generations: Vec<String>,
}

#[derive(Clone)]
struct TokenBundle {
    access: String,
    refresh: String,
    id: String,
}

#[derive(Clone)]
struct Identity {
    subject: String,
    email: Option<String>,
}

trait CredentialStore {
    fn get(&self, key: &str) -> Result<Option<String>, String>;
    fn set(&self, key: &str, value: &str) -> Result<(), String>;
    fn clear(&self, key: &str) -> Result<(), String>;
}

struct SystemCredentialStore;

impl CredentialStore for SystemCredentialStore {
    fn get(&self, key: &str) -> Result<Option<String>, String> {
        secrets::read_internal(key).map_err(|_| "O cofre do sistema não está disponível.".into())
    }

    fn set(&self, key: &str, value: &str) -> Result<(), String> {
        secrets::set_internal(key, value)
            .map_err(|_| "Não foi possível gravar no cofre do sistema.".into())
    }

    fn clear(&self, key: &str) -> Result<(), String> {
        secrets::clear_internal(key)
            .map_err(|_| "Não foi possível limpar o cofre do sistema.".into())
    }
}

#[derive(Deserialize)]
struct Discovery {
    issuer: String,
    authorization_endpoint: String,
    token_endpoint: String,
    jwks_uri: String,
    revocation_endpoint: String,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: String,
    id_token: String,
    token_type: String,
    expires_in: u64,
    scope: String,
}

#[derive(Deserialize)]
struct RefreshResponse {
    access_token: String,
    refresh_token: Option<String>,
    token_type: String,
    expires_in: u64,
    scope: Option<String>,
}

#[derive(Deserialize)]
struct IdClaims {
    sub: String,
    nonce: String,
    email: Option<String>,
    email_verified: Option<bool>,
}

struct Callback {
    code: String,
    client_id: String,
}

enum CallbackParse {
    NotForUs,
    Invalid,
    Failed(&'static str),
    Accepted(Callback),
}

pub fn status() -> Result<AccountStatus, String> {
    let _guard = STORAGE_LOCK.lock().unwrap();
    status_with(&SystemCredentialStore)
}

pub fn activate(profile_id: &str) -> Result<AccountStatus, String> {
    let _guard = STORAGE_LOCK.lock().unwrap();
    let store = SystemCredentialStore;
    let mut index = read_index(&store)?;
    let record = read_profile(&store, profile_id)?.ok_or("Essa conta não está salva.")?;
    if !profile_usable(&store, profile_id, &record)? {
        return Err("Reconecte uma conta autorizada para usar o plano ChatGPT.".into());
    }
    index.active = Some(profile_id.to_string());
    write_index(&store, &index)?;
    status_with(&store)
}

pub async fn models() -> Result<Vec<ModelInfo>, String> {
    let endpoint = reqwest::Url::parse(MODELS_URL).map_err(|_| "Endereço de modelos inválido.")?;
    let client = net::client(&endpoint, REQUEST_TIMEOUT)
        .map_err(|_| "Não foi possível preparar a conexão segura.".to_string())?;
    models_with(&SystemCredentialStore, &client, TOKEN_URL, MODELS_URL).await
}

pub async fn send(
    app: &AppHandle,
    chat: &Chat,
    model: &str,
    query: String,
    context: Option<ChatContext>,
) -> Result<ChatReply, String> {
    send_with(chat, model, query, context, |visible| {
        let _ = app.emit_to(WINDOW_LABEL, "chat-delta", visible);
    })
    .await
}

pub async fn send_with(
    chat: &Chat,
    model: &str,
    query: String,
    context: Option<ChatContext>,
    on_delta: impl FnMut(String),
) -> Result<ChatReply, String> {
    let endpoint = reqwest::Url::parse(RESPONSES_URL).map_err(|_| "Endereço do ChatGPT inválido.")?;
    let stream_client = net::client(&endpoint, STREAM_TIMEOUT)
        .map_err(|_| "Não foi possível preparar a conexão segura.".to_string())?;
    let meta_client = http_client()?;
    send_with_endpoints(
        &SystemCredentialStore,
        &meta_client,
        &stream_client,
        TOKEN_URL,
        MODELS_URL,
        RESPONSES_URL,
        chat,
        model,
        query,
        context,
        on_delta,
    )
    .await
}

pub async fn sign_in(profile_id: Option<String>) -> Result<AccountStatus, String> {
    let _auth = AUTH_LOCK.lock().await;
    let store = SystemCredentialStore;
    let existing = if let Some(id) = profile_id.as_deref() {
        if !is_profile_id(id) {
            return Err("Identificador de conta inválido.".into());
        }
        Some(read_profile(&store, id)?.ok_or("Essa conta não está salva.")?)
    } else {
        None
    };

    let host_id = ensure_host_id(&store)?;
    let listener = TcpListener::bind(("127.0.0.1", 0))
        .await
        .map_err(|_| "Não foi possível abrir o retorno local do login.".to_string())?;
    let port = listener
        .local_addr()
        .map_err(|_| "Não foi possível abrir o retorno local do login.".to_string())?
        .port();
    let redirect_uri = format!("http://127.0.0.1:{port}{CALLBACK_PATH}");
    let state = random_url_token(32)?;
    let nonce = random_url_token(32)?;
    let verifier = random_url_token(32)?;
    let challenge =
        URL_SAFE_NO_PAD.encode(digest::digest(&digest::SHA256, verifier.as_bytes()).as_ref());

    let client_id = existing
        .as_ref()
        .map(|p| p.client_id.as_str())
        .unwrap_or(DYNAMIC_CLIENT);
    let auth_url = authorization_url(
        client_id,
        existing.is_none(),
        &host_id,
        &redirect_uri,
        &state,
        &nonce,
        &challenge,
    )?;
    platform::open_url(auth_url.as_str());

    let callback = wait_for_callback(
        listener,
        &state,
        existing.as_ref().map(|p| p.client_id.as_str()),
    )
    .await?;
    let discovery = discover().await?;
    let client = http_client()?;
    let token = exchange_code(&client, &discovery, &callback, &redirect_uri, &verifier).await?;
    let jwks = fetch_jwks(&client, &discovery).await?;
    let identity = validate_id_token(&token.id_token, &jwks, &callback.client_id, &nonce)?;

    if let Some(profile) = existing.as_ref() {
        if profile.client_id != callback.client_id || profile.subject != identity.subject {
            return Err("O login retornou uma identidade diferente da conta escolhida. As credenciais salvas foram mantidas.".into());
        }
    }

    let plan_enabled = has_plan_scope(&token.scope);
    let expires_at = unix_now()?
        .checked_add(token.expires_in)
        .ok_or("Validade do token inválida.")?;
    let _guard = STORAGE_LOCK.lock().unwrap();
    save_authenticated(
        &store,
        profile_id.as_deref(),
        &callback.client_id,
        &identity,
        plan_enabled,
        expires_at,
        TokenBundle {
            access: token.access_token,
            refresh: token.refresh_token,
            id: token.id_token,
        },
    )?;
    status_with(&store)
}

pub async fn sign_out(profile_id: String) -> Result<SignOutResult, String> {
    let _auth = AUTH_LOCK.lock().await;
    if !is_profile_id(&profile_id) {
        return Err("Identificador de conta inválido.".into());
    }
    let store = SystemCredentialStore;
    let record = read_profile(&store, &profile_id)?.ok_or("Essa conta não está salva.")?;
    let refresh = record.generation.as_deref().and_then(|generation| {
        read_token(&store, &profile_id, generation, "refresh")
            .ok()
            .flatten()
    });
    let remote_revoked = match refresh {
        Some(token) => revoke_refresh(&record.client_id, &token).await,
        None => false,
    };
    let _guard = STORAGE_LOCK.lock().unwrap();
    let local_cleared = clear_local_session(&store, &profile_id)?;
    Ok(SignOutResult {
        remote_revoked,
        local_cleared,
    })
}

fn status_with(store: &impl CredentialStore) -> Result<AccountStatus, String> {
    let index = read_index(store)?;
    let mut accounts = Vec::new();
    let mut active_profile_id = None;
    for (n, profile_id) in index.profiles.iter().enumerate() {
        let Some(mut profile) = read_profile(store, profile_id)? else {
            continue;
        };
        retry_old_credentials(store, profile_id, &mut profile);
        let connected = profile
            .generation
            .as_deref()
            .map(|generation| has_bundle(store, profile_id, generation))
            .transpose()?
            .unwrap_or(false);
        let active =
            connected && profile.plan_enabled && index.active.as_deref() == Some(profile_id);
        if active {
            active_profile_id = Some(profile_id.clone());
        }
        let label = match profile.email.as_deref() {
            Some(email) => format!("Conta {} · {email}", n + 1),
            None => format!("Conta ChatGPT {}", n + 1),
        };
        accounts.push(AccountSummary {
            profile_id: profile_id.clone(),
            label,
            connected,
            plan_enabled: profile.plan_enabled,
            active,
        });
    }
    Ok(AccountStatus {
        accounts,
        active_profile_id,
    })
}

fn read_index(store: &impl CredentialStore) -> Result<ProfileIndex, String> {
    let Some(raw) = store.get("siwc-index")? else {
        return Ok(ProfileIndex::default());
    };
    if raw.len() > MAX_INDEX_BYTES {
        return Err("O índice de contas do ChatGPT é inválido.".into());
    }
    let index: ProfileIndex =
        serde_json::from_str(&raw).map_err(|_| "O índice de contas do ChatGPT é inválido.")?;
    let unique: HashSet<&str> = index.profiles.iter().map(String::as_str).collect();
    if unique.len() != index.profiles.len()
        || index.profiles.iter().any(|id| !is_profile_id(id))
        || index
            .active
            .as_deref()
            .is_some_and(|active| !unique.contains(active))
    {
        return Err("O índice de contas do ChatGPT é inválido.".into());
    }
    Ok(index)
}

fn write_index(store: &impl CredentialStore, index: &ProfileIndex) -> Result<(), String> {
    let raw =
        serde_json::to_string(index).map_err(|_| "Não foi possível salvar a lista de contas.")?;
    if raw.len() > MAX_INDEX_BYTES {
        return Err("O limite de contas ChatGPT salvas foi atingido.".into());
    }
    store.set("siwc-index", &raw)
}

fn read_profile(
    store: &impl CredentialStore,
    profile_id: &str,
) -> Result<Option<ProfileRecord>, String> {
    if !is_profile_id(profile_id) {
        return Err("Identificador de conta inválido.".into());
    }
    let Some(raw) = store.get(&metadata_key(profile_id))? else {
        return Ok(None);
    };
    let profile: ProfileRecord =
        serde_json::from_str(&raw).map_err(|_| "Os dados de uma conta ChatGPT estão inválidos.")?;
    if profile_id_for(&profile.client_id) != profile_id
        || !is_issued_client_id(&profile.client_id)
        || profile.subject.is_empty()
        || profile.subject.len() > 512
        || profile
            .email
            .as_deref()
            .is_some_and(|email| email.len() > 320 || email.chars().any(char::is_control))
        || profile
            .generation
            .as_deref()
            .is_some_and(|generation| !is_generation(generation))
        || profile
            .cleanup_generations
            .iter()
            .any(|generation| !is_generation(generation))
    {
        return Err("Os dados de uma conta ChatGPT estão inválidos.".into());
    }
    Ok(Some(profile))
}

fn profile_usable(
    store: &impl CredentialStore,
    profile_id: &str,
    profile: &ProfileRecord,
) -> Result<bool, String> {
    let Some(generation) = profile.generation.as_deref() else {
        return Ok(false);
    };
    Ok(profile.plan_enabled && has_bundle(store, profile_id, generation)?)
}

fn has_bundle(
    store: &impl CredentialStore,
    profile_id: &str,
    generation: &str,
) -> Result<bool, String> {
    let access = read_token(store, profile_id, generation, "access")?;
    let refresh = read_token(store, profile_id, generation, "refresh")?;
    let id = read_token(store, profile_id, generation, "id")?;
    Ok(access.is_some() && refresh.is_some() && id.is_some())
}

fn read_token(
    store: &impl CredentialStore,
    profile_id: &str,
    generation: &str,
    kind: &str,
) -> Result<Option<String>, String> {
    store.get(&token_key(profile_id, generation, kind))
}

fn save_authenticated(
    store: &impl CredentialStore,
    expected_profile: Option<&str>,
    client_id: &str,
    identity: &Identity,
    plan_enabled: bool,
    expires_at: u64,
    tokens: TokenBundle,
) -> Result<String, String> {
    if !is_issued_client_id(client_id)
        || identity.subject.is_empty()
        || identity.subject.len() > 512
    {
        return Err("A identidade devolvida pelo serviço é inválida.".into());
    }
    let profile_id = profile_id_for(client_id);
    if expected_profile.is_some_and(|id| id != profile_id) {
        return Err("O serviço devolveu outro cadastro de conta.".into());
    }
    let mut index = read_index(store)?;
    let old = read_profile(store, &profile_id)?;
    if let Some(old) = old.as_ref() {
        if old.subject != identity.subject {
            return Err(
                "O cadastro já pertence a outra identidade. As credenciais salvas foram mantidas."
                    .into(),
            );
        }
    } else if index.profiles.contains(&profile_id) {
        return Err("Os dados dessa conta estão incompletos.".into());
    }

    let old_generation = old.as_ref().and_then(|profile| profile.generation.clone());
    let mut cleanup_generations = old
        .as_ref()
        .map(|profile| profile.cleanup_generations.clone())
        .unwrap_or_default();
    if let Some(previous) = old_generation.as_ref() {
        if !cleanup_generations.contains(previous) {
            cleanup_generations.push(previous.clone());
        }
    }
    let generation = random_hex(8)?;
    let staged = [
        ("access", tokens.access.as_str()),
        ("refresh", tokens.refresh.as_str()),
        ("id", tokens.id.as_str()),
    ];
    for (kind, value) in staged {
        if let Err(error) = store.set(&token_key(&profile_id, &generation, kind), value) {
            if !clear_generation(store, &profile_id, &generation) {
                retain_cleanup_generation(store, &profile_id, &generation, old.clone());
            }
            return Err(error);
        }
    }

    let mut record = ProfileRecord {
        client_id: client_id.to_string(),
        subject: identity.subject.clone(),
        email: identity.email.clone(),
        plan_enabled,
        expires_at,
        generation: Some(generation.clone()),
        cleanup_generations,
    };
    let record_key = metadata_key(&profile_id);
    let old_raw = match store.get(&record_key) {
        Ok(raw) => raw,
        Err(error) => {
            if !clear_generation(store, &profile_id, &generation) {
                retain_cleanup_generation(store, &profile_id, &generation, old.clone());
            }
            return Err(error);
        }
    };
    let record_raw = match serde_json::to_string(&record) {
        Ok(raw) => raw,
        Err(_) => {
            if !clear_generation(store, &profile_id, &generation) {
                retain_cleanup_generation(store, &profile_id, &generation, old.clone());
            }
            return Err("Não foi possível salvar a conta ChatGPT.".into());
        }
    };
    if let Err(error) = store.set(&record_key, &record_raw) {
        if !clear_generation(store, &profile_id, &generation) {
            retain_cleanup_generation(store, &profile_id, &generation, old.clone());
        }
        return Err(error);
    }

    if !index.profiles.contains(&profile_id) {
        index.profiles.push(profile_id.clone());
    }
    if plan_enabled {
        index.active = Some(profile_id.clone());
    } else if index.active.as_deref() == Some(profile_id.as_str()) {
        index.active = None;
        for candidate in &index.profiles {
            if candidate != &profile_id {
                if let Some(other) = read_profile(store, candidate)? {
                    if profile_usable(store, candidate, &other)? {
                        index.active = Some(candidate.clone());
                        break;
                    }
                }
            }
        }
    }
    if let Err(error) = write_index(store, &index) {
        match old_raw {
            Some(raw) => {
                let _ = store.set(&record_key, &raw);
            }
            None => {
                let _ = store.clear(&record_key);
            }
        }
        if !clear_generation(store, &profile_id, &generation) {
            retain_cleanup_generation(store, &profile_id, &generation, old.clone());
        }
        return Err(error);
    }

    retry_old_credentials(store, &profile_id, &mut record);
    Ok(profile_id)
}

fn retain_cleanup_generation(
    store: &impl CredentialStore,
    profile_id: &str,
    generation: &str,
    fallback: Option<ProfileRecord>,
) {
    let Some(mut profile) = fallback else { return };
    if !profile
        .cleanup_generations
        .iter()
        .any(|pending| pending == generation)
    {
        profile.cleanup_generations.push(generation.to_string());
    }
    if let Ok(raw) = serde_json::to_string(&profile) {
        let _ = store.set(&metadata_key(profile_id), &raw);
    }
}

fn clear_generation(store: &impl CredentialStore, profile_id: &str, generation: &str) -> bool {
    let mut cleared = true;
    for kind in ["access", "refresh", "id"] {
        if store
            .clear(&token_key(profile_id, generation, kind))
            .is_err()
        {
            cleared = false;
        }
    }
    cleared
}

fn retry_old_credentials(
    store: &impl CredentialStore,
    profile_id: &str,
    profile: &mut ProfileRecord,
) {
    if profile.cleanup_generations.is_empty() {
        return;
    }
    let previous = std::mem::take(&mut profile.cleanup_generations);
    for generation in previous.iter() {
        if !clear_generation(store, profile_id, generation) {
            profile.cleanup_generations.push(generation.clone());
        }
    }
    if profile.cleanup_generations != previous {
        let Ok(raw) = serde_json::to_string(profile) else {
            profile.cleanup_generations = previous;
            return;
        };
        if store.set(&metadata_key(profile_id), &raw).is_err() {
            profile.cleanup_generations = previous;
        }
    }
}

fn clear_local_session(store: &impl CredentialStore, profile_id: &str) -> Result<bool, String> {
    let mut profile = read_profile(store, profile_id)?.ok_or("Essa conta não está salva.")?;
    let old_generation = profile.generation.take();
    let mut to_clear = profile.cleanup_generations.clone();
    if let Some(generation) = old_generation.as_ref() {
        if !to_clear.contains(generation) {
            to_clear.push(generation.clone());
        }
    }
    profile.cleanup_generations = to_clear.clone();
    let raw = serde_json::to_string(&profile).map_err(|_| "Não foi possível atualizar a conta.")?;
    let metadata_saved = store.set(&metadata_key(profile_id), &raw).is_ok();
    let mut remaining = Vec::new();
    for generation in &to_clear {
        if !clear_generation(store, profile_id, generation) {
            remaining.push(generation.clone());
        }
    }
    profile.cleanup_generations = remaining.clone();
    if let Ok(raw) = serde_json::to_string(&profile) {
        if store.set(&metadata_key(profile_id), &raw).is_err() {
            profile.cleanup_generations = to_clear;
        }
    }

    if old_generation.is_some() {
        if let Ok(mut index) = read_index(store) {
            if index.active.as_deref() == Some(profile_id) {
                index.active = None;
                for candidate in &index.profiles {
                    if candidate != profile_id {
                        if let Ok(Some(other)) = read_profile(store, candidate) {
                            if profile_usable(store, candidate, &other).unwrap_or(false) {
                                index.active = Some(candidate.clone());
                                break;
                            }
                        }
                    }
                }
                let _ = write_index(store, &index);
            }
        }
    }
    Ok(metadata_saved && remaining.is_empty())
}

fn ensure_host_id(store: &impl CredentialStore) -> Result<String, String> {
    if let Some(id) = store.get("siwc-host-id")? {
        if valid_host_id(&id) {
            return Ok(id);
        }
        return Err("O identificador local do login está inválido.".into());
    }
    let mut bytes = [0u8; 16];
    SystemRandom::new()
        .fill(&mut bytes)
        .map_err(|_| "Não foi possível criar o identificador local do login.")?;
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    let hex = bytes
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect::<String>();
    let id = format!(
        "urn:uuid:{}-{}-{}-{}-{}",
        &hex[0..8],
        &hex[8..12],
        &hex[12..16],
        &hex[16..20],
        &hex[20..32]
    );
    store.set("siwc-host-id", &id)?;
    Ok(id)
}

fn authorization_url(
    client_id: &str,
    initial: bool,
    host_id: &str,
    redirect_uri: &str,
    state: &str,
    nonce: &str,
    challenge: &str,
) -> Result<reqwest::Url, String> {
    let mut url =
        reqwest::Url::parse(AUTHORIZE_URL).map_err(|_| "O endereço de login é inválido.")?;
    {
        let mut query = url.query_pairs_mut();
        query
            .append_pair("client_id", client_id)
            .append_pair("ext_agent_host_id", host_id)
            .append_pair("response_type", "code")
            .append_pair("redirect_uri", redirect_uri)
            .append_pair("scope", SCOPES)
            .append_pair("resource", RESOURCE)
            .append_pair("state", state)
            .append_pair("nonce", nonce)
            .append_pair("code_challenge_method", "S256")
            .append_pair("code_challenge", challenge);
        if initial {
            query.append_pair("agent_name_hint", "Lumen");
        }
    }
    Ok(url)
}

fn profile_id_for(client_id: &str) -> String {
    digest::digest(&digest::SHA256, client_id.as_bytes())
        .as_ref()
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

fn is_profile_id(id: &str) -> bool {
    id.len() == 64
        && id
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

fn is_generation(id: &str) -> bool {
    id.len() == 16
        && id
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

fn valid_host_id(id: &str) -> bool {
    let Some(uuid) = id.strip_prefix("urn:uuid:") else {
        return false;
    };
    uuid.len() == 36
        && [8, 13, 18, 23]
            .iter()
            .all(|index| uuid.as_bytes()[*index] == b'-')
        && uuid.bytes().enumerate().all(|(index, byte)| {
            [8, 13, 18, 23].contains(&index)
                || byte.is_ascii_digit()
                || (b'a'..=b'f').contains(&byte)
        })
}

fn has_plan_scope(scope: &str) -> bool {
    scope
        .split_ascii_whitespace()
        .any(|item| item == "chatgpt.tokens.use.direct")
}

fn is_issued_client_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 256
        && id != DYNAMIC_CLIENT
        && id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'_' | b'-'))
}

fn metadata_key(profile_id: &str) -> String {
    format!("siwc-profile-{profile_id}-meta")
}

fn token_key(profile_id: &str, generation: &str, kind: &str) -> String {
    format!("siwc-profile-{profile_id}-{generation}-{kind}")
}

fn random_url_token(size: usize) -> Result<String, String> {
    let mut bytes = vec![0u8; size];
    SystemRandom::new()
        .fill(&mut bytes)
        .map_err(|_| "Não foi possível preparar o login seguro.")?;
    Ok(URL_SAFE_NO_PAD.encode(bytes))
}

fn random_hex(size: usize) -> Result<String, String> {
    let mut bytes = vec![0u8; size];
    SystemRandom::new()
        .fill(&mut bytes)
        .map_err(|_| "Não foi possível preparar o armazenamento seguro.")?;
    Ok(bytes.iter().map(|byte| format!("{byte:02x}")).collect())
}

fn unix_now() -> Result<u64, String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .map_err(|_| "O relógio do sistema está inválido.".into())
}

fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .https_only(true)
        .redirect(reqwest::redirect::Policy::none())
        .timeout(REQUEST_TIMEOUT)
        .build()
        .map_err(|_| "Não foi possível preparar a conexão segura.".into())
}

async fn discover() -> Result<Discovery, String> {
    let client = http_client()?;
    let response = client
        .get(DISCOVERY_URL)
        .send()
        .await
        .map_err(|_| "Não foi possível acessar o serviço de login.".to_string())?;
    if !response.status().is_success() {
        return Err("O serviço de login não respondeu corretamente.".into());
    }
    let body = net::read_capped(response, MAX_OAUTH_RESPONSE)
        .await
        .map_err(|_| "A resposta do serviço de login é inválida.".to_string())?;
    let config: Discovery = serde_json::from_slice(&body)
        .map_err(|_| "A configuração do serviço de login é inválida.")?;
    if config.issuer != ISSUER
        || config.authorization_endpoint != AUTHORIZE_URL
        || config.token_endpoint != TOKEN_URL
        || config.jwks_uri != JWKS_URL
        || config.revocation_endpoint != REVOKE_URL
    {
        return Err(
            "A configuração do serviço de login não corresponde ao emissor oficial.".into(),
        );
    }
    Ok(config)
}

async fn exchange_code(
    client: &reqwest::Client,
    discovery: &Discovery,
    callback: &Callback,
    redirect_uri: &str,
    verifier: &str,
) -> Result<TokenResponse, String> {
    let response = client
        .post(&discovery.token_endpoint)
        .form(&[
            ("grant_type", "authorization_code"),
            ("client_id", callback.client_id.as_str()),
            ("code", callback.code.as_str()),
            ("redirect_uri", redirect_uri),
            ("code_verifier", verifier),
            ("resource", RESOURCE),
        ])
        .send()
        .await
        .map_err(|_| "Não foi possível concluir o login ChatGPT.".to_string())?;
    if !response.status().is_success() {
        return Err("O serviço recusou a troca do código de login.".into());
    }
    let body = net::read_capped(response, MAX_OAUTH_RESPONSE)
        .await
        .map_err(|_| "A resposta do login ChatGPT é inválida.".to_string())?;
    parse_token_response(&body)
}

fn parse_token_response(body: &[u8]) -> Result<TokenResponse, String> {
    let token: TokenResponse =
        serde_json::from_slice(body).map_err(|_| "A resposta do login ChatGPT é inválida.")?;
    if token.access_token.is_empty()
        || token.refresh_token.is_empty()
        || token.id_token.is_empty()
        || !token.token_type.eq_ignore_ascii_case("bearer")
        || token.expires_in == 0
        || token.scope.is_empty()
    {
        return Err("O serviço devolveu credenciais incompletas.".into());
    }
    Ok(token)
}

async fn fetch_jwks(client: &reqwest::Client, discovery: &Discovery) -> Result<JwkSet, String> {
    let response = client
        .get(&discovery.jwks_uri)
        .send()
        .await
        .map_err(|_| "Não foi possível validar a identidade ChatGPT.".to_string())?;
    if !response.status().is_success() {
        return Err("Não foi possível validar a identidade ChatGPT.".into());
    }
    let body = net::read_capped(response, MAX_OAUTH_RESPONSE)
        .await
        .map_err(|_| "A resposta de validação da identidade é inválida.".to_string())?;
    serde_json::from_slice(&body).map_err(|_| "A lista de chaves de identidade é inválida.".into())
}

fn validate_id_token(
    token: &str,
    jwks: &JwkSet,
    client_id: &str,
    nonce: &str,
) -> Result<Identity, String> {
    let header =
        decode_header(token).map_err(|_| "O token de identidade é inválido.".to_string())?;
    if header.alg != Algorithm::RS256 {
        return Err("O token de identidade usa uma assinatura não permitida.".into());
    }
    let kid = header
        .kid
        .ok_or("O token de identidade não informa a chave de assinatura.")?;
    let jwk = jwks
        .find(&kid)
        .ok_or("A chave de assinatura do token não foi encontrada.")?;
    let key =
        DecodingKey::from_jwk(jwk).map_err(|_| "A chave de assinatura do token é inválida.")?;
    let mut validation = Validation::new(Algorithm::RS256);
    validation.set_issuer(&[ISSUER]);
    validation.set_audience(&[client_id]);
    validation.validate_nbf = true;
    let claims = decode::<IdClaims>(token, &key, &validation)
        .map_err(|_| "A assinatura ou os dados do token de identidade não passaram na validação.")?
        .claims;
    if claims.sub.is_empty()
        || claims.sub.len() > 512
        || !constant_eq(claims.nonce.as_bytes(), nonce.as_bytes())
    {
        return Err(
            "A identidade devolvida pelo serviço não corresponde a esta tentativa de login.".into(),
        );
    }
    let email = if claims.email_verified == Some(true) {
        claims
            .email
            .filter(|value| value.len() <= 320 && !value.chars().any(char::is_control))
    } else {
        None
    };
    Ok(Identity {
        subject: claims.sub,
        email,
    })
}

async fn revoke_refresh(client_id: &str, refresh_token: &str) -> bool {
    let Ok(discovery) = discover().await else {
        return false;
    };
    let Ok(client) = http_client() else {
        return false;
    };
    for delay in [Duration::ZERO, Duration::from_millis(500)] {
        if !delay.is_zero() {
            tokio::time::sleep(delay).await;
        }
        let response = client
            .post(&discovery.revocation_endpoint)
            .form(&[
                ("token", refresh_token),
                ("token_type_hint", "refresh_token"),
                ("client_id", client_id),
            ])
            .send()
            .await;
        match response {
            Ok(response) if response.status().as_u16() == 200 => return true,
            Ok(response) if response.status().is_server_error() => continue,
            _ => return false,
        }
    }
    false
}

fn parse_callback_target(
    target: &str,
    state: &str,
    expected_client_id: Option<&str>,
) -> CallbackParse {
    let Ok(url) = reqwest::Url::parse(&format!("http://127.0.0.1{target}")) else {
        return CallbackParse::Invalid;
    };
    if url.path() != CALLBACK_PATH {
        return CallbackParse::NotForUs;
    }
    let mut values = std::collections::HashMap::<String, Vec<String>>::new();
    for (key, value) in url.query_pairs() {
        values
            .entry(key.into_owned())
            .or_default()
            .push(value.into_owned());
    }
    let one = |name: &str| -> Option<&str> {
        values
            .get(name)
            .and_then(|v| (v.len() == 1).then(|| v[0].as_str()))
    };
    let Some(returned_state) = one("state") else {
        return CallbackParse::Invalid;
    };
    if !constant_eq(returned_state.as_bytes(), state.as_bytes()) {
        return CallbackParse::Invalid;
    }
    if values.get("error").is_some_and(|v| v.len() != 1) {
        return CallbackParse::Invalid;
    }
    if one("error").is_some() {
        return CallbackParse::Failed("A autorização no navegador foi cancelada ou recusada.");
    }
    let Some(code) = one("code") else {
        return CallbackParse::Failed("O serviço não devolveu um código de autorização válido.");
    };
    if code.is_empty() || code.len() > 4096 || code.chars().any(char::is_control) {
        return CallbackParse::Failed("O serviço não devolveu um código de autorização válido.");
    }
    if values.get("client_id").is_some_and(|v| v.len() != 1) {
        return CallbackParse::Failed("O serviço devolveu um cadastro de conta inválido.");
    }
    let returned_client = one("client_id");
    let client_id = match expected_client_id {
        Some(expected) => {
            if returned_client.is_some_and(|returned| returned != expected) {
                return CallbackParse::Failed("O serviço devolveu um cadastro de conta diferente.");
            }
            expected.to_string()
        }
        None => {
            let Some(returned) = returned_client else {
                return CallbackParse::Failed(
                    "O primeiro cadastro não devolveu seu identificador.",
                );
            };
            if !is_issued_client_id(returned) {
                return CallbackParse::Failed(
                    "O primeiro cadastro devolveu um identificador inválido.",
                );
            }
            returned.to_string()
        }
    };
    CallbackParse::Accepted(Callback {
        code: code.to_string(),
        client_id,
    })
}

fn constant_eq(left: &[u8], right: &[u8]) -> bool {
    left.len() == right.len() && bool::from(left.ct_eq(right))
}

async fn wait_for_callback(
    listener: TcpListener,
    state: &str,
    expected_client_id: Option<&str>,
) -> Result<Callback, String> {
    let deadline = Instant::now() + AUTH_TIMEOUT;
    loop {
        let (mut stream, peer) = timeout_at(deadline, listener.accept())
            .await
            .map_err(|_| "O login expirou. Tente conectar novamente.".to_string())?
            .map_err(|_| "Não foi possível receber o retorno do login.".to_string())?;
        if !peer.ip().is_loopback() {
            continue;
        }
        let target = read_request_target(&mut stream, deadline).await;
        let parsed = match target {
            Ok(target) => parse_callback_target(&target, state, expected_client_id),
            Err(()) => CallbackParse::Invalid,
        };
        match parsed {
            CallbackParse::NotForUs => {
                respond(&mut stream, 404).await;
            }
            CallbackParse::Invalid => {
                respond(&mut stream, 400).await;
            }
            CallbackParse::Failed(error) => {
                respond(&mut stream, 200).await;
                return Err(error.into());
            }
            CallbackParse::Accepted(callback) => {
                respond(&mut stream, 200).await;
                return Ok(callback);
            }
        }
    }
}

async fn read_request_target(stream: &mut TcpStream, deadline: Instant) -> Result<String, ()> {
    let mut request = Vec::with_capacity(1024);
    let mut chunk = [0u8; 2048];
    loop {
        let size = timeout_at(deadline, stream.read(&mut chunk))
            .await
            .map_err(|_| ())?
            .map_err(|_| ())?;
        if size == 0 || request.len() + size > MAX_HTTP_REQUEST {
            return Err(());
        }
        request.extend_from_slice(&chunk[..size]);
        if request.windows(4).any(|window| window == b"\r\n\r\n") {
            break;
        }
    }
    let first = std::str::from_utf8(&request)
        .map_err(|_| ())?
        .split("\r\n")
        .next()
        .ok_or(())?;
    let mut parts = first.split_ascii_whitespace();
    if parts.next() != Some("GET") {
        return Err(());
    }
    let target = parts.next().ok_or(())?;
    if !target.starts_with('/') || target.starts_with("//") {
        return Err(());
    }
    Ok(target.to_string())
}

async fn respond(stream: &mut TcpStream, status: u16) {
    let (label, body) = if status == 200 {
        ("OK", "<!doctype html><meta charset=utf-8><meta name=referrer content=no-referrer><title>Lumen</title><p>Você pode voltar ao Lumen.</p><script>history.replaceState(null,'','/auth/callback')</script>")
    } else if status == 404 {
        ("Not Found", "Retorno não encontrado.")
    } else {
        ("Bad Request", "Não foi possível validar este retorno.")
    };
    let response = format!(
        "HTTP/1.1 {status} {label}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nCache-Control: no-store\r\nReferrer-Policy: no-referrer\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n{body}",
        body.len()
    );
    let _ = stream.write_all(response.as_bytes()).await;
    let _ = stream.shutdown().await;
}

struct ActiveSession {
    profile_id: String,
    generation: String,
    client_id: String,
    subject: String,
    plan_enabled: bool,
    expires_at: u64,
    access: String,
    refresh: String,
    id: String,
}

fn read_active_session(store: &impl CredentialStore) -> Result<ActiveSession, String> {
    let index = read_index(store)?;
    let profile_id = index
        .active
        .ok_or_else(|| "Conecte uma conta ChatGPT com acesso ao plano em Configurações.".to_string())?;
    let profile = read_profile(store, &profile_id)?
        .ok_or_else(|| "Conecte uma conta ChatGPT com acesso ao plano em Configurações.".to_string())?;
    let generation = profile
        .generation
        .clone()
        .filter(|_| profile.plan_enabled)
        .ok_or_else(|| "Conecte uma conta ChatGPT com acesso ao plano em Configurações.".to_string())?;
    let access = read_token(store, &profile_id, &generation, "access")?
        .ok_or_else(|| "Sessão ChatGPT desconectada. Reconecte a conta em Configurações.".to_string())?;
    let refresh = read_token(store, &profile_id, &generation, "refresh")?
        .ok_or_else(|| "Sessão ChatGPT desconectada. Reconecte a conta em Configurações.".to_string())?;
    let id = read_token(store, &profile_id, &generation, "id")?
        .ok_or_else(|| "Sessão ChatGPT desconectada. Reconecte a conta em Configurações.".to_string())?;
    Ok(ActiveSession {
        profile_id,
        generation,
        client_id: profile.client_id,
        subject: profile.subject,
        plan_enabled: profile.plan_enabled,
        expires_at: profile.expires_at,
        access,
        refresh,
        id,
    })
}

fn save_refreshed(
    store: &impl CredentialStore,
    profile_id: &str,
    expected_subject: &str,
    plan_enabled: bool,
    expires_at: u64,
    tokens: TokenBundle,
) -> Result<String, String> {
    let mut record = read_profile(store, profile_id)?.ok_or("Essa conta foi desconectada.")?;
    let Some(old_generation) = record.generation.clone() else {
        return Err("Essa conta foi desconectada.".into());
    };
    if record.subject != expected_subject {
        return Err("A identidade da conta foi alterada durante a atualização.".into());
    }
    let old_record = record.clone();
    if !record.cleanup_generations.contains(&old_generation) {
        record.cleanup_generations.push(old_generation);
    }
    let generation = random_hex(8)?;
    let staged = [
        ("access", tokens.access.as_str()),
        ("refresh", tokens.refresh.as_str()),
        ("id", tokens.id.as_str()),
    ];
    for (kind, value) in staged {
        if let Err(error) = store.set(&token_key(profile_id, &generation, kind), value) {
            if !clear_generation(store, profile_id, &generation) {
                retain_cleanup_generation(store, profile_id, &generation, Some(old_record));
            }
            return Err(error);
        }
    }
    record.plan_enabled = plan_enabled;
    record.expires_at = expires_at;
    record.generation = Some(generation.clone());
    let record_raw =
        serde_json::to_string(&record).map_err(|_| "Não foi possível atualizar a conta ChatGPT.")?;
    if let Err(error) = store.set(&metadata_key(profile_id), &record_raw) {
        if !clear_generation(store, profile_id, &generation) {
            retain_cleanup_generation(store, profile_id, &generation, Some(old_record));
        }
        return Err(error);
    }
    if !plan_enabled {
        let mut index = read_index(store)?;
        if index.active.as_deref() == Some(profile_id) {
            index.active = None;
            for candidate in &index.profiles {
                if candidate != profile_id {
                    if let Some(other) = read_profile(store, candidate)? {
                        if profile_usable(store, candidate, &other)? {
                            index.active = Some(candidate.clone());
                            break;
                        }
                    }
                }
            }
            let _ = write_index(store, &index);
        }
    }
    retry_old_credentials(store, profile_id, &mut record);
    Ok(generation)
}

async fn ensure_access_token_with(
    store: &impl CredentialStore,
    client: &reqwest::Client,
    token_url: &str,
    stale_generation: Option<&str>,
) -> Result<(String, String), String> {
    let now = unix_now()?;
    let needs_refresh = {
        let _guard = STORAGE_LOCK.lock().unwrap();
        let session = read_active_session(store)?;
        if stale_generation.is_none_or(|gen| gen != session.generation)
            && now.saturating_add(REFRESH_MARGIN_SECS) < session.expires_at
        {
            return Ok((session.access, session.generation));
        }
        session
    };

    let _refresh_guard = REFRESH_LOCK.lock().await;
    let current = {
        let _guard = STORAGE_LOCK.lock().unwrap();
        let session = read_active_session(store)?;
        let now = unix_now()?;
        let rotated_by_peer = stale_generation
            .map(|gen| session.generation != gen)
            .unwrap_or_else(|| session.generation != needs_refresh.generation);
        if rotated_by_peer && now.saturating_add(REFRESH_MARGIN_SECS) < session.expires_at {
            return Ok((session.access, session.generation));
        }
        if stale_generation.is_none() && now.saturating_add(REFRESH_MARGIN_SECS) < session.expires_at
        {
            return Ok((session.access, session.generation));
        }
        session
    };

    let response = client
        .post(token_url)
        .form(&[
            ("grant_type", "refresh_token"),
            ("client_id", current.client_id.as_str()),
            ("refresh_token", current.refresh.as_str()),
            ("resource", RESOURCE),
        ])
        .send()
        .await
        .map_err(|_| "Não foi possível renovar a sessão ChatGPT.".to_string())?;
    let status = response.status();
    if status.as_u16() == 400 || status.as_u16() == 401 {
        return Err("Sua sessão ChatGPT expirou ou foi revogada. Reconecte a conta em Configurações.".into());
    }
    if !status.is_success() {
        return Err("Não foi possível renovar a sessão ChatGPT.".into());
    }
    let body = net::read_capped(response, MAX_OAUTH_RESPONSE)
        .await
        .map_err(|_| "A resposta de renovação da sessão ChatGPT é inválida.".to_string())?;
    let refreshed: RefreshResponse = serde_json::from_slice(&body)
        .map_err(|_| "A resposta de renovação da sessão ChatGPT é inválida.")?;
    if refreshed.access_token.is_empty()
        || !refreshed.token_type.eq_ignore_ascii_case("bearer")
        || refreshed.expires_in == 0
    {
        return Err("O serviço devolveu credenciais incompletas ao renovar a sessão.".into());
    }
    let next_refresh = refreshed
        .refresh_token
        .filter(|value| !value.is_empty())
        .unwrap_or(current.refresh);
    let next_plan = refreshed
        .scope
        .as_deref()
        .map(has_plan_scope)
        .unwrap_or(current.plan_enabled);
    let next_expires_at = unix_now()?
        .checked_add(refreshed.expires_in)
        .ok_or("Validade do token inválida.")?;
    let next_access = refreshed.access_token;

    let next_generation = {
        let _guard = STORAGE_LOCK.lock().unwrap();
        save_refreshed(
            store,
            &current.profile_id,
            &current.subject,
            next_plan,
            next_expires_at,
            TokenBundle {
                access: next_access.clone(),
                refresh: next_refresh,
                id: current.id,
            },
        )?
    };
    if !next_plan {
        return Err("Sua conta ChatGPT não tem mais permissão de uso do plano.".into());
    }
    Ok((next_access, next_generation))
}

fn parse_models_response(json: &Value) -> Vec<ModelInfo> {
    if let Some(items) = json.get("models").and_then(Value::as_array) {
        return items
            .iter()
            .filter(|m| m.get("visibility").and_then(Value::as_str) == Some("list"))
            .filter_map(|m| {
                let slug = m.get("slug").and_then(Value::as_str)?.trim();
                if slug.is_empty() {
                    return None;
                }
                let label = m
                    .get("display_name")
                    .and_then(Value::as_str)
                    .map(str::trim)
                    .filter(|s| !s.is_empty())
                    .unwrap_or(slug);
                Some(ModelInfo {
                    id: slug.to_string(),
                    label: label.to_string(),
                })
            })
            .collect();
    }
    json.get("data")
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(|m| {
                    let id = m.get("id").and_then(Value::as_str)?.trim();
                    if id.is_empty() {
                        return None;
                    }
                    let label = m
                        .get("display_name")
                        .or_else(|| m.get("name"))
                        .and_then(Value::as_str)
                        .map(str::trim)
                        .filter(|s| !s.is_empty())
                        .unwrap_or(id);
                    Some(ModelInfo {
                        id: id.to_string(),
                        label: label.to_string(),
                    })
                })
                .collect()
        })
        .unwrap_or_default()
}

fn status_error(status: u16, detail: &str) -> String {
    match status {
        401 | 403 => "Sua sessão ChatGPT expirou ou perdeu acesso ao plano. Reconecte a conta em Configurações.".into(),
        404 => format!("Modelo do ChatGPT não encontrado (404). Escolha outro modelo acima do chat. {detail}"),
        429 => format!("Limite temporário do plano ChatGPT atingido (429). {detail}"),
        _ => {
            if detail.is_empty() {
                format!("ChatGPT ({status})")
            } else {
                format!("ChatGPT ({status}): {detail}")
            }
        }
    }
}

async fn models_with(
    store: &impl CredentialStore,
    client: &reqwest::Client,
    token_url: &str,
    models_url: &str,
) -> Result<Vec<ModelInfo>, String> {
    let (mut access, mut generation) =
        ensure_access_token_with(store, client, token_url, None).await?;
    for attempt in 0..2 {
        let response = client
            .get(models_url)
            .bearer_auth(&access)
            .send()
            .await
            .map_err(|e| format!("Erro de rede ao consultar modelos ChatGPT: {e}"))?;
        let status = response.status();
        if status.as_u16() == 401 && attempt == 0 {
            (access, generation) =
                ensure_access_token_with(store, client, token_url, Some(&generation)).await?;
            continue;
        }
        if !status.is_success() {
            let body = net::read_capped(response, net::MAX_ERROR_BODY)
                .await
                .unwrap_or_default();
            return Err(status_error(status.as_u16(), &net::error_detail(&body)));
        }
        let bytes = net::read_capped(response, net::MAX_BODY).await?;
        let json: Value = serde_json::from_slice(&bytes)
            .map_err(|_| "A resposta da lista de modelos ChatGPT é inválida.".to_string())?;
        return Ok(parse_models_response(&json));
    }
    Err("Sua sessão ChatGPT expirou. Reconecte a conta em Configurações.".into())
}

fn user_message(first: bool, context: Option<&ChatContext>, query: &str) -> Value {
    let mut prefix = String::new();
    let mut image_url = None;
    match chat::for_turn(first, context) {
        Some(ChatContext::File { name, path }) => match openai_compat::read_attachment(path) {
            Some(Attachment::ImageDataUrl(url)) => {
                image_url = Some(url);
                prefix = format!("File: {name}\n\n");
            }
            Some(Attachment::Text(body)) => prefix = format!("File: {name}\nFile contents:\n{body}\n\n"),
            None => prefix = format!("File: {name}\n\n"),
        },
        Some(ChatContext::Window { app_name, title, url }) => {
            prefix = format!("{}\n\n", chat::window_line(app_name, title, url.as_deref()));
        }
        None => {}
    }
    let text = format!("{prefix}{query}");
    let mut parts = vec![json!({ "type": "input_text", "text": text })];
    if let Some(url) = image_url {
        parts.push(json!({ "type": "input_image", "image_url": url }));
    }
    json!({ "role": "user", "content": parts })
}

fn history_item_to_responses(item: &Value) -> Value {
    let role = item.get("role").and_then(Value::as_str).unwrap_or("user");
    let content = &item["content"];
    if content.is_array() {
        return json!({ "role": role, "content": content });
    }
    let text = content.as_str().unwrap_or_default();
    let block_type = if role == "assistant" { "output_text" } else { "input_text" };
    json!({
        "role": role,
        "content": [{ "type": block_type, "text": text }],
    })
}

fn build_responses_body(model: &str, system: &str, history: &[Value], user: &Value) -> Value {
    let mut input: Vec<Value> = history.iter().map(history_item_to_responses).collect();
    input.push(user.clone());
    json!({
        "model": model,
        "store": false,
        "stream": true,
        "instructions": system,
        "input": input,
    })
}

enum SseEvent {
    Delta(String),
    Completed(String),
}

fn completed_output_text(json: &Value) -> String {
    let mut text = String::new();
    let Some(outputs) = json.pointer("/response/output").and_then(Value::as_array) else {
        return text;
    };
    for item in outputs {
        if let Some(parts) = item.get("content").and_then(Value::as_array) {
            for part in parts {
                if part.get("type").and_then(Value::as_str) == Some("output_text") {
                    if let Some(chunk) = part.get("text").and_then(Value::as_str) {
                        text.push_str(chunk);
                    }
                }
            }
        }
    }
    text
}

fn parse_sse_line(line: &str) -> Option<Result<SseEvent, String>> {
    let payload = line.strip_prefix("data:")?.trim_start();
    if payload.is_empty() || payload == "[DONE]" {
        return None;
    }
    let json: Value = serde_json::from_str(payload).ok()?;
    let event_type = json.get("type").and_then(Value::as_str).unwrap_or("");
    if event_type == "error" || event_type == "response.failed" {
        let msg = json
            .pointer("/error/message")
            .or_else(|| json.pointer("/response/error/message"))
            .or_else(|| json.get("message"))
            .and_then(Value::as_str)
            .unwrap_or("O ChatGPT não conseguiu concluir esta resposta.");
        return Some(Err(msg.to_string()));
    }
    if event_type == "response.output_text.delta" {
        if let Some(delta) = json.get("delta").and_then(Value::as_str) {
            if !delta.is_empty() {
                return Some(Ok(SseEvent::Delta(delta.to_string())));
            }
        }
        return None;
    }
    if event_type == "response.completed" {
        let completed = completed_output_text(&json);
        if !completed.is_empty() {
            return Some(Ok(SseEvent::Completed(completed)));
        }
    }
    None
}

async fn send_with_endpoints(
    store: &impl CredentialStore,
    meta_client: &reqwest::Client,
    stream_client: &reqwest::Client,
    token_url: &str,
    models_url: &str,
    responses_url: &str,
    chat: &Chat,
    model: &str,
    query: String,
    context: Option<ChatContext>,
    mut on_delta: impl FnMut(String),
) -> Result<ChatReply, String> {
    let resolved_model = if model.trim().is_empty() {
        models_with(store, meta_client, token_url, models_url)
            .await?
            .into_iter()
            .next()
            .map(|m| m.id)
            .ok_or_else(|| "Nenhum modelo habilitado foi encontrado na sua conta ChatGPT.".to_string())?
    } else {
        model.trim().to_string()
    };

    let (mut access, mut generation) =
        ensure_access_token_with(store, meta_client, token_url, None).await?;
    let turn = chat.begin("chatgpt");
    let user = user_message(turn.first, context.as_ref(), &query);
    let body = build_responses_body(
        &resolved_model,
        &chat::system_prompt(false),
        &turn.history,
        &user,
    );

    let mut reply = None;
    for attempt in 0..2 {
        let response = stream_client
            .post(responses_url)
            .bearer_auth(&access)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Erro de rede ao falar com o ChatGPT: {e}"))?;
        let status = response.status();
        if status.as_u16() == 401 && attempt == 0 {
            (access, generation) =
                ensure_access_token_with(store, meta_client, token_url, Some(&generation)).await?;
            continue;
        }
        if !status.is_success() {
            let err_body = net::read_capped(response, net::MAX_ERROR_BODY)
                .await
                .unwrap_or_default();
            return Err(status_error(status.as_u16(), &net::error_detail(&err_body)));
        }
        reply = Some(response);
        break;
    }
    let mut reply = reply
        .ok_or_else(|| "Sua sessão ChatGPT expirou. Reconecte a conta em Configurações.".to_string())?;

    let mut accumulated = String::new();
    let mut completed_fallback = String::new();
    let mut pending = Vec::<u8>::new();
    let mut last = WallInstant::now()
        .checked_sub(DELTA_INTERVAL)
        .unwrap_or_else(WallInstant::now);

    while let Some(chunk) = reply
        .chunk()
        .await
        .map_err(|e| format!("Conexão interrompida durante a resposta do ChatGPT: {e}"))?
    {
        pending.extend_from_slice(&chunk);
        while let Some(end) = pending.iter().position(|b| *b == b'\n') {
            let line: Vec<u8> = pending.drain(..=end).collect();
            let line = String::from_utf8_lossy(&line);
            match parse_sse_line(line.trim_end()) {
                Some(Ok(SseEvent::Delta(delta))) => accumulated.push_str(&delta),
                Some(Ok(SseEvent::Completed(full))) => {
                    if completed_fallback.is_empty() {
                        completed_fallback = full;
                    }
                }
                Some(Err(message)) => return Err(message),
                None => {}
            }
        }
        if pending.len() > MAX_SSE_LINE || accumulated.len() > MAX_ANSWER_BYTES {
            return Err("A resposta do ChatGPT excedeu o limite suportado.".into());
        }
        if !accumulated.is_empty() && last.elapsed() >= DELTA_INTERVAL {
            last = WallInstant::now();
            on_delta(accumulated.clone());
        }
    }
    if let Some(Ok(event)) = parse_sse_line(String::from_utf8_lossy(&pending).trim_end()) {
        match event {
            SseEvent::Delta(delta) => accumulated.push_str(&delta),
            SseEvent::Completed(full) if completed_fallback.is_empty() => completed_fallback = full,
            _ => {}
        }
    }
    let answer = if accumulated.trim().is_empty() {
        completed_fallback.trim().to_string()
    } else {
        accumulated.trim().to_string()
    };
    if answer.is_empty() {
        return Err("O ChatGPT não retornou texto na resposta.".into());
    }
    on_delta(answer.clone());

    let plain = chat::plain_question(turn.first, context.as_ref(), &query);
    chat.commit(
        &turn,
        user,
        json!({ "role": "assistant", "content": [{ "type": "output_text", "text": answer }] }),
        &plain,
        &answer,
    );
    Ok(ChatReply { text: answer })
}

#[cfg(test)]
mod tests {
    use super::*;
    use base64::engine::general_purpose::{STANDARD, URL_SAFE_NO_PAD};
    use jsonwebtoken::{encode, EncodingKey, Header};
    use serde::Serialize;
    use std::collections::HashMap;
    use std::sync::Mutex;

    #[derive(Serialize)]
    struct TestClaims<'a> {
        iss: &'a str,
        aud: &'a str,
        sub: &'a str,
        exp: u64,
        nonce: &'a str,
        email: &'a str,
        email_verified: bool,
    }

    fn synthetic_keys() -> (EncodingKey, JwkSet) {
        // Synthetic-only RSA key pair; its public half is the fixture JWKS beside this source.
        let fixture: serde_json::Value =
            serde_json::from_str(include_str!("../tests/fixtures/chatgpt-jwt-synthetic.json"))
                .unwrap();
        let private_der = STANDARD
            .decode(fixture["privateDer"].as_str().unwrap())
            .unwrap();
        let signing_key = EncodingKey::from_rsa_der(&private_der);
        let jwks = serde_json::from_value(fixture["jwks"].clone()).unwrap();
        (signing_key, jwks)
    }

    fn synthetic_id_token(issuer: &str, audience: &str, nonce: &str, exp: u64) -> String {
        let (key, _) = synthetic_keys();
        let mut header = Header::new(Algorithm::RS256);
        header.kid = Some("synthetic-kid".into());
        encode(
            &header,
            &TestClaims {
                iss: issuer,
                aud: audience,
                sub: "synthetic-subject",
                exp,
                nonce,
                email: "synthetic@example.test",
                email_verified: true,
            },
            &key,
        )
        .unwrap()
    }

    #[derive(Default)]
    struct MemoryStore {
        values: Mutex<HashMap<String, String>>,
        writes: Mutex<usize>,
        fail_at: Mutex<Option<usize>>,
    }

    impl MemoryStore {
        fn fail_on_write(&self, write: usize) {
            *self.fail_at.lock().unwrap() = Some(write);
            *self.writes.lock().unwrap() = 0;
        }
    }

    impl CredentialStore for MemoryStore {
        fn get(&self, key: &str) -> Result<Option<String>, String> {
            Ok(self.values.lock().unwrap().get(key).cloned())
        }

        fn set(&self, key: &str, value: &str) -> Result<(), String> {
            let mut writes = self.writes.lock().unwrap();
            *writes += 1;
            if *self.fail_at.lock().unwrap() == Some(*writes) {
                return Err("synthetic store failure".into());
            }
            self.values.lock().unwrap().insert(key.into(), value.into());
            Ok(())
        }

        fn clear(&self, key: &str) -> Result<(), String> {
            self.values.lock().unwrap().remove(key);
            Ok(())
        }
    }

    fn tokens(suffix: &str) -> TokenBundle {
        TokenBundle {
            access: format!("access-{suffix}"),
            refresh: format!("refresh-{suffix}"),
            id: format!("id-{suffix}"),
        }
    }

    fn identity(subject: &str, email: &str) -> Identity {
        Identity {
            subject: subject.into(),
            email: Some(email.into()),
        }
    }

    fn save(
        store: &MemoryStore,
        expected: Option<&str>,
        client: &str,
        subject: &str,
        suffix: &str,
        plan: bool,
    ) -> Result<String, String> {
        save_authenticated(
            store,
            expected,
            client,
            &identity(subject, "synthetic@example.test"),
            plan,
            4_000_000_000,
            tokens(suffix),
        )
    }

    #[test]
    fn callback_accepts_only_state_bound_callbacks_for_the_exact_path_and_client() {
        let ok = parse_callback_target(
            "/auth/callback?code=synthetic&state=s&client_id=oaiapp_test",
            "s",
            None,
        );
        assert!(matches!(ok, CallbackParse::Accepted(_)));
        assert!(matches!(
            parse_callback_target("/callback?code=x&state=s&client_id=oaiapp_test", "s", None),
            CallbackParse::NotForUs
        ));
        assert!(matches!(
            parse_callback_target(
                "/auth/callback?code=x&state=wrong&client_id=oaiapp_test",
                "s",
                None
            ),
            CallbackParse::Invalid
        ));
        assert!(matches!(
            parse_callback_target("/auth/callback?code=x&state=s", "s", None),
            CallbackParse::Failed(_)
        ));
        assert!(matches!(
            parse_callback_target(
                "/auth/callback?code=x&state=s&client_id=another",
                "s",
                Some("oaiapp_expected")
            ),
            CallbackParse::Failed(_)
        ));
        assert!(matches!(
            parse_callback_target("/auth/callback?error=access_denied&state=s", "s", None),
            CallbackParse::Failed(_)
        ));
        assert!(matches!(
            parse_callback_target(
                "/auth/callback?code=a&code=b&state=s&client_id=oaiapp_test",
                "s",
                None
            ),
            CallbackParse::Failed(_)
        ));
    }

    #[test]
    fn id_token_requires_the_openai_signature_issuer_audience_expiry_and_nonce() {
        let (_, jwks) = synthetic_keys();
        let expiry = unix_now().unwrap() + 3600;
        let valid = synthetic_id_token(ISSUER, "oaiapp_test", "nonce", expiry);
        let identity = validate_id_token(&valid, &jwks, "oaiapp_test", "nonce").unwrap();
        assert_eq!(identity.subject, "synthetic-subject");
        assert_eq!(identity.email.as_deref(), Some("synthetic@example.test"));

        for (issuer, audience, nonce, exp) in [
            ("https://issuer.invalid", "oaiapp_test", "nonce", expiry),
            (ISSUER, "oaiapp_other", "nonce", expiry),
            (ISSUER, "oaiapp_test", "other", expiry),
            (ISSUER, "oaiapp_test", "nonce", 1),
        ] {
            let invalid = synthetic_id_token(issuer, audience, nonce, exp);
            assert!(validate_id_token(&invalid, &jwks, "oaiapp_test", "nonce").is_err());
        }

        let mut parts = valid.split('.').map(str::to_string).collect::<Vec<_>>();
        let mut signature = URL_SAFE_NO_PAD.decode(&parts[2]).unwrap();
        signature[0] ^= 1;
        parts[2] = URL_SAFE_NO_PAD.encode(signature);
        assert!(validate_id_token(&parts.join("."), &jwks, "oaiapp_test", "nonce").is_err());
    }

    #[test]
    fn token_responses_require_a_refreshable_bearer_session_and_match_the_plan_scope_exactly() {
        let body = br#"{"access_token":"a","refresh_token":"r","id_token":"i","token_type":"Bearer","expires_in":3600,"scope":"openid offline_access chatgpt.tokens.use.direct"}"#;
        let token = parse_token_response(body).unwrap();
        assert!(has_plan_scope(&token.scope));
        assert!(!has_plan_scope("openid chatgpt.tokens.use.directish"));
        let no_refresh = br#"{"access_token":"a","refresh_token":"","id_token":"i","token_type":"Bearer","expires_in":3600,"scope":"openid"}"#;
        assert!(parse_token_response(no_refresh).is_err());
        let wrong_type = br#"{"access_token":"a","refresh_token":"r","id_token":"i","token_type":"MAC","expires_in":3600,"scope":"openid"}"#;
        assert!(parse_token_response(wrong_type).is_err());
    }

    #[test]
    fn registrations_are_isolated_and_the_webview_summary_never_contains_tokens() {
        let store = MemoryStore::default();
        let first = save(&store, None, "oaiapp_first", "subject-1", "first", true).unwrap();
        let second = save(&store, None, "oaiapp_second", "subject-1", "second", true).unwrap();
        assert_ne!(first, second);
        let status = status_with(&store).unwrap();
        assert_eq!(status.accounts.len(), 2);
        assert_ne!(status.accounts[0].label, status.accounts[1].label);
        assert_eq!(status.active_profile_id.as_deref(), Some(second.as_str()));
        let json = serde_json::to_string(&status).unwrap();
        for token in [
            "access-first",
            "refresh-first",
            "id-first",
            "access-second",
            "refresh-second",
            "id-second",
        ] {
            assert!(!json.contains(token));
        }
        assert_eq!(
            store
                .get(&token_key(
                    &first,
                    &read_profile(&store, &first)
                        .unwrap()
                        .unwrap()
                        .generation
                        .unwrap(),
                    "access"
                ))
                .unwrap()
                .as_deref(),
            Some("access-first")
        );
    }

    #[test]
    fn reauthorization_failure_keeps_the_previous_credential_set() {
        let store = MemoryStore::default();
        let profile = save(&store, None, "oaiapp_existing", "subject-1", "old", true).unwrap();
        let original_generation = read_profile(&store, &profile)
            .unwrap()
            .unwrap()
            .generation
            .unwrap();
        store.fail_on_write(2);
        assert!(save(
            &store,
            Some(&profile),
            "oaiapp_existing",
            "subject-1",
            "new",
            true
        )
        .is_err());
        assert_eq!(
            read_profile(&store, &profile)
                .unwrap()
                .unwrap()
                .generation
                .as_deref(),
            Some(original_generation.as_str())
        );
        assert_eq!(
            read_token(&store, &profile, &original_generation, "access")
                .unwrap()
                .as_deref(),
            Some("access-old")
        );
        assert_eq!(
            read_token(&store, &profile, &original_generation, "refresh")
                .unwrap()
                .as_deref(),
            Some("refresh-old")
        );
        assert_eq!(
            read_token(&store, &profile, &original_generation, "id")
                .unwrap()
                .as_deref(),
            Some("id-old")
        );
    }

    #[test]
    fn an_unverified_plan_scope_is_saved_but_cannot_be_activated() {
        let store = MemoryStore::default();
        let profile = save(
            &store,
            None,
            "oaiapp_no_plan",
            "subject-1",
            "no-plan",
            false,
        )
        .unwrap();
        let status = status_with(&store).unwrap();
        assert!(status.accounts[0].connected);
        assert!(!status.accounts[0].plan_enabled);
        assert!(status.active_profile_id.is_none());
        assert!(!profile_usable(
            &store,
            &profile,
            &read_profile(&store, &profile).unwrap().unwrap()
        )
        .unwrap());
    }

    #[test]
    fn signing_out_clears_the_local_tokens_and_keeps_the_registration() {
        let store = MemoryStore::default();
        let profile = save(&store, None, "oaiapp_signout", "subject-1", "signout", true).unwrap();
        assert!(clear_local_session(&store, &profile).unwrap());
        let record = read_profile(&store, &profile).unwrap().unwrap();
        assert!(record.generation.is_none());
        assert_eq!(record.client_id, "oaiapp_signout");
        assert!(!status_with(&store).unwrap().accounts[0].connected);
    }

    #[test]
    fn authorization_uses_loopback_and_keeps_initial_registration_separate() {
        let url = authorization_url(
            "dynamic_agent_client",
            true,
            "urn:uuid:synthetic",
            "http://127.0.0.1:3210/auth/callback",
            "state",
            "nonce",
            "challenge",
        )
        .unwrap();
        let query: HashMap<String, String> = url
            .query_pairs()
            .map(|(key, value)| (key.into_owned(), value.into_owned()))
            .collect();
        assert_eq!(
            query.get("client_id").map(String::as_str),
            Some(DYNAMIC_CLIENT)
        );
        assert_eq!(
            query.get("agent_name_hint").map(String::as_str),
            Some("Lumen")
        );
        assert_eq!(
            query.get("redirect_uri").map(String::as_str),
            Some("http://127.0.0.1:3210/auth/callback")
        );
        assert_eq!(query.get("resource").map(String::as_str), Some(RESOURCE));
        assert_eq!(
            query.get("code_challenge_method").map(String::as_str),
            Some("S256")
        );
        let reauth = authorization_url(
            "oaiapp_existing",
            false,
            "urn:uuid:synthetic",
            "http://127.0.0.1:3210/auth/callback",
            "state",
            "nonce",
            "challenge",
        )
        .unwrap();
        let query: HashMap<String, String> = reauth
            .query_pairs()
            .map(|(key, value)| (key.into_owned(), value.into_owned()))
            .collect();
        assert!(!query.contains_key("agent_name_hint"));
        assert!(!query.contains_key("id_token_hint"));
        assert!(!query.contains_key("login_hint"));
    }

    #[test]
    fn profile_ids_are_stable_hashes_not_account_secrets() {
        assert_eq!(profile_id_for("oaiapp_1"), profile_id_for("oaiapp_1"));
        assert_ne!(profile_id_for("oaiapp_1"), profile_id_for("oaiapp_2"));
        assert!(is_profile_id(&profile_id_for("oaiapp_1")));
        assert!(!is_issued_client_id(DYNAMIC_CLIENT));
    }

    #[test]
    fn siwc_models_catalog_keeps_list_visibility_order_and_slug() {
        let raw = json!({
            "models": [
                { "slug": "hidden-model", "display_name": "Hidden", "visibility": "hide" },
                { "slug": "gpt-5.4", "display_name": "GPT-5.4", "visibility": "list" },
                { "slug": "gpt-5-mini", "visibility": "list" }
            ]
        });
        let parsed = parse_models_response(&raw);
        assert_eq!(
            parsed,
            vec![
                ModelInfo { id: "gpt-5.4".into(), label: "GPT-5.4".into() },
                ModelInfo { id: "gpt-5-mini".into(), label: "gpt-5-mini".into() },
            ]
        );
    }

    #[test]
    fn responses_body_enforces_store_false_stream_true_and_converts_history() {
        let history = vec![
            json!({ "role": "user", "content": "oi" }),
            json!({ "role": "assistant", "content": "olá" }),
        ];
        let user = user_message(true, None, "tudo bem?");
        let body = build_responses_body("gpt-5.4", "instruções", &history, &user);
        assert_eq!(body["model"], "gpt-5.4");
        assert_eq!(body["store"], false);
        assert_eq!(body["stream"], true);
        assert_eq!(body["instructions"], "instruções");
        let input = body["input"].as_array().unwrap();
        assert_eq!(input.len(), 3);
        assert_eq!(input[0]["content"][0], json!({ "type": "input_text", "text": "oi" }));
        assert_eq!(input[1]["content"][0], json!({ "type": "output_text", "text": "olá" }));
        assert_eq!(input[2]["content"][0], json!({ "type": "input_text", "text": "tudo bem?" }));
    }

    #[test]
    fn sse_parser_reads_deltas_completed_fallback_and_errors() {
        assert!(matches!(
            parse_sse_line("data: {\"type\":\"response.output_text.delta\",\"delta\":\"Olá\"}"),
            Some(Ok(SseEvent::Delta(d))) if d == "Olá"
        ));
        assert!(matches!(
            parse_sse_line("data: {\"type\":\"response.completed\",\"response\":{\"output\":[{\"content\":[{\"type\":\"output_text\",\"text\":\"Final\"}]}]}}"),
            Some(Ok(SseEvent::Completed(t))) if t == "Final"
        ));
        assert!(parse_sse_line("data: [DONE]").is_none());
        assert!(matches!(
            parse_sse_line("data: {\"type\":\"response.failed\",\"response\":{\"error\":{\"message\":\"quota\"}}}"),
            Some(Err(e)) if e == "quota"
        ));
    }

    #[tokio::test]
    async fn refresh_is_serialized_and_401_retries_models_and_streaming_chat() {
        use std::sync::atomic::{AtomicUsize, Ordering};
        use std::sync::Arc;

        let store = MemoryStore::default();
        let profile = save(&store, None, "oaiapp_chat", "subject-1", "expired", true).unwrap();
        save_refreshed(
            &store,
            &profile,
            "subject-1",
            true,
            1, // já expirado
            TokenBundle {
                access: "access-expired".into(),
                refresh: "refresh-1".into(),
                id: "id-1".into(),
            },
        )
        .unwrap();

        let refresh_calls = Arc::new(AtomicUsize::new(0));
        let model_calls = Arc::new(AtomicUsize::new(0));
        let response_calls = Arc::new(AtomicUsize::new(0));
        let captured_body = Arc::new(Mutex::new(String::new()));
        let listener = TcpListener::bind(("127.0.0.1", 0)).await.unwrap();
        let port = listener.local_addr().unwrap().port();

        let rc = refresh_calls.clone();
        let mc = model_calls.clone();
        let respc = response_calls.clone();
        let cap = captured_body.clone();
        let server = tokio::spawn(async move {
            for _ in 0..8 {
                let Ok((mut stream, _)) = listener.accept().await else { break };
                let rc = rc.clone();
                let mc = mc.clone();
                let respc = respc.clone();
                let cap = cap.clone();
                tokio::spawn(async move {
                    let mut buf = Vec::new();
                    let mut tmp = [0u8; 2048];
                    loop {
                        let n = stream.read(&mut tmp).await.unwrap_or(0);
                        if n == 0 { break; }
                        buf.extend_from_slice(&tmp[..n]);
                        if let Some(hdr_end) = buf.windows(4).position(|w| w == b"\r\n\r\n") {
                            let headers = String::from_utf8_lossy(&buf[..hdr_end]).to_ascii_lowercase();
                            let content_len = headers
                                .lines()
                                .find_map(|l| l.strip_prefix("content-length:"))
                                .and_then(|v| v.trim().parse::<usize>().ok())
                                .unwrap_or(0);
                            if buf.len() >= hdr_end + 4 + content_len {
                                break;
                            }
                        }
                    }
                    let req = String::from_utf8_lossy(&buf).to_string();
                    let path = req.split_ascii_whitespace().nth(1).unwrap_or("");
                    let body_part = req.split("\r\n\r\n").nth(1).unwrap_or("");
                    let (status, ctype, body) = if path == "/oauth/token" {
                        let idx = rc.fetch_add(1, Ordering::SeqCst);
                        (
                            "200 OK",
                            "application/json",
                            format!("{{\"access_token\":\"access-fresh-{idx}\",\"refresh_token\":\"refresh-2\",\"token_type\":\"Bearer\",\"expires_in\":3600}}"),
                        )
                    } else if path == "/v1/models" {
                        let idx = mc.fetch_add(1, Ordering::SeqCst);
                        if idx == 0 {
                            ("401 Unauthorized", "application/json", "{\"error\":{\"message\":\"expired\"}}".into())
                        } else {
                            (
                                "200 OK",
                                "application/json",
                                "{\"models\":[{\"slug\":\"gpt-5.4\",\"display_name\":\"GPT-5.4\",\"visibility\":\"list\"},{\"slug\":\"internal\",\"visibility\":\"hide\"}]}".into(),
                            )
                        }
                    } else if path == "/v1/responses" {
                        respc.fetch_add(1, Ordering::SeqCst);
                        *cap.lock().unwrap() = body_part.to_string();
                        (
                            "200 OK",
                            "text/event-stream",
                            "data: {\"type\":\"response.output_text.delta\",\"delta\":\"Olá \"}\n\ndata: {\"type\":\"response.output_text.delta\",\"delta\":\"Lumen!\"}\n\ndata: {\"type\":\"response.completed\"}\n\ndata: [DONE]\n\n".into(),
                        )
                    } else {
                        ("404 Not Found", "text/plain", "nope".into())
                    };
                    let reply = format!(
                        "HTTP/1.1 {status}\r\nContent-Type: {ctype}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                        body.len()
                    );
                    let _ = stream.write_all(reply.as_bytes()).await;
                    let _ = stream.shutdown().await;
                });
            }
        });

        let client = reqwest::Client::builder().timeout(Duration::from_secs(5)).build().unwrap();
        let token_url = format!("http://127.0.0.1:{port}/oauth/token");
        let models_url = format!("http://127.0.0.1:{port}/v1/models");
        let responses_url = format!("http://127.0.0.1:{port}/v1/responses");

        // Chamadas concorrentes de refresh devem resultar em apenas 1 troca na rede
        let (a, b) = tokio::join!(
            ensure_access_token_with(&store, &client, &token_url, None),
            ensure_access_token_with(&store, &client, &token_url, None),
        );
        assert_eq!(a.unwrap().0, b.unwrap().0);
        assert_eq!(refresh_calls.load(Ordering::SeqCst), 1);

        // Modelos: primeiro 401 dispara refresh + retry automático
        let listed = models_with(&store, &client, &token_url, &models_url).await.unwrap();
        assert_eq!(listed, vec![ModelInfo { id: "gpt-5.4".into(), label: "GPT-5.4".into() }]);
        assert_eq!(refresh_calls.load(Ordering::SeqCst), 2);
        assert_eq!(model_calls.load(Ordering::SeqCst), 2);

        // Chat streaming com model vazio escolhe primeiro do catálogo e exige store:false, stream:true
        let chat = Chat::default();
        let mut streamed = Vec::new();
        let reply = send_with_endpoints(
            &store,
            &client,
            &client,
            &token_url,
            &models_url,
            &responses_url,
            &chat,
            "",
            "Oi!".into(),
            None,
            |s| streamed.push(s),
        )
        .await
        .unwrap();
        assert_eq!(reply.text, "Olá Lumen!");
        assert_eq!(streamed.last().map(String::as_str), Some("Olá Lumen!"));
        let sent_json: Value = serde_json::from_str(&captured_body.lock().unwrap()).unwrap();
        assert_eq!(sent_json["model"], "gpt-5.4");
        assert_eq!(sent_json["store"], false);
        assert_eq!(sent_json["stream"], true);
        assert!(!chat.begin("chatgpt").first);

        server.abort();
    }
}
