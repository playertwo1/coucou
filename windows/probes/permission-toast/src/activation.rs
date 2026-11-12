//! Win32 activation for the synthetic probe only. Registration lives for one run.
use std::{ffi::c_void, sync::mpsc};
use windows::{
    core::{implement, IUnknown, Interface, Ref, BOOL, GUID, PCWSTR},
    Win32::{
        Foundation::{CLASS_E_NOAGGREGATION, E_INVALIDARG, E_POINTER},
        System::Com::{
            CoRegisterClassObject, CoRevokeClassObject, IClassFactory, IClassFactory_Impl,
            CLSCTX_LOCAL_SERVER, REGCLS_MULTIPLEUSE,
        },
        UI::Notifications::{
            INotificationActivationCallback, INotificationActivationCallback_Impl,
            NOTIFICATION_USER_INPUT_DATA,
        },
    },
};

pub const CLSID: GUID = GUID::from_u128(0x60cb7695_093b_4ac0_b16a_49af91ab02bb);
pub const CLSID_TEXT: &str = "{60CB7695-093B-4AC0-B16A-49AF91AB02BB}";

#[implement(INotificationActivationCallback)]
struct Callback {
    nonce: String,
    tx: mpsc::Sender<String>,
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
            return Err(E_INVALIDARG.into());
        }
        let app = unsafe { app.to_string()? };
        let args = unsafe { args.to_string()? };
        if app != super::AUMID {
            return Err(E_INVALIDARG.into());
        }
        let action = super::action(&args, &self.nonce)
            .ok_or_else(|| windows::core::Error::from(E_INVALIDARG))?;
        let _ = self.tx.send(format!(
            "activated={action}; synthetic_only=true; source=com"
        ));
        Ok(())
    }
}

#[implement(IClassFactory)]
struct Factory {
    nonce: String,
    tx: mpsc::Sender<String>,
}
impl IClassFactory_Impl for Factory_Impl {
    fn CreateInstance(
        &self,
        outer: Ref<'_, IUnknown>,
        iid: *const GUID,
        out: *mut *mut c_void,
    ) -> windows::core::Result<()> {
        if out.is_null() || iid.is_null() {
            return Err(E_POINTER.into());
        }
        unsafe {
            *out = std::ptr::null_mut();
        }
        if outer.is_some() {
            return Err(CLASS_E_NOAGGREGATION.into());
        }
        let callback: INotificationActivationCallback = Callback {
            nonce: self.nonce.clone(),
            tx: self.tx.clone(),
        }
        .into();
        unsafe { callback.query(iid, out).ok() }
    }
    fn LockServer(&self, _: BOOL) -> windows::core::Result<()> {
        Ok(())
    }
}

pub struct Registration {
    cookie: u32,
    // Field order: child key must be removed before its parent.
    _server: super::Identity,
    _class: super::Identity,
}
impl Registration {
    pub fn new(nonce: String, tx: mpsc::Sender<String>) -> super::Result<Self> {
        let class = super::Identity::create(&format!("Software\\Classes\\CLSID\\{CLSID_TEXT}"))?;
        let server = super::Identity::create(&format!(
            "Software\\Classes\\CLSID\\{CLSID_TEXT}\\LocalServer32"
        ))?;
        let exe = std::env::current_exe()?;
        server.set_string(
            PCWSTR::null(),
            &format!("\"{}\" --toast-activation", exe.display()),
        )?;
        let factory: IClassFactory = Factory { nonce, tx }.into();
        let cookie = unsafe {
            CoRegisterClassObject(&CLSID, &factory, CLSCTX_LOCAL_SERVER, REGCLS_MULTIPLEUSE)?
        };
        Ok(Self {
            cookie,
            _server: server,
            _class: class,
        })
    }
}
impl Drop for Registration {
    fn drop(&mut self) {
        println!("com_cleanup revoked={}", unsafe {
            CoRevokeClassObject(self.cookie).is_ok()
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use windows::core::HSTRING;

    #[test]
    fn registered_com_factory_delivers_the_synthetic_action() {
        use windows::Win32::System::{
            Com::CoCreateInstance,
            WinRT::{RoInitialize, RO_INIT_MULTITHREADED},
        };
        unsafe {
            RoInitialize(RO_INIT_MULTITHREADED).unwrap();
        }
        let (tx, rx) = mpsc::channel();
        let _registration = Registration::new("run".into(), tx).unwrap();
        let callback: INotificationActivationCallback =
            unsafe { CoCreateInstance(&CLSID, None, CLSCTX_LOCAL_SERVER).unwrap() };
        unsafe {
            callback
                .Activate(
                    &HSTRING::from(super::super::AUMID),
                    &HSTRING::from("run:allow"),
                    &[],
                )
                .unwrap();
        }
        assert!(rx
            .recv_timeout(std::time::Duration::from_secs(2))
            .unwrap()
            .contains("activated=allow"));
    }

    #[test]
    fn com_callback_delivers_only_this_identity_and_run() {
        let (tx, rx) = mpsc::channel();
        let callback: INotificationActivationCallback = Callback {
            nonce: "run".into(),
            tx,
        }
        .into();
        unsafe {
            callback
                .Activate(
                    &HSTRING::from(super::super::AUMID),
                    &HSTRING::from("run:allow"),
                    &[],
                )
                .unwrap();
            assert!(rx.try_recv().unwrap().contains("activated=allow"));
            assert!(callback
                .Activate(
                    &HSTRING::from("another-app"),
                    &HSTRING::from("run:allow"),
                    &[]
                )
                .is_err());
            assert!(callback
                .Activate(
                    &HSTRING::from(super::super::AUMID),
                    &HSTRING::from("old:allow"),
                    &[]
                )
                .is_err());
            assert!(callback
                .Activate(
                    &HSTRING::from(super::super::AUMID),
                    &HSTRING::from("run:always"),
                    &[]
                )
                .is_err());
        }
        assert!(rx.try_recv().is_err());
    }
}
