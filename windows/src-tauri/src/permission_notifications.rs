use std::collections::HashMap;
use std::ffi::c_void;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::mpsc::{self, Receiver, RecvTimeoutError, Sender};
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Emitter};
use windows::core::{implement, w, IUnknown, Interface, Ref, BOOL, GUID, HSTRING, PCWSTR};
use windows::Data::Xml::Dom::XmlDocument;
use windows::Foundation::{DateTime, IReference, PropertyValue};
use windows::Win32::Foundation::{ERROR_FILE_NOT_FOUND, ERROR_SUCCESS};
use windows::Win32::Storage::EnhancedStorage::{
    PKEY_AppUserModel_ID, PKEY_AppUserModel_ToastActivatorCLSID,
};
use windows::Win32::System::Com::StructuredStorage::InitPropVariantFromCLSID;
use windows::Win32::System::Com::{
    CoCreateInstance, CoRegisterClassObject, CoRevokeClassObject, IClassFactory,
    IClassFactory_Impl, IPersistFile, CLSCTX_INPROC_SERVER, CLSCTX_LOCAL_SERVER,
    REGCLS_MULTIPLEUSE, STGM_READWRITE,
};
use windows::Win32::System::Registry::*;
use windows::Win32::System::WinRT::{RoInitialize, RoUninitialize, RO_INIT_MULTITHREADED};
use windows::Win32::UI::Notifications::{
    INotificationActivationCallback, INotificationActivationCallback_Impl,
    NOTIFICATION_USER_INPUT_DATA,
};
use windows::Win32::UI::Shell::{
    IShellLinkW, PropertiesSystem::IPropertyStore, SetCurrentProcessExplicitAppUserModelID,
    ShellLink,
};
use windows::UI::Notifications::{ToastNotification, ToastNotificationManager, ToastNotifier};

const AUMID: &str = "fr.louisraille.coucou";
const AUMID_KEY: &str = "Software\\Classes\\AppUserModelId\\fr.louisraille.coucou";
const GROUP: &str = "permission";
const TOAST_LIFETIME: Duration = Duration::from_secs(30);
const CLSID: GUID = GUID::from_u128(0x5a0c5efa_c98f_4fa4_a337_012f9685bed3);
const CLSID_TEXT: &str = "{5A0C5EFA-C98F-4FA4-A337-012F9685BED3}";

static NEXT_TOKEN: AtomicU32 = AtomicU32::new(1);

#[derive(Clone)]
struct Action {
    request_id: String,
    session_id: String,
    agent_id: String,
    expires_at: Instant,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum ActionKind {
    Review,
    Deny,
}

enum Command {
    Show {
        request_id: String,
        session_id: String,
        agent_id: String,
        lifetime: Duration,
    },
    Clear(String),
    Activate {
        app_id: String,
        args: String,
    },
    Stop(Sender<()>),
}

#[derive(Clone)]
pub struct PermissionToasts(Sender<Command>);

pub fn start(app: AppHandle) -> PermissionToasts {
    let (tx, rx) = mpsc::channel();
    let worker_tx = tx.clone();
    if let Err(err) = thread::Builder::new()
        .name("coucou-permission-toasts".into())
        .spawn(move || {
            if let Err(err) = run(app, rx, worker_tx) {
                crate::log::line(format!("permission notifications unavailable: {err}"));
            }
        })
    {
        crate::log::line(format!(
            "permission notifications worker could not start: {err}"
        ));
    }
    PermissionToasts(tx)
}

pub fn show(
    app: &AppHandle,
    toasts: &PermissionToasts,
    request_id: String,
    session_id: String,
    agent_id: String,
    was_hidden: bool,
) -> bool {
    if !was_hidden || request_id.is_empty() || session_id.is_empty() || agent_id.is_empty() {
        return false;
    }
    let Some(lifetime) = crate::pipe::remaining(app, &request_id) else {
        return false;
    };
    toasts
        .0
        .send(Command::Show {
            request_id,
            session_id,
            agent_id,
            lifetime,
        })
        .is_ok()
}

pub fn clear(toasts: &PermissionToasts, request_id: &str) {
    let _ = toasts.0.send(Command::Clear(request_id.to_owned()));
}

pub fn clear_all(toasts: &PermissionToasts) {
    let _ = toasts.0.send(Command::Clear(String::new()));
}

pub fn shutdown(toasts: &PermissionToasts) {
    let (tx, rx) = mpsc::channel();
    if toasts.0.send(Command::Stop(tx)).is_ok() && rx.recv_timeout(Duration::from_secs(2)).is_err()
    {
        crate::log::line("permission notifications did not stop within two seconds");
    }
}

pub fn set_process_app_id() -> windows::core::Result<()> {
    unsafe { SetCurrentProcessExplicitAppUserModelID(w!("fr.louisraille.coucou")) }
}

fn run(app: AppHandle, rx: Receiver<Command>, tx: Sender<Command>) -> windows::core::Result<()> {
    unsafe { RoInitialize(RO_INIT_MULTITHREADED)? };
    let _apartment = Apartment;
    let _identity = register_identity()?;
    let registration = Registration::new(tx)?;
    let notifier = ToastNotificationManager::CreateToastNotifierWithId(&HSTRING::from(AUMID))?;
    let mut active: HashMap<String, Action> = HashMap::new();

    let stopped = loop {
        match rx.recv_timeout(Duration::from_secs(1)) {
            Ok(Command::Show {
                request_id,
                session_id,
                agent_id,
                lifetime,
            }) => {
                if let Err(err) = show_toast(
                    &app,
                    &notifier,
                    &mut active,
                    request_id,
                    session_id,
                    agent_id,
                    lifetime,
                ) {
                    crate::log::line(format!("permission toast could not be shown: {err}"));
                }
            }
            Ok(Command::Clear(request_id)) => {
                let tokens: Vec<_> = active
                    .iter()
                    .filter(|(_, action)| request_id.is_empty() || action.request_id == request_id)
                    .map(|(token, _)| token.clone())
                    .collect();
                for token in tokens {
                    remove_toast(&mut active, &token);
                }
            }
            Ok(Command::Activate { app_id, args }) => {
                activate(&app, &mut active, &app_id, &args);
            }
            Ok(Command::Stop(done)) => break Some(done),
            Err(RecvTimeoutError::Disconnected) => break None,
            Err(RecvTimeoutError::Timeout) => {}
        }

        let expired: Vec<_> = active
            .iter()
            .filter(|(_, action)| action.expires_at <= Instant::now())
            .map(|(token, _)| token.clone())
            .collect();
        for token in expired {
            remove_toast(&mut active, &token);
        }
    };

    for token in active.keys().cloned().collect::<Vec<_>>() {
        remove_toast(&mut active, &token);
    }
    drop(registration);
    if let Some(done) = stopped {
        let _ = done.send(());
    }
    Ok(())
}

fn show_toast(
    app: &AppHandle,
    notifier: &ToastNotifier,
    active: &mut HashMap<String, Action>,
    request_id: String,
    session_id: String,
    agent_id: String,
    remaining: Duration,
) -> windows::core::Result<()> {
    let Some(actual_remaining) = crate::pipe::remaining(app, &request_id) else {
        return Ok(());
    };
    let lifetime = remaining.min(actual_remaining).min(TOAST_LIFETIME);
    if lifetime.is_zero() {
        return Ok(());
    }
    let token = format!(
        "{:08x}{:08x}",
        std::process::id(),
        NEXT_TOKEN.fetch_add(1, Ordering::Relaxed)
    );
    let title = xml_escape(&crate::i18n::t("Permission request"));
    let body = xml_escape(&crate::i18n::t("Review this permission in Coucou."));
    let allow = xml_escape(&crate::i18n::t("Allow"));
    let deny = xml_escape(&crate::i18n::t("Deny"));
    let xml = format!(
        r#"<toast launch="{token}:open"><visual><binding template="ToastGeneric"><text>{title}</text><text>{body}</text></binding></visual><actions><action content="{allow}" arguments="{token}:allow" activationType="foreground"/><action content="{deny}" arguments="{token}:deny" activationType="foreground"/></actions><audio silent="true"/></toast>"#
    );
    let document = XmlDocument::new()?;
    document.LoadXml(&HSTRING::from(xml))?;
    let toast = ToastNotification::CreateToastNotification(&document)?;
    toast.SetTag(&HSTRING::from(&token))?;
    toast.SetGroup(&HSTRING::from(GROUP))?;
    let expiry = SystemTime::now() + lifetime;
    let date = DateTime {
        UniversalTime: (expiry
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos()
            / 100) as i64
            + 116_444_736_000_000_000,
    };
    toast
        .SetExpirationTime(&PropertyValue::CreateDateTime(date)?.cast::<IReference<DateTime>>()?)?;
    notifier.Show(&toast)?;
    active.insert(
        token,
        Action {
            request_id,
            session_id,
            agent_id,
            expires_at: Instant::now() + lifetime,
        },
    );
    Ok(())
}

fn activate(app: &AppHandle, active: &mut HashMap<String, Action>, app_id: &str, args: &str) {
    let Some((token, action)) = parse_activation(app_id, args) else {
        return;
    };
    let Some(entry) = take_action(active, token, Instant::now()) else {
        remove_history(token);
        return;
    };
    if crate::pipe::remaining(app, &entry.request_id).is_none() {
        remove_history(token);
        return;
    }
    remove_history(token);
    match action {
        ActionKind::Review => {
            // The summary is intentionally generic; an Allow click opens the full card for review.
            let _ = app.emit_to("island", "permission-toast-open", &entry.request_id);
        }
        ActionKind::Deny => {
            let _request_context = (&entry.session_id, &entry.agent_id);
            crate::resolve_approval(app, &entry.request_id, "deny");
        }
    }
}

fn take_action(active: &mut HashMap<String, Action>, token: &str, now: Instant) -> Option<Action> {
    let action = active.remove(token)?;
    (action.expires_at > now).then_some(action)
}

fn parse_activation<'a>(app_id: &str, args: &'a str) -> Option<(&'a str, ActionKind)> {
    if app_id != AUMID {
        return None;
    }
    let (token, action) = args.split_once(':')?;
    if token.len() != 16 || !token.bytes().all(|b| b.is_ascii_hexdigit()) {
        return None;
    }
    let kind = match action {
        "allow" | "open" => ActionKind::Review,
        "deny" => ActionKind::Deny,
        _ => return None,
    };
    Some((token, kind))
}

fn remove_toast(active: &mut HashMap<String, Action>, token: &str) {
    active.remove(token);
    remove_history(token);
}

fn remove_history(token: &str) {
    let _ = ToastNotificationManager::History().and_then(|history| {
        history.RemoveGroupedTagWithId(
            &HSTRING::from(token),
            &HSTRING::from(GROUP),
            &HSTRING::from(AUMID),
        )
    });
}

fn xml_escape(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

fn register_identity() -> windows::core::Result<()> {
    let path = std::env::var_os("APPDATA").ok_or_else(windows::core::Error::from_win32)?;
    let shortcut =
        std::path::PathBuf::from(path).join("Microsoft/Windows/Start Menu/Programs/Coucou.lnk");
    let exe = std::fs::canonicalize(
        std::env::current_exe().map_err(|_| windows::core::Error::from_win32())?,
    )
    .map_err(|_| windows::core::Error::from_win32())?;

    unsafe {
        let link: IShellLinkW = CoCreateInstance(&ShellLink, None, CLSCTX_INPROC_SERVER)?;
        let persist: IPersistFile = link.cast()?;
        persist.Load(&HSTRING::from(shortcut.as_os_str()), STGM_READWRITE)?;
        let mut target = [0u16; 32768];
        link.GetPath(&mut target, std::ptr::null_mut(), 0)?;
        let target_end = target.iter().position(|c| *c == 0).unwrap_or(target.len());
        let target = String::from_utf16_lossy(&target[..target_end]);
        let target =
            std::fs::canonicalize(target).map_err(|_| windows::core::Error::from_win32())?;
        if target != exe {
            return Err(windows::core::Error::from_win32());
        }
        let properties: IPropertyStore = link.cast()?;
        properties.SetValue(
            &PKEY_AppUserModel_ID,
            &windows::Win32::System::Com::StructuredStorage::PROPVARIANT::from(AUMID),
        )?;
        properties.SetValue(
            &PKEY_AppUserModel_ToastActivatorCLSID,
            &InitPropVariantFromCLSID(&CLSID)?,
        )?;
        properties.Commit()?;
    }
    let key = RegistryKey::create(AUMID_KEY)?;
    key.set_string(w!("DisplayName"), "Coucou")?;
    key.set_string(w!("CustomActivator"), CLSID_TEXT)?;
    Ok(())
}

struct RegistryKey {
    key: HKEY,
}
impl RegistryKey {
    fn create(path: &str) -> windows::core::Result<Self> {
        let path = HSTRING::from(path);
        let mut key = HKEY::default();
        let mut disposition = REG_CREATE_KEY_DISPOSITION::default();
        unsafe {
            RegCreateKeyExW(
                HKEY_CURRENT_USER,
                &path,
                None,
                PCWSTR::null(),
                REG_OPTION_NON_VOLATILE,
                KEY_READ | KEY_WRITE,
                None,
                &mut key,
                Some(&mut disposition),
            )
            .ok()?;
        }
        Ok(Self { key })
    }
    fn set_string(&self, name: PCWSTR, value: &str) -> windows::core::Result<()> {
        let mut existing = vec![0u8; 8192];
        let mut size = existing.len() as u32;
        let mut kind = REG_VALUE_TYPE::default();
        let query = unsafe {
            RegQueryValueExW(
                self.key,
                name,
                None,
                Some(&mut kind),
                Some(existing.as_mut_ptr()),
                Some(&mut size),
            )
        };
        if query.0 == ERROR_SUCCESS.0 {
            existing.truncate(size as usize);
            if kind != REG_SZ || decode_reg_string(&existing).as_deref() != Some(value) {
                return Err(windows::core::Error::from_win32());
            }
            return Ok(());
        }
        if query.0 != ERROR_FILE_NOT_FOUND.0 {
            return Err(windows::core::Error::from_win32());
        }
        let data: Vec<u8> = value
            .encode_utf16()
            .chain(Some(0))
            .flat_map(u16::to_le_bytes)
            .collect();
        unsafe { RegSetValueExW(self.key, name, None, REG_SZ, Some(&data)).ok() }
    }
}
impl Drop for RegistryKey {
    fn drop(&mut self) {
        unsafe {
            let _ = RegCloseKey(self.key);
        }
    }
}

struct Apartment;
impl Drop for Apartment {
    fn drop(&mut self) {
        unsafe {
            RoUninitialize();
        }
    }
}

fn decode_reg_string(bytes: &[u8]) -> Option<String> {
    let units: Vec<_> = bytes
        .chunks_exact(2)
        .map(|b| u16::from_le_bytes([b[0], b[1]]))
        .collect();
    let end = units.iter().position(|u| *u == 0).unwrap_or(units.len());
    String::from_utf16(&units[..end]).ok()
}

#[implement(INotificationActivationCallback)]
struct Callback {
    tx: Sender<Command>,
}
impl INotificationActivationCallback_Impl for Callback_Impl {
    fn Activate(
        &self,
        app: &PCWSTR,
        args: &PCWSTR,
        _: *const NOTIFICATION_USER_INPUT_DATA,
        count: u32,
    ) -> windows::core::Result<()> {
        if app.is_null() || args.is_null() || count != 0 {
            return Err(windows::core::Error::from_win32());
        }
        let app_id = unsafe { app.to_string()? };
        let args = unsafe { args.to_string()? };
        self.tx
            .send(Command::Activate { app_id, args })
            .map_err(|_| windows::core::Error::from_win32())
    }
}

#[implement(IClassFactory)]
struct Factory {
    tx: Sender<Command>,
}
impl IClassFactory_Impl for Factory_Impl {
    fn CreateInstance(
        &self,
        outer: Ref<'_, IUnknown>,
        iid: *const GUID,
        out: *mut *mut c_void,
    ) -> windows::core::Result<()> {
        if out.is_null() || iid.is_null() {
            return Err(windows::core::Error::from_win32());
        }
        unsafe {
            *out = std::ptr::null_mut();
        }
        if outer.is_some() {
            return Err(windows::core::Error::from_win32());
        }
        let callback: INotificationActivationCallback = Callback {
            tx: self.tx.clone(),
        }
        .into();
        unsafe { callback.query(iid, out).ok() }
    }
    fn LockServer(&self, _: BOOL) -> windows::core::Result<()> {
        Ok(())
    }
}

struct Registration {
    cookie: u32,
}
impl Registration {
    fn new(tx: Sender<Command>) -> windows::core::Result<Self> {
        let factory: IClassFactory = Factory { tx }.into();
        let cookie = unsafe {
            CoRegisterClassObject(&CLSID, &factory, CLSCTX_LOCAL_SERVER, REGCLS_MULTIPLEUSE)?
        };
        Ok(Self { cookie })
    }
}
impl Drop for Registration {
    fn drop(&mut self) {
        unsafe {
            let _ = CoRevokeClassObject(self.cookie);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_current_opaque_actions_are_accepted_once() {
        let token = "1234abcd00000001";
        let mut active = HashMap::from([(
            token.to_owned(),
            Action {
                request_id: "synthetic-request-2".into(),
                session_id: "synthetic-session-b".into(),
                agent_id: "synthetic-agent".into(),
                expires_at: Instant::now() + Duration::from_secs(5),
            },
        )]);
        assert_eq!(
            parse_activation(AUMID, &format!("{token}:deny")),
            Some((token, ActionKind::Deny))
        );
        assert_eq!(
            parse_activation("another.app", &format!("{token}:deny")),
            None
        );
        assert_eq!(parse_activation(AUMID, "old-token:deny"), None);
        assert_eq!(parse_activation(AUMID, &format!("{token}:always")), None);
        let action = take_action(&mut active, token, Instant::now()).unwrap();
        assert_eq!(action.request_id, "synthetic-request-2");
        assert_eq!(action.session_id, "synthetic-session-b");
        assert_eq!(action.agent_id, "synthetic-agent");
        assert!(active.remove(token).is_none());
    }

    #[test]
    fn allow_and_open_only_request_the_full_card_review() {
        let token = "1234abcd00000001";
        assert_eq!(
            parse_activation(AUMID, &format!("{token}:allow")),
            Some((token, ActionKind::Review))
        );
        assert_eq!(
            parse_activation(AUMID, &format!("{token}:open")),
            Some((token, ActionKind::Review))
        );
    }

    #[test]
    fn expired_actions_are_not_live() {
        let action = Action {
            request_id: "synthetic-request-1".into(),
            session_id: "synthetic-session".into(),
            agent_id: "synthetic-agent".into(),
            expires_at: Instant::now() - Duration::from_millis(1),
        };
        let mut active = HashMap::from([("expired".into(), action)]);
        assert!(take_action(&mut active, "expired", Instant::now()).is_none());
        assert!(active.is_empty());
    }

    #[test]
    fn toast_text_is_xml_escaped() {
        assert_eq!(xml_escape("& < > \" '"), "&amp; &lt; &gt; &quot; &apos;");
    }
}
