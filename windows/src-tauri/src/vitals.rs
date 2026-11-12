// How the PC is doing, for Mochi's moods (MachineVitals.swift on the Mac): the
// processor, memory, battery, the apps busiest on the processor and the ACPI
// thermal zones Windows already publishes. Nothing loops here: the island asks
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
    /// ACPI thermal zones, hottest first is decided by the page.
    zones: Vec<ThermalZone>,
    /// Seconds since the last keyboard or mouse input.
    idle_seconds: Option<f64>,
}

/// One ACPI thermal zone. `passive_limit` is 100 when Windows is not constraining it.
#[derive(Serialize, Debug, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ThermalZone {
    celsius: f64,
    passive_limit: u32,
    throttle_reasons: u32,
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

/// One zone from the performance counter's raw numbers. High precision is tenths
/// of a kelvin. A missing limit counts as unconstrained, so a partial reading
/// cannot blush on its own. Values outside a chassis range are dropped.
fn zone_from_counters(high_precision: Option<f64>, passive_limit: Option<f64>, throttle_reasons: Option<f64>) -> Option<ThermalZone> {
    let celsius = high_precision? / 10.0 - 273.15;
    if !celsius.is_finite() || !(-20.0..=150.0).contains(&celsius) {
        return None;
    }
    let passive_limit = passive_limit.map(|n| n.round().clamp(0.0, 100.0) as u32).unwrap_or(100);
    let throttle_reasons = throttle_reasons.map(|n| n.round().max(0.0) as u32).unwrap_or(0);
    Some(ThermalZone { celsius, passive_limit, throttle_reasons })
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
    Vitals {
        cpu,
        memory_load: os::memory_load(),
        battery: os::battery(),
        top,
        zones: os::thermal_zones(),
        idle_seconds: os::idle_seconds(),
    }
}

// shortcut: Linux reads nothing yet, so Mochi stays calm there; port /proc and /sys when Linux needs it.
#[cfg(not(windows))]
fn read(_top: bool) -> Vitals {
    Vitals::default()
}

#[cfg(windows)]
mod os {
    use windows::core::{w, BSTR};
    use windows::Win32::Foundation::{CloseHandle, FILETIME};
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CoSetProxyBlanket, CLSCTX_INPROC_SERVER, COINIT_MULTITHREADED,
        EOAC_NONE, RPC_C_AUTHN_LEVEL_CALL, RPC_C_IMP_LEVEL_IMPERSONATE,
    };
    use windows::Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS,
    };
    use windows::Win32::System::Power::{GetSystemPowerStatus, SYSTEM_POWER_STATUS};
    use windows::Win32::System::SystemInformation::{GetTickCount, GlobalMemoryStatusEx, MEMORYSTATUSEX};
    use windows::Win32::System::Threading::{GetProcessTimes, GetSystemTimes, OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION};
    use windows::Win32::System::Variant::{VariantClear, VARIANT};
    use windows::Win32::System::Wmi::{
        IWbemClassObject, IWbemLocator, WbemLocator, WBEM_FLAG_FORWARD_ONLY, WBEM_FLAG_RETURN_IMMEDIATELY,
    };
    use windows::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};

    use super::{zone_from_counters, Battery, ThermalZone, Ticks};

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

    fn bstr(text: &str) -> BSTR {
        BSTR::from_wide(&text.encode_utf16().collect::<Vec<_>>())
    }

    fn variant_number(value: &VARIANT) -> Option<f64> {
        unsafe {
            let vt = value.Anonymous.Anonymous.vt.0 & 0x0FFF;
            let n = &value.Anonymous.Anonymous.Anonymous;
            match vt {
                2 => Some(n.iVal as f64),
                3 => Some(n.lVal as f64),
                4 => Some(n.fltVal as f64),
                5 => Some(n.dblVal),
                18 => Some(n.uiVal as f64),
                19 => Some(n.ulVal as f64),
                20 => Some(n.llVal as f64),
                21 => Some(n.ullVal as f64),
                22 => Some(n.intVal as f64),
                23 => Some(n.uintVal as f64),
                _ => None,
            }
        }
    }

    fn property(object: &IWbemClassObject, name: windows::core::PCWSTR) -> Option<f64> {
        let mut value = VARIANT::default();
        let ok = unsafe { object.Get(name, 0, &mut value, None, None) }.is_ok();
        let number = ok.then(|| variant_number(&value)).flatten();
        unsafe { let _ = VariantClear(&mut value); }
        number
    }

    /// The ACPI zones from `Win32_PerfFormattedData_Counters_ThermalZoneInformation`.
    /// Empty when Windows has no zone or the query fails. No administrator needed.
    pub fn thermal_zones() -> Vec<ThermalZone> {
        unsafe {
            let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
            let Ok(locator) = CoCreateInstance::<_, IWbemLocator>(&WbemLocator, None, CLSCTX_INPROC_SERVER) else {
                return Vec::new();
            };
            let blank = BSTR::new();
            let Ok(services) = locator.ConnectServer(
                &bstr("root\\cimv2"), &blank, &blank, &blank, 0, &blank, None,
            ) else {
                return Vec::new();
            };
            // WMI refuses the query unless the proxy impersonates the caller.
            if CoSetProxyBlanket(
                &services, 10, 0, windows::core::PCWSTR::null(),
                RPC_C_AUTHN_LEVEL_CALL, RPC_C_IMP_LEVEL_IMPERSONATE, None, EOAC_NONE,
            ).is_err() {
                return Vec::new();
            }
            let Ok(enumerator) = services.ExecQuery(
                &bstr("WQL"),
                &bstr("SELECT HighPrecisionTemperature, PercentpassiveLimit, ThrottleReasons FROM Win32_PerfFormattedData_Counters_ThermalZoneInformation"),
                WBEM_FLAG_FORWARD_ONLY | WBEM_FLAG_RETURN_IMMEDIATELY,
                None,
            ) else {
                return Vec::new();
            };
            let _ = CoSetProxyBlanket(
                &enumerator, 10, 0, windows::core::PCWSTR::null(),
                RPC_C_AUTHN_LEVEL_CALL, RPC_C_IMP_LEVEL_IMPERSONATE, None, EOAC_NONE,
            );
            let mut zones = Vec::new();
            loop {
                let mut row = [None];
                let mut count = 0u32;
                let hr = enumerator.Next(3_000, &mut row, &mut count);
                if hr.is_err() || count == 0 {
                    break;
                }
                if let Some(object) = row[0].take() {
                    if let Some(zone) = zone_from_counters(
                        property(&object, w!("HighPrecisionTemperature")),
                        property(&object, w!("PercentpassiveLimit")),
                        property(&object, w!("ThrottleReasons")),
                    ) {
                        zones.push(zone);
                    }
                }
                if zones.len() == 16 {
                    break;
                }
            }
            zones
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
            assert!(v.zones.iter().any(|z| (0.0..=120.0).contains(&z.celsius)), "{v:?}");
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
    fn a_thermal_zone_is_tenths_of_a_kelvin_and_a_wild_value_is_dropped() {
        let zone = zone_from_counters(Some(3142.0), Some(100.0), Some(0.0)).unwrap();
        assert!((zone.celsius - 41.05).abs() < 1e-9);
        assert_eq!(zone.passive_limit, 100);
        assert_eq!(zone.throttle_reasons, 0);
        assert!(zone_from_counters(None, Some(50.0), Some(1.0)).is_none());
        assert!(zone_from_counters(Some(5000.0), Some(100.0), Some(0.0)).is_none());
        let partial = zone_from_counters(Some(3262.0), None, None).unwrap();
        assert!((partial.celsius - 53.05).abs() < 1e-9);
        assert_eq!(partial.passive_limit, 100);
        assert_eq!(partial.throttle_reasons, 0);
    }
}
