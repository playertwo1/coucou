//! 2.1a feasibility probe. Buttons only report synthetic events; no agent IPC.

mod activation;

use std::{
    sync::mpsc,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use windows::{
    core::{w, Interface, HSTRING, PCWSTR},
    Data::Xml::Dom::XmlDocument,
    Foundation::{DateTime, IReference, PropertyValue, TypedEventHandler},
    Win32::{
        Storage::EnhancedStorage::{PKEY_AppUserModel_ID, PKEY_AppUserModel_ToastActivatorCLSID},
        System::{
            Com::{
                CoCreateInstance, IPersistFile,
                StructuredStorage::{InitPropVariantFromCLSID, PROPVARIANT},
                CLSCTX_INPROC_SERVER,
            },
            Registry::*,
            WinRT::{RoInitialize, RO_INIT_MULTITHREADED},
        },
        UI::Shell::{
            IShellLinkW, PropertiesSystem::IPropertyStore, SHQueryUserNotificationState,
            SetCurrentProcessExplicitAppUserModelID, ShellLink,
        },
    },
    UI::Notifications::{
        ToastDismissedEventArgs, ToastFailedEventArgs, ToastNotification, ToastNotificationManager,
    },
};

const AUMID: &str = "fr.louisraille.coucou.probe";
const KEY: &str = "Software\\Classes\\AppUserModelId\\fr.louisraille.coucou.probe";
const LIFETIME: Duration = Duration::from_secs(90);

type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

/// Own only a freshly created probe key. Never overwrite an installed identity.
struct Identity {
    key: HKEY,
    path: HSTRING,
}
impl Identity {
    fn create(path: &str) -> Result<Self> {
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
                KEY_WRITE,
                None,
                &mut key,
                Some(&mut disposition),
            )
            .ok()?;
            if disposition != REG_CREATED_NEW_KEY {
                RegCloseKey(key).ok()?;
                return Err("probe identity already exists; refusing to overwrite it".into());
            }
        }
        Ok(Self { key, path })
    }
    fn set_string(&self, name: PCWSTR, text: &str) -> Result<()> {
        let value: Vec<u8> = text
            .encode_utf16()
            .chain(Some(0))
            .flat_map(u16::to_le_bytes)
            .collect();
        unsafe {
            RegSetValueExW(self.key, name, None, REG_SZ, Some(&value)).ok()?;
        }
        Ok(())
    }
    fn register(name: &str) -> Result<Self> {
        let identity = Self::create(KEY)?;
        identity.set_string(w!("DisplayName"), name)?;
        identity.set_string(w!("CustomActivator"), activation::CLSID_TEXT)?;
        Ok(identity)
    }
}
impl Drop for Identity {
    fn drop(&mut self) {
        unsafe {
            let close = RegCloseKey(self.key);
            let remove = RegDeleteKeyW(HKEY_CURRENT_USER, &self.path);
            println!("identity_cleanup close={} remove={}", close.0, remove.0);
        }
    }
}

struct Shortcut(std::path::PathBuf);
impl Shortcut {
    fn register() -> Result<Self> {
        let parent =
            std::path::PathBuf::from(std::env::var_os("APPDATA").ok_or("APPDATA unavailable")?)
                .join("Microsoft/Windows/Start Menu/Programs");
        let path = parent.join("Coucou Notification Probe.lnk");
        // Reserve a new name; never replace a shortcut belonging to another run.
        std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&path)?;
        let owned = Self(path);
        unsafe {
            let link: IShellLinkW = CoCreateInstance(&ShellLink, None, CLSCTX_INPROC_SERVER)?;
            link.SetPath(&HSTRING::from(std::env::current_exe()?.as_os_str()))?;
            let props: IPropertyStore = link.cast()?;
            props.SetValue(&PKEY_AppUserModel_ID, &PROPVARIANT::from(AUMID))?;
            props.SetValue(
                &PKEY_AppUserModel_ToastActivatorCLSID,
                &InitPropVariantFromCLSID(&activation::CLSID)?,
            )?;
            props.Commit()?;
            let persist: IPersistFile = link.cast()?;
            persist.Save(&HSTRING::from(owned.0.as_os_str()), true)?;
        }
        Ok(owned)
    }
}
impl Drop for Shortcut {
    fn drop(&mut self) {
        println!(
            "shortcut_cleanup removed={}",
            std::fs::remove_file(&self.0).is_ok()
        );
    }
}

fn t(key: &str, language: &str) -> String {
    let extra: serde_json::Value =
        serde_json::from_str(include_str!("../../../src/i18n/extra.json"))
            .expect("valid extra.json");
    let shared: serde_json::Value =
        serde_json::from_str(include_str!("../../../src/i18n/strings.json"))
            .expect("valid strings.json");
    extra["strings"][key][language]
        .as_str()
        .or_else(|| shared[key][language].as_str())
        .unwrap_or(key)
        .into()
}

fn xml_escape(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

fn action(argument: &str, nonce: &str) -> Option<&'static str> {
    ["allow", "deny", "open"]
        .into_iter()
        .find(|a| argument == format!("{nonce}:{a}"))
}

fn xml(nonce: &str, language: &str) -> String {
    let title = xml_escape(&t("Notification test", language));
    let body = xml_escape(&t("Synthetic request. No command will run.", language));
    let allow = xml_escape(&t("Allow", language));
    let deny = xml_escape(&t("Deny", language));
    format!(
        r#"<toast launch="{nonce}:open"><visual><binding template="ToastGeneric"><text>{title}</text><text>{body}</text></binding></visual><actions><action content="{allow}" arguments="{nonce}:allow" activationType="foreground"/><action content="{deny}" arguments="{nonce}:deny" activationType="foreground"/></actions><audio silent="true"/></toast>"#
    )
}

fn run() -> Result<()> {
    let mut args = std::env::args().skip(1);
    let language = args.next().unwrap_or_else(|| "pt-BR".into());
    // A stale COM launch has no association in memory and must not create a new toast.
    if language == "--toast-activation" {
        return Err("stale activation; no synthetic action accepted".into());
    }
    if args.next().is_some() {
        return Err("usage: coucou-permission-toast-probe [language]".into());
    }
    let _identity = Identity::register(&format!("Coucou · {}", t("Notification test", &language)))?;
    unsafe {
        RoInitialize(RO_INIT_MULTITHREADED)?;
        SetCurrentProcessExplicitAppUserModelID(w!("fr.louisraille.coucou.probe"))?;
    }
    let _shortcut = Shortcut::register()?;
    let nonce = format!(
        "{:x}-{:x}",
        std::process::id(),
        SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos()
    );
    let doc = XmlDocument::new()?;
    doc.LoadXml(&HSTRING::from(xml(&nonce, &language)))?;
    let toast = ToastNotification::CreateToastNotification(&doc)?;
    toast.SetTag(&HSTRING::from("probe"))?;
    toast.SetGroup(&HSTRING::from("coucou-probe"))?;
    let expires = SystemTime::now().duration_since(UNIX_EPOCH)? + LIFETIME;
    let date = DateTime {
        UniversalTime: (expires.as_nanos() / 100) as i64 + 116_444_736_000_000_000,
    };
    toast
        .SetExpirationTime(&PropertyValue::CreateDateTime(date)?.cast::<IReference<DateTime>>()?)?;
    let (tx, rx) = mpsc::channel();
    let _activation = activation::Registration::new(nonce.clone(), tx.clone())?;
    let dismissed = toast.Dismissed(&TypedEventHandler::<
        ToastNotification,
        ToastDismissedEventArgs,
    >::new(move |_, args| {
        if let Some(args) = args.as_ref() {
            let reason = args.Reason()?;
            println!("dismissed={reason:?}; no_decision=true");
            // Dismissal never wins a race with the COM activation of a clicked button.
        }
        Ok(())
    }))?;
    let failed = toast.Failed(
        &TypedEventHandler::<ToastNotification, ToastFailedEventArgs>::new(move |_, args| {
            if let Some(args) = args.as_ref() {
                let _ = tx.send(format!("failed={:?}; no_decision=true", args.ErrorCode()?));
            }
            Ok(())
        }),
    )?;
    let notifier = ToastNotificationManager::CreateToastNotifierWithId(&HSTRING::from(AUMID))?;
    let result = (|| -> Result<()> {
        println!("user_notification_state={:?}", unsafe {
            SHQueryUserNotificationState()
        });
        let setting = notifier.Setting()?;
        println!("notification_setting={setting:?}");
        notifier.Show(&toast)?;
        println!("show_returned_ok=true; awaiting_human_click=true; seconds=90");
        let outcome = rx.recv_timeout(LIFETIME);
        println!("outcome={outcome:?}");
        let message = outcome?;
        if !message.starts_with("activated=") {
            return Err(message.into());
        }
        Ok(())
    })();
    let hidden = notifier.Hide(&toast);
    let removed = ToastNotificationManager::History()?.RemoveGroupedTagWithId(
        &HSTRING::from("probe"),
        &HSTRING::from("coucou-probe"),
        &HSTRING::from(AUMID),
    );
    let _ = toast.RemoveDismissed(dismissed);
    let _ = toast.RemoveFailed(failed);
    println!(
        "toast_cleanup hidden={} removed={}",
        hidden.is_ok(),
        removed.is_ok()
    );
    result?;
    hidden?;
    removed?;
    Ok(())
}

fn main() {
    if let Err(error) = run() {
        eprintln!("probe_failed: {error}");
        std::process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_this_run_and_known_actions_are_accepted() {
        assert_eq!(action("run:allow", "run"), Some("allow"));
        assert_eq!(action("run:deny", "run"), Some("deny"));
        assert_eq!(action("run:open", "run"), Some("open"));
        for value in ["allow", "old:allow", "run:always", "run:allow:extra"] {
            assert_eq!(action(value, "run"), None);
        }
    }

    #[test]
    fn text_is_escaped_and_buttons_are_synthetic() {
        assert_eq!(xml_escape("<&>\"'"), "&lt;&amp;&gt;&quot;&apos;");
        let content = xml("test", "pt-BR");
        assert!(content.contains("test:allow"));
        assert!(content.contains("test:deny"));
        assert!(content.contains("Nenhum comando"));
        assert!(!content.contains("protocol"));
    }
}
