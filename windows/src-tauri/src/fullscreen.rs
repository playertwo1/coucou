use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

use tauri::AppHandle;
use windows::Win32::Foundation::{HWND, RECT};
use windows::Win32::Graphics::Gdi::{
    GetMonitorInfoW, MonitorFromWindow, MONITORINFO, MONITOR_DEFAULTTONEAREST,
};
use windows::Win32::UI::WindowsAndMessaging::{
    GetClassNameW, GetForegroundWindow, GetWindowRect, GetWindowThreadProcessId, IsIconic,
    IsWindowVisible,
};

use crate::island;

#[derive(Clone, Default)]
pub struct FullscreenControl {
    pending: Arc<AtomicBool>,
}

impl FullscreenControl {
    pub fn set_pending(&self, pending: bool) {
        self.pending.store(pending, Ordering::Relaxed);
    }
}

pub fn start(app: AppHandle, control: FullscreenControl) {
    thread::spawn(move || {
        let mut hidden = false;
        loop {
            let fullscreen = island::window(&app)
                .and_then(|win| {
                    let island = win.hwnd().ok()?;
                    let foreground = unsafe { GetForegroundWindow() };
                    Some(is_fullscreen_on_monitor(foreground, HWND(island.0)))
                })
                .unwrap_or(false);
            let should_hide =
                should_hide_island(fullscreen, control.pending.load(Ordering::Relaxed));
            if should_hide != hidden {
                if let Some(win) = island::window(&app) {
                    let result = if should_hide { win.hide() } else { win.show() };
                    if result.is_ok() {
                        hidden = should_hide;
                    }
                }
            }
            thread::sleep(Duration::from_millis(250));
        }
    });
}

// shortcut: geometry-only detection misses exclusive modes that do not expose a covering foreground window; upgrade if owner tests show misses.
fn is_fullscreen_on_monitor(foreground: HWND, island: HWND) -> bool {
    unsafe {
        if foreground.0.is_null() {
            return false;
        }
        let mut class = [0u16; 64];
        let length = GetClassNameW(foreground, &mut class);
        let class = String::from_utf16_lossy(&class[..length.max(0) as usize]);
        if !eligible_window(
            IsWindowVisible(foreground).as_bool(),
            IsIconic(foreground).as_bool(),
            GetWindowThreadProcessId(foreground, None) == std::process::id(),
            &class,
        ) {
            return false;
        }

        let mut window = RECT::default();
        if GetWindowRect(foreground, &mut window).is_err() {
            return false;
        }
        let monitor = MonitorFromWindow(island, MONITOR_DEFAULTTONEAREST);
        if monitor.is_invalid() {
            return false;
        }
        let mut info = MONITORINFO {
            cbSize: std::mem::size_of::<MONITORINFO>() as u32,
            ..Default::default()
        };
        if !GetMonitorInfoW(monitor, &mut info).as_bool() {
            return false;
        }
        covers(window, info.rcMonitor)
    }
}

fn eligible_window(visible: bool, minimized: bool, own_process: bool, class: &str) -> bool {
    visible
        && !minimized
        && !own_process
        && !matches!(
            class,
            "Progman" | "WorkerW" | "Shell_TrayWnd" | "Shell_SecondaryTrayWnd"
        )
}

fn covers(window: RECT, monitor: RECT) -> bool {
    window.left < window.right
        && window.top < window.bottom
        && monitor.left < monitor.right
        && monitor.top < monitor.bottom
        && window.left <= monitor.left
        && window.top <= monitor.top
        && window.right >= monitor.right
        && window.bottom >= monitor.bottom
}

fn should_hide_island(fullscreen: bool, has_pending_approval: bool) -> bool {
    fullscreen && !has_pending_approval
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rect(left: i32, top: i32, right: i32, bottom: i32) -> RECT {
        RECT {
            left,
            top,
            right,
            bottom,
        }
    }

    #[test]
    fn synthetic_window_must_cover_the_entire_island_monitor() {
        let monitor = rect(-1920, 0, 0, 1080);
        assert!(covers(rect(-1920, 0, 0, 1080), monitor));
        assert!(covers(rect(-2000, -20, 20, 1100), monitor));
        assert!(!covers(rect(-1919, 0, 0, 1080), monitor));
        assert!(!covers(rect(-1920, 0, 0, 1079), monitor));
        assert!(!covers(rect(0, 0, 0, 1080), monitor));
    }

    #[test]
    fn synthetic_fullscreen_policy_restores_for_pending_approval() {
        assert!(!should_hide_island(false, false));
        assert!(should_hide_island(true, false));
        assert!(!should_hide_island(true, true));
        assert!(!should_hide_island(false, true));
    }

    #[test]
    fn synthetic_non_app_surfaces_do_not_hide_the_island() {
        assert!(!eligible_window(true, false, false, "Progman"));
        assert!(!eligible_window(true, false, false, "Shell_TrayWnd"));
        assert!(!eligible_window(
            true,
            false,
            true,
            "ApplicationFrameWindow"
        ));
        assert!(!eligible_window(false, false, false, "GameWindow"));
        assert!(!eligible_window(true, true, false, "GameWindow"));
        assert!(eligible_window(true, false, false, "GameWindow"));
    }
}
