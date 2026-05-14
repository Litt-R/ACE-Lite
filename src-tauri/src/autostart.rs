use winreg::enums::{HKEY_CURRENT_USER, KEY_READ, KEY_WRITE};
use winreg::RegKey;

pub const AUTOSTART_ELEVATE_ARG: &str = "--ace-lite-autostart-elevate";
pub const ELEVATED_AUTOSTART_ARG: &str = "--ace-lite-elevated-autostart";
const RUN_KEY_PATH: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
const RUN_VALUE_NAME: &str = "ACE-Lite";
const LEGACY_TASK_PATH: &str = r"C:\Windows\System32\Tasks\ACE_Lite_AutoStart";
const LEGACY_TASK_NAME: &str = "ACE_Lite_AutoStart";

pub fn enable_autostart_entry() -> Result<String, String> {
    let exe_path = current_exe_path()?;
    let _ = delete_legacy_autostart_task();

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let key = hkcu
        .open_subkey_with_flags(RUN_KEY_PATH, KEY_WRITE)
        .map_err(|error| format!("打开自启动注册表失败: {}", error))?;

    key.set_value(
        RUN_VALUE_NAME,
        &format!("\"{}\" {}", exe_path, AUTOSTART_ELEVATE_ARG),
    )
    .map_err(|error| format!("写入自启动配置失败: {}", error))?;

    Ok("已开启开机自启动".to_string())
}

pub fn disable_autostart_entry() -> String {
    let _ = delete_legacy_autostart_task();

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(key) = hkcu.open_subkey_with_flags(RUN_KEY_PATH, KEY_WRITE) {
        let _ = key.delete_value(RUN_VALUE_NAME);
    }

    "已关闭开机自启动".to_string()
}

pub fn autostart_entry_exists() -> bool {
    registry_autostart_entry_exists() || legacy_autostart_task_exists()
}

pub fn current_exe_path() -> Result<String, String> {
    std::env::current_exe()
        .map_err(|error| format!("获取程序路径失败: {}", error))?
        .to_str()
        .ok_or_else(|| "路径转换失败".to_string())
        .map(|path| path.to_string())
}

fn registry_autostart_entry_exists() -> bool {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    hkcu.open_subkey_with_flags(RUN_KEY_PATH, KEY_READ)
        .ok()
        .and_then(|key| key.get_value::<String, _>(RUN_VALUE_NAME).ok())
        .is_some()
}

fn legacy_autostart_task_exists() -> bool {
    std::path::Path::new(LEGACY_TASK_PATH).exists()
}

fn delete_legacy_autostart_task() -> bool {
    std::process::Command::new("schtasks")
        .args(["/delete", "/tn", LEGACY_TASK_NAME, "/f"])
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}
