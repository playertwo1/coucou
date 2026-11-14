// API keys live in the Windows Credential Manager or, on Linux, the Secret
// Service (GNOME Keyring, KWallet) — never on disk and never in the front end — the island can only ask whether a key is present.

use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};

use keyring::Entry;

const SERVICE: &str = "fr.louisraille.coucou";

/// Every key Coucou may store. Anything outside this list is refused.
pub const KNOWN_KEYS: &[&str] = &[
    "anthropic-api-key",
    "openai-api-key",
    "google-api-key",
    "openrouter-api-key",
    "openai-compatible-key",
    "n8n-url",
    "n8n-api-key",
    "vercel-token",
    "github-token",
    "gitlab-url",
    "gitlab-token",
    "gitea-url",
    "gitea-token",
    "stripe-api-key",
    "resend-api-key",
    "notion-api-key",
    "calcom-api-key",
    // « OK Coucou »'s answers in an ElevenLabs voice.
    "elevenlabs-api-key",
];

fn entry(key: &str) -> Option<Entry> {
    if !KNOWN_KEYS.contains(&key) {
        return None;
    }
    Entry::new(SERVICE, key).ok()
}

/// Whether each key is stored, as last seen. Each Secret Service lookup opens a
/// D-Bus session of its own (tens of milliseconds), and the settings ask about
/// every key on every page: a page switch took seconds. Only presence is kept,
/// never a value, and only what a lookup answered for sure.
static PRESENT: LazyLock<Mutex<HashMap<String, bool>>> = LazyLock::new(|| Mutex::new(HashMap::new()));

fn remember(key: &str, present: bool) {
    PRESENT.lock().unwrap().insert(key.to_string(), present);
}

pub fn get(key: &str) -> Option<String> {
    match entry(key)?.get_password() {
        Ok(value) if !value.is_empty() => {
            remember(key, true);
            Some(value)
        }
        Ok(_) | Err(keyring::Error::NoEntry) => {
            remember(key, false);
            None
        }
        // A locked or unreachable store says nothing about the key.
        Err(_) => None,
    }
}

pub fn set(key: &str, value: &str) -> Result<(), String> {
    let entry = entry(key).ok_or_else(|| format!("unknown key {key}"))?;
    if value.is_empty() {
        let _ = entry.delete_credential();
        remember(key, false);
        return Ok(());
    }
    entry.set_password(value).map_err(|e| e.to_string())?;
    remember(key, true);
    Ok(())
}

pub fn clear(key: &str) -> Result<(), String> {
    let entry = entry(key).ok_or_else(|| format!("unknown key {key}"))?;
    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => {
            remember(key, false);
            Ok(())
        }
        Err(e) => Err(e.to_string()),
    }
}

pub fn present(key: &str) -> bool {
    if let Some(&known) = PRESENT.lock().unwrap().get(key) {
        return known;
    }
    get(key).is_some()
}

/// Looks every key up once, off the main thread, so the settings open on known answers.
pub fn warm_up() {
    std::thread::spawn(|| {
        for key in KNOWN_KEYS {
            let _ = get(key);
        }
    });
}

// ── Entries only Rust reads and writes ───────────────────────────────────────
//
// The phone link, relay, WhatsApp gateway and Sign in with ChatGPT credentials.
// They are not in KNOWN_KEYS: only their Rust modules may read or write them;
// the generic `secret_*` commands never expose them to a webview.

/// Every entry of that kind. Anything outside this list is refused.
pub const INTERNAL_KEYS: &[&str] = &[
    "phone-link-cert",
    "phone-link-key",
    "phone-link-token",
    "phone-relay-room",
    "phone-relay-key",
    "phone-relay-access",
    // WhatsApp's gateway address, its credential (GOWA's user:password or OpenWA's API key) and
    // the webhook's signing secret: set from Settings through whatsapp_save_gateway, read by Rust only.
    "whatsapp-url",
    "whatsapp-api-key",
    "whatsapp-webhook-secret",
    // Sign in with ChatGPT: the profile index and a stable per-installation host identifier.
    "siwc-index",
    "siwc-host-id",
];

/// Whether the keystore would accept this key through `get_internal` / `set_internal`.
pub fn is_internal(key: &str) -> bool {
    INTERNAL_KEYS.contains(&key) || is_siwc_profile_key(key)
}

fn is_lower_hex(s: &str, len: usize) -> bool {
    s.len() == len
        && s.bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

fn is_siwc_profile_key(key: &str) -> bool {
    let Some(rest) = key.strip_prefix("siwc-profile-") else {
        return false;
    };
    let mut parts = rest.split('-');
    let Some(profile) = parts.next() else {
        return false;
    };
    if !is_lower_hex(profile, 64) {
        return false;
    }
    match (parts.next(), parts.next(), parts.next()) {
        (Some("meta"), None, None) => true,
        (Some(generation), Some(kind), None) => {
            is_lower_hex(generation, 16) && matches!(kind, "access" | "refresh" | "id")
        }
        _ => false,
    }
}

fn internal_entry(key: &str) -> Result<Entry, String> {
    if !is_internal(key) {
        return Err(format!("unknown key {key}"));
    }
    Entry::new(SERVICE, key).map_err(|e| e.to_string())
}

pub fn get_internal(key: &str) -> Option<String> {
    read_internal(key).ok().flatten()
}

/// Reads an internal entry while distinguishing an absent value from a locked or unavailable store.
pub fn read_internal(key: &str) -> Result<Option<String>, String> {
    let head = match internal_entry(key)?.get_password() {
        Ok(value) if !value.is_empty() => value,
        Ok(_) | Err(keyring::Error::NoEntry) => return Ok(None),
        Err(e) => return Err(e.to_string()),
    };
    let Some(n) = chunk_count(&head) else {
        return Ok(Some(head));
    };
    let mut out = head[head.find('\n').unwrap() + 1..].to_string();
    for i in 1..n {
        out.push_str(&chunk_entry(key, i)?.get_password().map_err(|e| e.to_string())?);
    }
    Ok(Some(out))
}

// Windows Credential Manager refuses values over 2560 UTF-16 bytes; OAuth tokens are longer, so a
// long value is split: the entry itself holds "~chunks:N~\n" + part 0, entries `key#i` hold the rest.
const CHUNK_CHARS: usize = 800;
const CHUNK_MARK: &str = "~chunks:";

fn chunk_count(head: &str) -> Option<usize> {
    head.strip_prefix(CHUNK_MARK)?.split_once("~\n")?.0.parse().ok()
}

fn chunk_entry(key: &str, i: usize) -> Result<Entry, String> {
    internal_entry(key)?; // validates the key
    Entry::new(SERVICE, &format!("{key}#{i}")).map_err(|e| e.to_string())
}

fn delete_quiet(entry: &Entry) -> Result<(), String> {
    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

/// Deletes the extra parts a previous long value left behind.
fn clear_chunks(key: &str, from: usize) -> Result<(), String> {
    let old = internal_entry(key)?.get_password().ok().and_then(|h| chunk_count(&h));
    for i in from..old.unwrap_or(0) {
        delete_quiet(&chunk_entry(key, i)?)?;
    }
    Ok(())
}

pub fn set_internal(key: &str, value: &str) -> Result<(), String> {
    let entry = internal_entry(key)?;
    if value.is_empty() {
        // An empty value means "forget it" (the relay's access key); some keystores refuse an empty password.
        return clear_internal(key);
    }
    let chars: Vec<char> = value.chars().collect();
    let parts: Vec<String> = chars.chunks(CHUNK_CHARS).map(|c| c.iter().collect()).collect();
    clear_chunks(key, parts.len().max(1))?;
    if parts.len() == 1 {
        return entry.set_password(value).map_err(|e| e.to_string());
    }
    for (i, part) in parts.iter().enumerate().skip(1) {
        chunk_entry(key, i)?.set_password(part).map_err(|e| e.to_string())?;
    }
    let head = format!("{CHUNK_MARK}{}~\n{}", parts.len(), parts[0]);
    entry.set_password(&head).map_err(|e| e.to_string())
}

pub fn clear_internal(key: &str) -> Result<(), String> {
    clear_chunks(key, 1)?;
    delete_quiet(&internal_entry(key)?)
}

#[cfg(test)]
mod tests {
    use super::*;

    // Windows Credential Manager refuses blobs over 2560 bytes (1280 UTF-16 chars): OAuth tokens are longer.
    #[cfg(windows)]
    #[test]
    fn long_internal_values_round_trip() {
        let key = "siwc-host-id";
        let long = "a".repeat(5000);
        set_internal(key, &long).unwrap();
        assert_eq!(read_internal(key).unwrap().as_deref(), Some(long.as_str()));
        set_internal(key, "short").unwrap();
        assert_eq!(read_internal(key).unwrap().as_deref(), Some("short"));
        clear_internal(key).unwrap();
        assert_eq!(read_internal(key).unwrap(), None);
    }

    #[test]
    fn presence_is_answered_from_memory_once_known() {
        remember("calcom-api-key", true);
        assert!(present("calcom-api-key"));
        remember("calcom-api-key", false);
        assert!(!present("calcom-api-key"));
    }

    #[test]
    fn the_phone_links_secrets_cannot_be_reached_from_the_island() {
        // The island's commands go through `get`/`set`/`clear`/`present`, which
        // only know KNOWN_KEYS.
        for key in INTERNAL_KEYS {
            assert!(!KNOWN_KEYS.contains(key), "{key}");
            assert!(entry(key).is_none(), "{key}");
            assert!(set(key, "x").is_err(), "{key}");
            assert!(clear(key).is_err(), "{key}");
            assert!(!present(key), "{key}");
        }
        // And the other way round: a key of the island is not an internal one.
        assert!(set_internal("github-token", "x").is_err());
    }

    #[test]
    fn chatgpt_profile_keys_accept_only_the_fixed_internal_shapes() {
        let profile = "0123456789abcdef".repeat(4);
        let generation = "fedcba9876543210";
        assert!(is_internal("siwc-index"));
        assert!(is_internal("siwc-host-id"));
        assert!(is_internal(&format!("siwc-profile-{profile}-meta")));
        for kind in ["access", "refresh", "id"] {
            assert!(is_internal(&format!(
                "siwc-profile-{profile}-{generation}-{kind}"
            )));
        }
        for key in [
            "siwc-profile-short-meta",
            "siwc-profile-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcg-meta",
            "siwc-profile-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef-f00d-access",
            "siwc-profile-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef-fedcba9876543210-password",
        ] {
            assert!(!is_internal(key), "{key}");
        }
    }

    /// Windows Credential Manager caps a secret's size. The phone link stores its certificate (about
    /// 600 hex characters) and key there, so prove that a secret of that size round-trips through the
    /// real store. A separate service name: this can never touch a user's real entries.
    #[cfg(windows)]
    #[test]
    fn a_certificate_sized_secret_round_trips_through_credential_manager() {
        let entry = keyring::Entry::new("fr.louisraille.coucou.test", "phone-link-size-check").unwrap();
        let big: String = (0..1_200).map(|i| char::from(b"0123456789abcdef"[i % 16])).collect();
        entry.set_password(&big).expect("Credential Manager refused a certificate-sized secret");
        let back = entry.get_password().expect("could not read it back");
        let _ = entry.delete_credential();
        assert_eq!(back, big);
    }
}
