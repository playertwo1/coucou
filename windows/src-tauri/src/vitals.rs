// How the PC is doing, for Mochi's moods (MachineVitals.swift on the Mac): the
// processor, memory, battery, the apps busiest on the processor and, when
// HWiNFO is open, the CPU temperature. Nothing loops here: the island asks
// every few seconds, only while Mochi is on screen. Everything stays in memory.

use std::collections::HashMap;
use std::sync::Mutex;

use serde::Serialize;

#[derive(Serialize, Default, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Vitals {
    /// Share of the processor busy since the last reading, 0…1 (none on the first).
    cpu: Option<f64>,
    /// Physical memory in use, percent.
    memory_load: Option<u32>,
    battery: Option<Battery>,
    /// The two apps that used the processor the most since the last reading.
    top: Vec<String>,
    /// CPU temperature from HWiNFO, °C.
    temperature: Option<f64>,
    /// Seconds since the last keyboard or mouse input.
    idle_seconds: Option<f64>,
}

#[derive(Serialize, Debug, PartialEq, Clone, Copy)]
#[serde(rename_all = "camelCase")]
pub struct Battery {
    percent: u8,
    on_power: bool,
}

/// The processor's idle, kernel (idle included, as Windows counts it) and user time.
#[derive(Clone, Copy, Debug, PartialEq)]
struct Ticks {
    idle: u64,
    kernel: u64,
    user: u64,
}

/// Share of the processor busy between two readings.
fn cpu_busy(before: Ticks, now: Ticks) -> Option<f64> {
    let total = (now.kernel + now.user).checked_sub(before.kernel + before.user)?;
    let idle = now.idle.checked_sub(before.idle)?;
    (total > 0).then(|| (total.saturating_sub(idle) as f64 / total as f64).clamp(0.0, 1.0))
}

/// What GetSystemPowerStatus says: nothing on a PC without a battery or an unknown charge.
fn battery(ac_line: u8, flag: u8, percent: u8) -> Option<Battery> {
    const NO_BATTERY: u8 = 128;
    (flag & NO_BATTERY == 0 && flag != 255 && percent <= 100).then_some(Battery { percent, on_power: ac_line == 1 })
}

/// The apps that used the most processor time since `before`, by name, two at most.
fn busiest(before: &HashMap<u32, u64>, now: &[(u32, String, u64)]) -> Vec<String> {
    let mut deltas: Vec<(u64, &str)> = now
        .iter()
        .filter_map(|(pid, name, time)| {
            let delta = time.checked_sub(*before.get(pid)?)?;
            (delta > 0).then_some((delta, name.as_str()))
        })
        .collect();
    deltas.sort_by(|a, b| b.0.cmp(&a.0));
    let mut names: Vec<String> = Vec::new();
    for (_, name) in deltas {
        let name = crate::flow::display_name(name);
        if !names.contains(&name) {
            names.push(name);
        }
        if names.len() == 2 {
            break;
        }
    }
    names
}

// ── HWiNFO ────────────────────────────────────────────────────────────────────

/// A value in °C from HWiNFO's unit, which the user may have set to °F.
fn celsius(value: f64, unit: &str) -> Option<f64> {
    let unit = unit.trim().trim_start_matches('°').to_ascii_uppercase();
    match unit.as_str() {
        "C" => Some(value),
        "F" => Some((value - 32.0) * 5.0 / 9.0),
        _ => None,
    }
}

/// The CPU's temperature among HWiNFO's: the package (Intel) or Tctl/Tdie (AMD)
/// first, else the hottest reading named after the CPU. `any`: the Gadget's,
/// sensors the user picked by hand, may be named otherwise ("Core Max").
fn cpu_temperature(readings: &[(String, f64)], any: bool) -> Option<f64> {
    let named = |words: &[&str]| {
        readings
            .iter()
            .filter(|(label, _)| words.iter().any(|w| label.to_lowercase().contains(w)))
            .map(|(_, c)| *c)
            .fold(None, |max: Option<f64>, c| Some(max.map_or(c, |m| m.max(c))))
    };
    named(&["cpu package", "tctl", "tdie"])
        .or_else(|| named(&["cpu"]))
        .or_else(|| if any { named(&[""]) } else { None })
}

/// The Gadget's values in the registry (HKCU\Software\HWiNFO64\VSB): LabelN,
/// ValueRawN ("54" or "54,5") and ValueN ("54 °C"), N from 0 up.
fn gadget_readings(get: impl Fn(&str) -> Option<String>) -> Vec<(String, f64)> {
    let mut out = Vec::new();
    for n in 0..256 {
        let Some(label) = get(&format!("Label{n}")) else { break };
        let (Some(raw), Some(shown)) = (get(&format!("ValueRaw{n}")), get(&format!("Value{n}"))) else { continue };
        let Ok(value) = raw.trim().replace(',', ".").parse::<f64>() else { continue };
        let unit = shown.trim().rsplit(' ').next().unwrap_or("");
        if let Some(c) = celsius(value, unit) {
            out.push((label, c));
        }
    }
    out
}

/// HWiNFO's shared memory (Global\HWiNFO_SENS_SM2), read from its layout: a
/// header ("HWiS", then the readings' offset, element size and count at 0x20,
/// 0x24, 0x28), each reading with its type at 0 (1 = temperature), its labels
/// at 0x0C and 0x8C (128 bytes each), its unit at 0x10C and its value at 0x11C.
/// Every offset is checked against `buf`: a bad header gives nothing.
fn shared_memory_readings(buf: &[u8]) -> Vec<(String, f64)> {
    let u32_at = |at: usize| buf.get(at..at + 4).map(|b| u32::from_le_bytes(b.try_into().unwrap()) as usize);
    if buf.get(0..4) != Some(b"HWiS") {
        return Vec::new();
    }
    let (Some(offset), Some(size), Some(count)) = (u32_at(0x20), u32_at(0x24), u32_at(0x28)) else { return Vec::new() };
    if size < 0x124 {
        return Vec::new();
    }
    // ANSI text: "°" is the single byte 0xB0, read as Latin-1.
    let text = |b: &[u8]| {
        let end = b.iter().position(|&c| c == 0).unwrap_or(b.len());
        b[..end].iter().map(|&c| c as char).collect::<String>().trim().to_string()
    };
    let mut out = Vec::new();
    for i in 0..count.min(4096) {
        let Some(start) = offset.checked_add(i * size) else { break };
        let Some(entry) = buf.get(start..start + 0x124) else { break };
        if u32::from_le_bytes(entry[0..4].try_into().unwrap()) != 1 {
            continue;
        }
        let label = match text(&entry[0x8C..0x10C]) {
            user if !user.is_empty() => user,
            _ => text(&entry[0x0C..0x8C]),
        };
        let value = f64::from_le_bytes(entry[0x11C..0x124].try_into().unwrap());
        if let Some(c) = celsius(value, &text(&entry[0x10C..0x11C])).filter(|c| c.is_finite()) {
            out.push((label, c));
        }
    }
    out
}

// ── The command ───────────────────────────────────────────────────────────────

#[derive(Default)]
struct Last {
    ticks: Option<Ticks>,
    process_times: HashMap<u32, u64>,
}

static LAST: std::sync::LazyLock<Mutex<Last>> = std::sync::LazyLock::new(Mutex::default);

/// One reading. `top`: also rank the apps, which the island asks for only once
/// the processor is busy (it opens every process, so not every few seconds).
#[tauri::command]
pub async fn vitals_read(top: bool) -> Vitals {
    tauri::async_runtime::spawn_blocking(move || read(top)).await.unwrap_or_default()
}

#[cfg(windows)]
fn read(top: bool) -> Vitals {
    let ticks = os::ticks();
    let mut last = LAST.lock().unwrap();
    let cpu = match (last.ticks, ticks) {
        (Some(before), Some(now)) => cpu_busy(before, now),
        _ => None,
    };
    last.ticks = ticks;
    let top = if top {
        let now = os::process_times();
        let names = busiest(&last.process_times, &now);
        last.process_times = now.into_iter().map(|(pid, _, t)| (pid, t)).collect();
        names
    } else {
        last.process_times.clear();
        Vec::new()
    };
    drop(last);
    let gadget = gadget_readings(os::gadget_value);
    let temperature = cpu_temperature(&gadget, true)
        .or_else(|| os::shared_memory(|buf| cpu_temperature(&shared_memory_readings(buf), false)).flatten());
    Vitals { cpu, memory_load: os::memory_load(), battery: os::battery(), top, temperature, idle_seconds: os::idle_seconds() }
}

// shortcut: Linux reads nothing yet, so Mochi stays calm there; port /proc and /sys when Linux needs it.
#[cfg(not(windows))]
fn read(_top: bool) -> Vitals {
    Vitals::default()
}

#[cfg(windows)]
mod os {
    use windows::core::{w, PCWSTR};
    use windows::Win32::Foundation::{CloseHandle, FILETIME};
    use windows::Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS,
    };
    use windows::Win32::System::Memory::{
        MapViewOfFile, OpenFileMappingW, UnmapViewOfFile, VirtualQuery, FILE_MAP_READ, MEMORY_BASIC_INFORMATION,
    };
    use windows::Win32::System::Power::{GetSystemPowerStatus, SYSTEM_POWER_STATUS};
    use windows::Win32::System::Registry::{RegGetValueW, HKEY_CURRENT_USER, RRF_RT_REG_SZ};
    use windows::Win32::System::SystemInformation::{GetTickCount, GlobalMemoryStatusEx, MEMORYSTATUSEX};
    use windows::Win32::System::Threading::{GetProcessTimes, GetSystemTimes, OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION};
    use windows::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};

    use super::{Battery, Ticks};

    fn u64_of(t: FILETIME) -> u64 {
        ((t.dwHighDateTime as u64) << 32) | t.dwLowDateTime as u64
    }

    pub fn ticks() -> Option<Ticks> {
        let (mut idle, mut kernel, mut user) = (FILETIME::default(), FILETIME::default(), FILETIME::default());
        unsafe { GetSystemTimes(Some(&mut idle), Some(&mut kernel), Some(&mut user)) }.ok()?;
        Some(Ticks { idle: u64_of(idle), kernel: u64_of(kernel), user: u64_of(user) })
    }

    pub fn memory_load() -> Option<u32> {
        let mut status = MEMORYSTATUSEX { dwLength: std::mem::size_of::<MEMORYSTATUSEX>() as u32, ..Default::default() };
        unsafe { GlobalMemoryStatusEx(&mut status) }.ok()?;
        Some(status.dwMemoryLoad)
    }

    pub fn battery() -> Option<Battery> {
        let mut status = SYSTEM_POWER_STATUS::default();
        unsafe { GetSystemPowerStatus(&mut status) }.ok()?;
        super::battery(status.ACLineStatus, status.BatteryFlag, status.BatteryLifePercent)
    }

    pub fn idle_seconds() -> Option<f64> {
        let mut info = LASTINPUTINFO { cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32, dwTime: 0 };
        if !unsafe { GetLastInputInfo(&mut info) }.as_bool() {
            return None;
        }
        Some(unsafe { GetTickCount() }.wrapping_sub(info.dwTime) as f64 / 1000.0)
    }

    /// Every process Windows lets us look at: (pid, executable stem, processor time).
    pub fn process_times() -> Vec<(u32, String, u64)> {
        let own = std::process::id();
        let mut out = Vec::new();
        unsafe {
            let Ok(snapshot) = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) else { return out };
            let mut entry = PROCESSENTRY32W { dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32, ..Default::default() };
            let mut more = Process32FirstW(snapshot, &mut entry).is_ok();
            while more {
                let pid = entry.th32ProcessID;
                if pid != 0 && pid != own {
                    if let Ok(process) = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) {
                        let (mut c, mut e, mut k, mut u) =
                            (FILETIME::default(), FILETIME::default(), FILETIME::default(), FILETIME::default());
                        if GetProcessTimes(process, &mut c, &mut e, &mut k, &mut u).is_ok() {
                            let len = entry.szExeFile.iter().position(|&ch| ch == 0).unwrap_or(entry.szExeFile.len());
                            let exe = String::from_utf16_lossy(&entry.szExeFile[..len]);
                            let stem = std::path::Path::new(&exe).file_stem().map(|s| s.to_string_lossy().to_string());
                            out.push((pid, stem.unwrap_or(exe), u64_of(k) + u64_of(u)));
                        }
                        let _ = CloseHandle(process);
                    }
                }
                more = Process32NextW(snapshot, &mut entry).is_ok();
            }
            let _ = CloseHandle(snapshot);
        }
        out
    }

    /// A string value of HWiNFO's Gadget key, if it is there.
    pub fn gadget_value(name: &str) -> Option<String> {
        let name: Vec<u16> = name.encode_utf16().chain(Some(0)).collect();
        let mut buf = [0u16; 256];
        let mut len = (buf.len() * 2) as u32;
        let status = unsafe {
            RegGetValueW(
                HKEY_CURRENT_USER,
                w!("Software\\HWiNFO64\\VSB"),
                PCWSTR(name.as_ptr()),
                RRF_RT_REG_SZ,
                None,
                Some(buf.as_mut_ptr().cast()),
                Some(&mut len),
            )
        };
        if status.is_err() {
            return None;
        }
        let chars = (len as usize / 2).min(buf.len());
        let end = buf[..chars].iter().position(|&c| c == 0).unwrap_or(chars);
        Some(String::from_utf16_lossy(&buf[..end]))
    }

    /// HWiNFO's shared memory, mapped read-only for `f`; none when HWiNFO
    /// isn't publishing it. The region's own size bounds every read.
    pub fn shared_memory<T>(f: impl FnOnce(&[u8]) -> T) -> Option<T> {
        unsafe {
            let mapping = OpenFileMappingW(FILE_MAP_READ.0, false, w!("Global\\HWiNFO_SENS_SM2")).ok()?;
            let view = MapViewOfFile(mapping, FILE_MAP_READ, 0, 0, 0);
            let result = if view.Value.is_null() {
                None
            } else {
                let mut info = MEMORY_BASIC_INFORMATION::default();
                let size = VirtualQuery(Some(view.Value), &mut info, std::mem::size_of::<MEMORY_BASIC_INFORMATION>());
                let out = (size != 0).then(|| f(std::slice::from_raw_parts(view.Value as *const u8, info.RegionSize)));
                let _ = UnmapViewOfFile(view);
                out
            };
            let _ = CloseHandle(mapping);
            result
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// This machine, for real: `cargo test --lib vitals -- --ignored --nocapture`.
    #[test]
    #[ignore]
    fn reads_this_machine() {
        let _ = read(true);
        std::thread::sleep(std::time::Duration::from_millis(1500));
        let v = read(true);
        println!("{v:?}");
        #[cfg(windows)]
        {
            assert!(v.cpu.is_some() && v.memory_load.is_some() && v.idle_seconds.is_some());
        }
    }

    #[test]
    fn processor_share_between_two_readings() {
        let a = Ticks { idle: 100, kernel: 300, user: 100 };
        // 200 more ticks, 50 of them idle: 75 % busy.
        let b = Ticks { idle: 150, kernel: 400, user: 200 };
        assert_eq!(cpu_busy(a, b), Some(0.75));
        assert_eq!(cpu_busy(a, a), None, "no time passed");
        assert_eq!(cpu_busy(b, a), None, "a reading from before");
    }

    #[test]
    fn a_battery_only_where_there_is_one() {
        assert_eq!(battery(0, 0, 14), Some(Battery { percent: 14, on_power: false }));
        assert_eq!(battery(1, 8, 60), Some(Battery { percent: 60, on_power: true }));
        assert_eq!(battery(1, 128, 255), None, "no system battery");
        assert_eq!(battery(255, 255, 255), None, "unknown");
    }

    #[test]
    fn the_two_busiest_apps_by_name_since_the_last_reading() {
        let before: HashMap<u32, u64> = [(1, 100), (2, 100), (3, 100), (4, 0)].into();
        let now = vec![
            (1, "node".to_string(), 900),
            (2, "chrome".to_string(), 500),
            (3, "chrome".to_string(), 700),
            (4, "idle".to_string(), 0),
            (5, "new".to_string(), 9_999), // not seen before: no delta yet
        ];
        let names = busiest(&before, &now);
        assert_eq!(names.len(), 2);
        assert_eq!(names[0], crate::flow::display_name("node"));
        assert_eq!(names[1], crate::flow::display_name("chrome"));
    }

    #[test]
    fn fahrenheit_is_converted_and_other_units_ignored() {
        assert_eq!(celsius(54.0, "°C"), Some(54.0));
        assert_eq!(celsius(212.0, "°F"), Some(100.0));
        assert_eq!(celsius(3.3, "V"), None);
    }

    #[test]
    fn the_cpu_package_wins_then_any_cpu_reading_then_for_the_gadget_anything() {
        let r = |v: &[(&str, f64)]| v.iter().map(|(l, c)| (l.to_string(), *c)).collect::<Vec<_>>();
        let all = r(&[("GPU Temperature", 70.0), ("CPU Core #1", 88.0), ("CPU Package", 81.0)]);
        assert_eq!(cpu_temperature(&all, false), Some(81.0));
        assert_eq!(cpu_temperature(&r(&[("CPU (Tctl/Tdie)", 77.0)]), false), Some(77.0));
        assert_eq!(cpu_temperature(&r(&[("CPU Core #1", 70.0), ("CPU Core #2", 74.0)]), false), Some(74.0));
        assert_eq!(cpu_temperature(&r(&[("GPU Temperature", 70.0)]), false), None);
        assert_eq!(cpu_temperature(&r(&[("Core Max", 91.0)]), true), Some(91.0));
    }

    #[test]
    fn gadget_values_with_a_decimal_comma_and_gaps() {
        let reg: HashMap<&str, &str> = [
            ("Label0", "CPU Package"), ("ValueRaw0", "54,5"), ("Value0", "54,5 °C"),
            ("Label1", "Vcore"), ("ValueRaw1", "1.2"), ("Value1", "1.200 V"),
            ("Label2", "Core Max"), ("Value2", "60 °C"), // no raw value: skipped
            ("Label3", "Drive"), ("ValueRaw3", "104"), ("Value3", "104 °F"),
        ]
        .into();
        let got = gadget_readings(|k| reg.get(k).map(|v| v.to_string()));
        assert_eq!(got, vec![("CPU Package".to_string(), 54.5), ("Drive".to_string(), 40.0)]);
    }

    /// A shared memory image in HWiNFO's layout, with `readings` (type, label, unit, value).
    fn image(readings: &[(u32, &str, &[u8], f64)]) -> Vec<u8> {
        const SIZE: usize = 0x13C;
        let offset = 0x2C;
        let mut buf = vec![0u8; offset + SIZE * readings.len()];
        buf[0..4].copy_from_slice(b"HWiS");
        buf[0x20..0x24].copy_from_slice(&(offset as u32).to_le_bytes());
        buf[0x24..0x28].copy_from_slice(&(SIZE as u32).to_le_bytes());
        buf[0x28..0x2C].copy_from_slice(&(readings.len() as u32).to_le_bytes());
        for (i, (kind, label, unit, value)) in readings.iter().enumerate() {
            let e = offset + i * SIZE;
            buf[e..e + 4].copy_from_slice(&kind.to_le_bytes());
            buf[e + 0x0C..e + 0x0C + label.len()].copy_from_slice(label.as_bytes());
            buf[e + 0x10C..e + 0x10C + unit.len()].copy_from_slice(unit);
            buf[e + 0x11C..e + 0x124].copy_from_slice(&value.to_le_bytes());
        }
        buf
    }

    #[test]
    fn shared_memory_temperatures_only_and_a_bad_header_gives_nothing() {
        let buf = image(&[(1, "CPU Package", b"\xB0C", 83.0), (2, "Vcore", b"V", 1.2), (1, "GPU", b"\xB0C", 60.0)]);
        assert_eq!(
            shared_memory_readings(&buf),
            vec![("CPU Package".to_string(), 83.0), ("GPU".to_string(), 60.0)]
        );
        let mut dead = buf.clone();
        dead[0..4].copy_from_slice(b"DEAD");
        assert!(shared_memory_readings(&dead).is_empty());
        // A count past the end of the region stops at the end.
        let mut long = buf.clone();
        long[0x28..0x2C].copy_from_slice(&1000u32.to_le_bytes());
        assert_eq!(shared_memory_readings(&long).len(), 2);
        assert!(shared_memory_readings(&buf[..0x20]).is_empty());
    }
}
