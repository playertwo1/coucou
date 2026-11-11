// Mochi dropped on another app's window: that window's app, its title and, for
// a browser, what its address bar shows — WindowContextCapture.swift on the
// Mac. Metadata only: no page text, screenshot, clipboard or file is read.

use crate::chat::ChatContext;

const MAX_TITLE: usize = 300;
const MAX_URL: usize = 2048;

/// Browsers whose address bar UI Automation can read, by executable stem.
fn is_browser(id: &str) -> bool {
    matches!(id, "chrome" | "msedge" | "brave" | "vivaldi" | "opera" | "firefox")
}

/// The desktop and the taskbar: under Mochi, but no window to talk about.
fn is_desktop_surface(class: &str) -> bool {
    matches!(class, "Progman" | "WorkerW" | "Shell_TrayWnd" | "Shell_SecondaryTrayWnd")
}

/// What the address bar shows, as long as it reads like an address: empty or
/// with spaces (the user typing a search) is no URL. No scheme is added.
fn url_from_bar(text: &str) -> Option<String> {
    let t = text.trim();
    (!t.is_empty() && !t.contains(char::is_whitespace) && t.chars().count() <= MAX_URL).then(|| t.to_string())
}

/// The context for one window, or None without a title to show.
fn context(app: String, title: &str, url: Option<String>) -> Option<ChatContext> {
    let title: String = title.trim().chars().take(MAX_TITLE).collect();
    (!title.is_empty()).then_some(ChatContext::Window { app_name: app, title, url })
}

/// The window under (`x`, `y`), physical screen pixels. Blocks for up to
/// URL_TIMEOUT while a browser's address bar is read.
#[cfg(windows)]
pub fn at(x: f64, y: f64) -> Option<ChatContext> {
    of(os::window_at(x as i32, y as i32)?)
}

/// The window in front (the attach shortcut): none for Coucou's own, the
/// desktop or the taskbar. Blocks like `at`.
#[cfg(windows)]
pub fn front() -> Option<ChatContext> {
    of(os::front_window()?)
}

// shortcut: Linux reads no window yet, so the attach shortcut only says "nothing to attach"; port with X11 when needed.
#[cfg(not(windows))]
pub fn front() -> Option<ChatContext> {
    None
}

#[cfg(windows)]
fn of(hwnd: windows::Win32::Foundation::HWND) -> Option<ChatContext> {
    let (id, name) = crate::flow::os::program_of(hwnd)?;
    let title = os::title(hwnd);
    // Store apps all run in ApplicationFrameHost: their title is their name.
    let app = if id == "applicationframehost" { title.clone() } else { name };
    let url = if is_browser(&id) { os::browser_url(hwnd) } else { None };
    context(app, &title, url)
}

#[cfg(not(windows))]
pub fn at(_x: f64, _y: f64) -> Option<ChatContext> {
    None
}

#[cfg(windows)]
mod os {
    use std::time::Duration;

    use windows::Win32::Foundation::{HWND, LPARAM, POINT, RECT};
    use windows::Win32::Graphics::Dwm::{DwmGetWindowAttribute, DWMWA_CLOAKED};
    use windows::Win32::System::Com::{CoCreateInstance, CoInitializeEx, CLSCTX_INPROC_SERVER, COINIT_MULTITHREADED};
    use windows::Win32::System::Variant::VARIANT;
    use windows::Win32::UI::Accessibility::{
        CUIAutomation, IUIAutomation, TreeScope_Descendants, UIA_ControlTypePropertyId, UIA_EditControlTypeId,
        UIA_ValueValuePropertyId,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetClassNameW, GetForegroundWindow, GetWindowLongPtrW, GetWindowRect, GetWindowTextW, GetWindowThreadProcessId,
        IsIconic, IsWindowVisible, GWL_EXSTYLE, WS_EX_TOOLWINDOW, WS_EX_TRANSPARENT,
    };

    /// A slow or hung browser leaves the context without its URL, never Mochi stuck.
    const URL_TIMEOUT: Duration = Duration::from_millis(1500);

    struct Search {
        point: POINT,
        found: Option<HWND>,
    }

    /// The top-level window under the point, front to back, skipping Coucou's
    /// own windows (Mochi is right under the cursor), hidden, minimized,
    /// cloaked (another virtual desktop) and click-through overlay windows.
    /// The desktop or the taskbar ends the search with nothing.
    pub fn window_at(x: i32, y: i32) -> Option<HWND> {
        unsafe extern "system" fn each(hwnd: HWND, lparam: LPARAM) -> windows::core::BOOL {
            let search = &mut *(lparam.0 as *mut Search);
            if !IsWindowVisible(hwnd).as_bool() || IsIconic(hwnd).as_bool() {
                return true.into();
            }
            let mut rect = RECT::default();
            let p = search.point;
            if GetWindowRect(hwnd, &mut rect).is_err()
                || !(p.x >= rect.left && p.x < rect.right && p.y >= rect.top && p.y < rect.bottom)
            {
                return true.into();
            }
            let ex = GetWindowLongPtrW(hwnd, GWL_EXSTYLE) as u32;
            if ex & (WS_EX_TRANSPARENT.0 | WS_EX_TOOLWINDOW.0) != 0 {
                return true.into();
            }
            let mut cloaked = 0u32;
            let size = std::mem::size_of::<u32>() as u32;
            if DwmGetWindowAttribute(hwnd, DWMWA_CLOAKED, &mut cloaked as *mut u32 as *mut _, size).is_ok() && cloaked != 0 {
                return true.into();
            }
            let mut pid = 0u32;
            GetWindowThreadProcessId(hwnd, Some(&mut pid));
            if pid == std::process::id() {
                return true.into();
            }
            if !super::is_desktop_surface(&class(hwnd)) {
                search.found = Some(hwnd);
            }
            false.into() // the front-most window here decides
        }
        let mut search = Search { point: POINT { x, y }, found: None };
        unsafe {
            let _ = EnumWindows(Some(each), LPARAM(&mut search as *mut Search as isize));
        }
        search.found
    }

    /// The foreground window, unless it is a desktop surface (program_of
    /// already turns Coucou's own windows away).
    pub fn front_window() -> Option<HWND> {
        let hwnd = unsafe { GetForegroundWindow() };
        (!hwnd.0.is_null() && !super::is_desktop_surface(&class(hwnd))).then_some(hwnd)
    }

    fn class(hwnd: HWND) -> String {
        let mut buf = [0u16; 256];
        let n = unsafe { GetClassNameW(hwnd, &mut buf) };
        String::from_utf16_lossy(&buf[..n.max(0) as usize])
    }

    pub fn title(hwnd: HWND) -> String {
        let mut buf = [0u16; 512];
        let n = unsafe { GetWindowTextW(hwnd, &mut buf) };
        String::from_utf16_lossy(&buf[..n.max(0) as usize])
    }

    /// The first edit field of the browser window is its address bar (Chromium
    /// and Firefox both put the toolbar before the page). Read on a thread of
    /// its own so a browser that takes its time can't hold the drop.
    pub fn browser_url(hwnd: HWND) -> Option<String> {
        let raw = hwnd.0 as isize;
        let (tx, rx) = std::sync::mpsc::channel();
        std::thread::spawn(move || {
            let _ = tx.send(unsafe { address_bar(HWND(raw as *mut _)) });
        });
        rx.recv_timeout(URL_TIMEOUT).ok().flatten().and_then(|text| super::url_from_bar(&text))
    }

    unsafe fn address_bar(hwnd: HWND) -> Option<String> {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        let uia: IUIAutomation = CoCreateInstance(&CUIAutomation, None, CLSCTX_INPROC_SERVER).ok()?;
        let root = uia.ElementFromHandle(hwnd).ok()?;
        let edit_type = VARIANT::from(UIA_EditControlTypeId.0);
        let is_edit = uia.CreatePropertyCondition(UIA_ControlTypePropertyId, &edit_type).ok()?;
        let bar = root.FindFirst(TreeScope_Descendants, &is_edit).ok()?;
        let value = bar.GetCurrentPropertyValue(UIA_ValueValuePropertyId).ok()?;
        Some(value.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_an_address_becomes_a_url() {
        assert_eq!(url_from_bar(" github.com/a/b "), Some("github.com/a/b".into()));
        assert_eq!(url_from_bar("https://x.dev/?q=1"), Some("https://x.dev/?q=1".into()));
        assert_eq!(url_from_bar(""), None);
        assert_eq!(url_from_bar("how to cook rice"), None);
        assert_eq!(url_from_bar(&"a".repeat(MAX_URL + 1)), None);
    }

    #[test]
    fn a_window_without_a_title_gives_no_context() {
        assert!(context("Notepad".into(), "  ", None).is_none());
        let long = "é".repeat(MAX_TITLE + 10);
        let Some(ChatContext::Window { title, .. }) = context("Code".into(), &long, None) else { panic!() };
        assert_eq!(title.chars().count(), MAX_TITLE);
    }

    #[test]
    fn browsers_and_desktop_surfaces() {
        assert!(is_browser("msedge") && is_browser("firefox") && !is_browser("code"));
        assert!(is_desktop_surface("Progman") && is_desktop_surface("Shell_TrayWnd") && !is_desktop_surface("CabinetWClass"));
    }
}
