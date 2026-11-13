// A region of the screen, through Windows' own snip (ms-screenclip:). The PNG
// stays in the temporary folder. It is read from the clipboard only after a
// snip this app started. Nothing here calls a chat provider.

use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::Serialize;
use tauri::Emitter;

const KEEP: usize = 20;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SavedCapture {
    pub path: String,
    pub name: String,
}

pub fn is_png(bytes: &[u8]) -> bool {
    bytes.starts_with(b"\x89PNG\r\n\x1a\n") && bytes.len() > 8
}

/// A snip is kept only when the clipboard changed and the new bytes are a PNG.
/// Esc, or a change that is not a PNG, keeps nothing.
pub fn snip_kept(sequence_changed: bool, bytes: Option<&[u8]>) -> bool {
    sequence_changed && bytes.is_some_and(is_png)
}

pub fn captures_dir() -> PathBuf {
    std::env::temp_dir().join("CoucouCaptures")
}

/// Writes one PNG and leaves at most `KEEP` files in `dir`.
pub fn store(dir: &Path, bytes: &[u8]) -> std::io::Result<PathBuf> {
    std::fs::create_dir_all(dir)?;
    let millis = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis()).unwrap_or(0);
    let path = dir.join(format!("capture-{millis}.png"));
    std::fs::write(&path, bytes)?;
    prune(dir, KEEP);
    Ok(path)
}

/// Deletes `path` only when it is a PNG sitting directly in `dir`.
pub fn delete_one(dir: &Path, path: &Path) -> bool {
    let (Ok(dir), Ok(file)) = (dir.canonicalize(), path.canonicalize()) else { return false };
    if file.parent() != Some(dir.as_path()) { return false; }
    if file.extension().and_then(|e| e.to_str()) != Some("png") { return false; }
    std::fs::remove_file(file).is_ok()
}

/// One capture in flight: the clipboard as it was, and the window to paste back into.
#[derive(Clone)]
struct Flight {
    previous_text: Option<String>,
    front: isize,
}

static FLIGHT: std::sync::Mutex<Option<Flight>> = std::sync::Mutex::new(None);
static BUSY: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

/// Starts the system snip. The island hears `capture-ready` or `capture-empty`.
pub fn begin(app: tauri::AppHandle) {
    if BUSY.swap(true, std::sync::atomic::Ordering::Relaxed) {
        return;
    }
    std::thread::spawn(move || {
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| run(&app)));
        BUSY.store(false, std::sync::atomic::Ordering::Relaxed);
        if result.is_err() {
            let _ = app.emit_to(crate::island::WINDOW_LABEL, "capture-empty", ());
        }
    });
}

fn run(app: &tauri::AppHandle) {
    let previous_text = clipboard_text();
    let front = foreground();
    let before = clipboard_sequence();
    let _ = std::process::Command::new("explorer.exe").arg("ms-screenclip:").spawn();
    let changed = wait_for_snip(before);
    let png = if changed { await_png(clipboard_png) } else { None };
    if snip_kept(changed, png.as_deref()) {
        if let Some(bytes) = png {
            if let Ok(path) = store(&captures_dir(), &bytes) {
                *FLIGHT.lock().unwrap_or_else(|e| e.into_inner()) = Some(Flight { previous_text, front });
                let name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
                let saved = SavedCapture { path: path.to_string_lossy().to_string(), name };
                let _ = app.emit_to(crate::island::WINDOW_LABEL, "capture-ready", &saved);
                return;
            }
        }
    }
    let _ = app.emit_to(crate::island::WINDOW_LABEL, "capture-empty", ());
}

/// Blocks until the snip ends or three minutes pass. True when the clipboard changed.
fn wait_for_snip(before: u32) -> bool {
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(180);
    let mut saw = false;
    loop {
        if clipboard_sequence() != before {
            return true;
        }
        if snip_overlay_open() {
            saw = true;
        } else if saw {
            return false;
        }
        if std::time::Instant::now() >= deadline {
            return clipboard_sequence() != before;
        }
        std::thread::sleep(std::time::Duration::from_millis(200));
    }
}

pub fn cancel(path: &str) -> bool {
    delete_one(&captures_dir(), Path::new(path))
}

fn await_png(mut read: impl FnMut() -> Option<Vec<u8>>) -> Option<Vec<u8>> {
    // The snipper changes the sequence before publishing PNG and can still hold the clipboard.
    // shortcut: retry for two seconds; extend only if real snips exceed this window.
    for _ in 0..40 {
        if let Some(png) = read() {
            return Some(png);
        }
        std::thread::sleep(std::time::Duration::from_millis(50));
    }
    None
}

/// Leaves the PNG on the clipboard. The capture file stays.
pub fn copy_png(path: &str) -> bool {
    let Ok(bytes) = std::fs::read(path) else { return false };
    if !is_png(&bytes) { return false; }
    put_png(&bytes)
}

/// Pastes into the window that was in front, then puts the old clipboard text back.
pub fn paste_png(path: &str) -> bool {
    let flight = FLIGHT.lock().unwrap_or_else(|e| e.into_inner()).clone();
    let Some(flight) = flight else { return false };
    if !copy_png(path) { return false; }
    std::thread::sleep(std::time::Duration::from_millis(40));
    focus(flight.front);
    let _ = crate::flow::os::send_paste(false);
    if let Some(text) = flight.previous_text.clone() {
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(700));
            let _ = clipboard_set_text(&text);
        });
    }
    true
}

fn clipboard_text() -> Option<String> {
    arboard::Clipboard::new().ok().and_then(|mut c| c.get_text().ok())
}

fn clipboard_set_text(text: &str) -> bool {
    arboard::Clipboard::new().ok().and_then(|mut c| c.set_text(text).ok()).is_some()
}

#[cfg(windows)]
fn clipboard_sequence() -> u32 {
    unsafe { windows::Win32::System::DataExchange::GetClipboardSequenceNumber() }
}

#[cfg(not(windows))]
fn clipboard_sequence() -> u32 {
    0
}

#[cfg(windows)]
fn clipboard_png() -> Option<Vec<u8>> {
    use windows::Win32::Foundation::HGLOBAL;
    use windows::Win32::System::DataExchange::{
        CloseClipboard, GetClipboardData, OpenClipboard, RegisterClipboardFormatW,
    };
    use windows::Win32::System::Memory::{GlobalLock, GlobalSize, GlobalUnlock};
    use windows::core::w;
    unsafe {
        if OpenClipboard(None).is_err() {
            return None;
        }
        let format = RegisterClipboardFormatW(w!("PNG"));
        let bytes = GetClipboardData(format).ok().and_then(|handle| {
            let global = HGLOBAL(handle.0);
            let ptr = GlobalLock(global);
            if ptr.is_null() {
                return None;
            }
            let size = GlobalSize(global);
            let out = std::slice::from_raw_parts(ptr.cast::<u8>(), size).to_vec();
            let _ = GlobalUnlock(global);
            Some(out)
        });
        let _ = CloseClipboard();
        bytes.filter(|b| is_png(b))
    }
}

#[cfg(not(windows))]
fn clipboard_png() -> Option<Vec<u8>> {
    None
}

#[cfg(windows)]
fn put_png(bytes: &[u8]) -> bool {
    use windows::Win32::Foundation::{HGLOBAL, HANDLE};
    use windows::Win32::System::DataExchange::{
        CloseClipboard, EmptyClipboard, OpenClipboard, RegisterClipboardFormatW, SetClipboardData,
    };
    use windows::Win32::System::Memory::{GlobalAlloc, GlobalLock, GlobalUnlock, GMEM_MOVEABLE};
    use windows::core::w;
    unsafe {
        if OpenClipboard(None).is_err() {
            return false;
        }
        let _ = EmptyClipboard();
        let format = RegisterClipboardFormatW(w!("PNG"));
        let global = GlobalAlloc(GMEM_MOVEABLE, bytes.len()).unwrap_or(HGLOBAL::default());
        let ptr = GlobalLock(global);
        let ok = if ptr.is_null() {
            false
        } else {
            std::ptr::copy_nonoverlapping(bytes.as_ptr(), ptr.cast::<u8>(), bytes.len());
            let _ = GlobalUnlock(global);
            SetClipboardData(format, Some(HANDLE(global.0))).is_ok()
        };
        let _ = CloseClipboard();
        ok
    }
}

#[cfg(not(windows))]
fn put_png(_bytes: &[u8]) -> bool {
    false
}

#[cfg(windows)]
fn foreground() -> isize {
    unsafe { windows::Win32::UI::WindowsAndMessaging::GetForegroundWindow().0 as isize }
}

#[cfg(not(windows))]
fn foreground() -> isize {
    0
}

#[cfg(windows)]
fn focus(raw: isize) {
    if raw == 0 {
        return;
    }
    let hwnd = windows::Win32::Foundation::HWND(raw as *mut _);
    unsafe {
        let _ = windows::Win32::UI::WindowsAndMessaging::SetForegroundWindow(hwnd);
    }
}

#[cfg(not(windows))]
fn focus(_raw: isize) {}

#[cfg(windows)]
static SNIP_PIDS: std::sync::Mutex<Vec<u32>> = std::sync::Mutex::new(Vec::new());
#[cfg(windows)]
static SNIP_OVERLAY: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

#[cfg(windows)]
unsafe extern "system" fn note_overlay(hwnd: windows::Win32::Foundation::HWND, _: windows::Win32::Foundation::LPARAM) -> windows::core::BOOL {
    use windows::Win32::UI::WindowsAndMessaging::{GetWindowTextLengthW, GetWindowThreadProcessId, IsWindowVisible};
    let mut pid = 0u32;
    let _ = GetWindowThreadProcessId(hwnd, Some(&mut pid));
    let listed = SNIP_PIDS.lock().unwrap_or_else(|e| e.into_inner()).contains(&pid);
    if listed && IsWindowVisible(hwnd).as_bool() && GetWindowTextLengthW(hwnd) > 0 {
        SNIP_OVERLAY.store(true, std::sync::atomic::Ordering::Relaxed);
        return windows::core::BOOL(0);
    }
    windows::core::BOOL(1)
}

#[cfg(windows)]
fn snip_overlay_open() -> bool {
    use windows::Win32::Foundation::{CloseHandle, LPARAM};
    use windows::Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS,
    };
    use windows::Win32::UI::WindowsAndMessaging::EnumWindows;
    unsafe {
        let Ok(snap) = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) else { return false };
        let mut entry = PROCESSENTRY32W { dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32, ..Default::default() };
        let mut pids = Vec::new();
        if Process32FirstW(snap, &mut entry).is_ok() {
            loop {
                let name = String::from_utf16_lossy(
                    &entry.szExeFile[..entry.szExeFile.iter().position(|c| *c == 0).unwrap_or(entry.szExeFile.len())],
                );
                if name.eq_ignore_ascii_case("SnippingTool.exe") || name.eq_ignore_ascii_case("ScreenClippingHost.exe") {
                    pids.push(entry.th32ProcessID);
                }
                if Process32NextW(snap, &mut entry).is_err() {
                    break;
                }
            }
        }
        let _ = CloseHandle(snap);
        if pids.is_empty() {
            return false;
        }
        *SNIP_PIDS.lock().unwrap_or_else(|e| e.into_inner()) = pids;
        SNIP_OVERLAY.store(false, std::sync::atomic::Ordering::Relaxed);
        let _ = EnumWindows(Some(note_overlay), LPARAM(0));
        SNIP_OVERLAY.load(std::sync::atomic::Ordering::Relaxed)
    }
}

#[cfg(not(windows))]
fn snip_overlay_open() -> bool {
    false
}

fn prune(dir: &Path, keep: usize) {
    let mut files: Vec<(SystemTime, PathBuf)> = std::fs::read_dir(dir)
        .into_iter()
        .flatten()
        .flatten()
        .filter_map(|entry| {
            let path = entry.path();
            let time = entry.metadata().and_then(|m| m.modified()).unwrap_or(UNIX_EPOCH);
            path.extension().and_then(|e| e.to_str()).eq(&Some("png")).then_some((time, path))
        })
        .collect();
    files.sort_by(|a, b| b.0.cmp(&a.0));
    for (_, path) in files.into_iter().skip(keep) {
        let _ = std::fs::remove_file(path);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn png() -> Vec<u8> {
        b"\x89PNG\r\n\x1a\nfake".to_vec()
    }

    #[test]
    fn esc_and_a_non_png_write_nothing() {
        assert!(!snip_kept(false, Some(&png())));
        assert!(!snip_kept(true, None));
        assert!(!snip_kept(true, Some(b"not a png")));
        assert!(snip_kept(true, Some(&png())));
    }

    #[test]
    fn clipboard_change_can_precede_the_png() {
        let mut reads = 0;
        let result = await_png(|| {
            reads += 1;
            (reads >= 3).then(png)
        });
        assert_eq!(result, Some(png()));
    }

    #[test]
    fn clipboard_without_a_png_stops_retrying() {
        let mut reads = 0;
        assert_eq!(await_png(|| { reads += 1; None }), None);
        assert_eq!(reads, 40);
    }

    #[test]
    fn cancel_removes_only_that_capture_and_the_folder_keeps_twenty() {
        let dir = std::env::temp_dir().join(format!("coucou-capture-test-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        for i in 0..20 {
            std::fs::write(dir.join(format!("old-{i}.png")), png()).unwrap();
            // Distinct mtimes so prune has an order.
            std::thread::sleep(std::time::Duration::from_millis(2));
        }
        let saved = store(&dir, &png()).unwrap();
        let left: Vec<_> = std::fs::read_dir(&dir).unwrap().flatten().collect();
        assert_eq!(left.len(), 20);
        assert!(saved.exists());
        let other = dir.join("old-19.png");
        assert!(delete_one(&dir, &saved));
        assert!(!saved.exists());
        assert!(!delete_one(&dir, Path::new("C:\\Windows\\notepad.exe")));
        assert!(other.exists(), "cancel does not sweep the rest");
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// This consumes and can clear the interactive clipboard even when PNG publication fails.
    #[cfg(windows)]
    #[ignore = "uses and replaces the interactive Windows clipboard; run only as a manual check"]
    #[test]
    fn a_png_round_trips_through_the_clipboard() {
        let previous = super::clipboard_text();
        let bytes = png();
        assert!(super::put_png(&bytes), "clipboard rejected the png");
        let got = super::clipboard_png();
        if let Some(text) = &previous {
            assert!(super::clipboard_set_text(text), "clipboard text was not restored");
        }
        assert_eq!(got.as_deref(), Some(bytes.as_slice()));
    }
}
