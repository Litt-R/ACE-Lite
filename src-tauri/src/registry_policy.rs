use winreg::enums::{HKEY_LOCAL_MACHINE, KEY_READ, KEY_WRITE};
use winreg::RegKey;

use crate::privilege::is_elevated;
use crate::types::{RegistryPriorityState, RegistryPriorityStates};

const IFEO_BASE_PATH: &str =
    r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options";
const PERF_OPTIONS_KEY: &str = "PerfOptions";
const CPU_PRIORITY_VALUE: &str = "CpuPriorityClass";
const IO_PRIORITY_VALUE: &str = "IoPriority";
const PAGE_PRIORITY_VALUE: &str = "PagePriority";

const ACE_PRIORITY_RULES: [PriorityRule; 2] = [
    PriorityRule::new("SGuard64.exe", 1, 1, 1),
    PriorityRule::new("SGuardSvc64.exe", 1, 1, 1),
];

const VALORANT_PRIORITY_RULES: [PriorityRule; 1] =
    [PriorityRule::new("VALORANT-Win64-Shipping.exe", 3, 3, 5)];
const LEAGUE_PRIORITY_RULES: [PriorityRule; 1] =
    [PriorityRule::new("League of Legends.exe", 3, 3, 5)];
const MANAGED_EXE_NAMES: [&str; 4] = [
    "SGuard64.exe",
    "SGuardSvc64.exe",
    "VALORANT-Win64-Shipping.exe",
    "League of Legends.exe",
];

#[derive(Debug, Clone, Copy)]
struct PriorityRule {
    exe_name: &'static str,
    cpu_priority: u32,
    io_priority: u32,
    page_priority: u32,
}

impl PriorityRule {
    const fn new(
        exe_name: &'static str,
        cpu_priority: u32,
        io_priority: u32,
        page_priority: u32,
    ) -> Self {
        Self {
            exe_name,
            cpu_priority,
            io_priority,
            page_priority,
        }
    }
}

pub fn lower_ace_priority() -> Result<String, String> {
    write_priority_rules(&ACE_PRIORITY_RULES)
}

pub fn raise_valorant_priority() -> Result<String, String> {
    write_priority_rules(&VALORANT_PRIORITY_RULES)
}

pub fn raise_league_priority() -> Result<String, String> {
    write_priority_rules(&LEAGUE_PRIORITY_RULES)
}

pub fn reset_ace_priority() -> Result<String, String> {
    reset_priority_rules(ACE_PRIORITY_RULES.iter().map(|rule| rule.exe_name))
}

pub fn reset_valorant_priority() -> Result<String, String> {
    reset_priority_rules(VALORANT_PRIORITY_RULES.iter().map(|rule| rule.exe_name))
}

pub fn reset_league_priority() -> Result<String, String> {
    reset_priority_rules(LEAGUE_PRIORITY_RULES.iter().map(|rule| rule.exe_name))
}

pub fn check_managed_priorities() -> String {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    MANAGED_EXE_NAMES
        .iter()
        .map(|exe_name| read_priority_status(&hklm, exe_name))
        .collect::<Vec<_>>()
        .join("\n")
}

pub fn reset_managed_priorities() -> Result<String, String> {
    reset_priority_rules(MANAGED_EXE_NAMES.iter().copied())
}

pub fn managed_priority_states() -> RegistryPriorityStates {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    MANAGED_EXE_NAMES
        .iter()
        .map(|exe_name| (exe_name.to_string(), read_priority_state(&hklm, exe_name)))
        .collect()
}

fn write_priority_rules(rules: &[PriorityRule]) -> Result<String, String> {
    require_elevated()?;

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let results = rules
        .iter()
        .map(|rule| write_single_priority_rule(&hklm, *rule))
        .collect::<Vec<_>>();

    Ok(results.join("\n"))
}

fn reset_priority_rules<'a>(
    exe_names: impl IntoIterator<Item = &'a str>,
) -> Result<String, String> {
    require_elevated()?;

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let results = exe_names
        .into_iter()
        .map(|exe_name| reset_single_exe_priority(&hklm, exe_name))
        .collect::<Vec<_>>();

    Ok(results.join("\n"))
}

fn require_elevated() -> Result<(), String> {
    if is_elevated() {
        Ok(())
    } else {
        Err("需要管理员权限才能修改注册表优先级。".to_string())
    }
}

fn write_single_priority_rule(hklm: &RegKey, rule: PriorityRule) -> String {
    match hklm.create_subkey(perf_options_path(rule.exe_name)) {
        Ok((key, _)) => {
            let cpu_result = key.set_value(CPU_PRIORITY_VALUE, &rule.cpu_priority);
            let io_result = key.set_value(IO_PRIORITY_VALUE, &rule.io_priority);
            let page_result = key.set_value(PAGE_PRIORITY_VALUE, &rule.page_priority);

            match (cpu_result, io_result, page_result) {
                (Ok(_), Ok(_), Ok(_)) => format!(
                    "{}: 注册表优先级已写入 (CPU:{}, I/O:{}, Page:{})",
                    rule.exe_name, rule.cpu_priority, rule.io_priority, rule.page_priority
                ),
                (cpu, io, page) => {
                    let mut errors = Vec::new();
                    if let Err(error) = cpu {
                        errors.push(format!("CPU: {}", error));
                    }
                    if let Err(error) = io {
                        errors.push(format!("I/O: {}", error));
                    }
                    if let Err(error) = page {
                        errors.push(format!("Page: {}", error));
                    }
                    format!("{}: 设置优先级失败: {}", rule.exe_name, errors.join(", "))
                }
            }
        }
        Err(error) => format!("{}: 创建注册表项失败: {}", rule.exe_name, error),
    }
}

fn read_priority_state(hklm: &RegKey, exe_name: &str) -> RegistryPriorityState {
    match hklm.open_subkey(perf_options_path(exe_name)) {
        Ok(key) => RegistryPriorityState {
            configured: true,
            cpu_priority: key.get_value(CPU_PRIORITY_VALUE).ok(),
            io_priority: key.get_value(IO_PRIORITY_VALUE).ok(),
            page_priority: key.get_value(PAGE_PRIORITY_VALUE).ok(),
        },
        Err(_) => RegistryPriorityState {
            configured: false,
            cpu_priority: None,
            io_priority: None,
            page_priority: None,
        },
    }
}

fn read_priority_status(hklm: &RegKey, exe_name: &str) -> String {
    match hklm.open_subkey(perf_options_path(exe_name)) {
        Ok(key) => {
            let cpu_priority: Result<u32, _> = key.get_value(CPU_PRIORITY_VALUE);
            let io_priority: Result<u32, _> = key.get_value(IO_PRIORITY_VALUE);
            let page_priority: Result<u32, _> = key.get_value(PAGE_PRIORITY_VALUE);
            let cpu_status = cpu_priority.map_or_else(
                |_| "CPU:未设置".to_string(),
                |value| format!("CPU:{}", value),
            );
            let io_status = io_priority.map_or_else(
                |_| "I/O:未设置".to_string(),
                |value| format!("I/O:{}", value),
            );
            let page_status = page_priority.map_or_else(
                |_| "Page:未设置".to_string(),
                |value| format!("Page:{}", value),
            );
            format!(
                "{}:[{},{},{}]",
                exe_name, cpu_status, io_status, page_status
            )
        }
        Err(_) => format!("{}:未配置", exe_name),
    }
}

fn reset_single_exe_priority(hklm: &RegKey, exe_name: &str) -> String {
    let exe_path = exe_options_path(exe_name);
    match hklm.open_subkey_with_flags(&exe_path, KEY_WRITE | KEY_READ) {
        Ok(exe_key) => match exe_key.delete_subkey(PERF_OPTIONS_KEY) {
            Ok(_) => cleanup_empty_exe_key(hklm, exe_key, &exe_path, exe_name),
            Err(error) => format!("{}: 删除配置失败: {}", exe_name, error),
        },
        Err(_) => format!("{}: 未找到配置", exe_name),
    }
}

fn cleanup_empty_exe_key(hklm: &RegKey, exe_key: RegKey, exe_path: &str, exe_name: &str) -> String {
    let exe_key_is_empty =
        exe_key.enum_keys().next().is_none() && exe_key.enum_values().next().is_none();

    drop(exe_key);

    if !exe_key_is_empty {
        return format!("{}: 已恢复默认配置，保留非空注册表项", exe_name);
    }

    match hklm.delete_subkey(exe_path) {
        Ok(_) => format!("{}: 已恢复默认配置，并删除空注册表项", exe_name),
        Err(error) => format!(
            "{}: 已恢复默认配置，但删除空注册表项失败: {}",
            exe_name, error
        ),
    }
}

fn exe_options_path(exe_name: &str) -> String {
    format!(r"{}\{}", IFEO_BASE_PATH, exe_name)
}

fn perf_options_path(exe_name: &str) -> String {
    format!(r"{}\{}", exe_options_path(exe_name), PERF_OPTIONS_KEY)
}
