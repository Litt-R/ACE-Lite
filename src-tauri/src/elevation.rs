use crate::autostart::{current_exe_path, AUTOSTART_ELEVATE_ARG, ELEVATED_AUTOSTART_ARG};
use crate::privilege::is_elevated;

#[cfg(target_os = "windows")]
pub fn handle_autostart_elevation() {
    let args: Vec<String> = std::env::args().collect();
    let should_elevate_from_autostart = args.iter().any(|arg| arg == AUTOSTART_ELEVATE_ARG)
        && !args.iter().any(|arg| arg == ELEVATED_AUTOSTART_ARG)
        && !is_elevated();

    if should_elevate_from_autostart {
        if let Err(error) = relaunch_autostart_as_admin() {
            eprintln!("{}", error);
        }

        std::process::exit(0);
    }
}

#[cfg(target_os = "windows")]
pub fn request_admin_restart() -> Result<String, String> {
    relaunch_as_admin(None)?;
    Ok("已请求管理员权限，请在弹出的系统窗口中确认。".to_string())
}

#[cfg(not(target_os = "windows"))]
pub fn request_admin_restart() -> Result<String, String> {
    Err("当前系统不支持在线提权。".to_string())
}

#[cfg(target_os = "windows")]
fn relaunch_autostart_as_admin() -> Result<(), String> {
    relaunch_as_admin(Some(ELEVATED_AUTOSTART_ARG))
}

#[cfg(target_os = "windows")]
fn relaunch_as_admin(parameters: Option<&str>) -> Result<(), String> {
    use windows::core::PCWSTR;
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::Shell::ShellExecuteW;
    use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

    let exe_path = current_exe_path()?;
    let operation = to_wide_string("runas");
    let file = to_wide_string(&exe_path);
    let parameter_buffer = parameters.map(to_wide_string);
    let parameter_ptr = parameter_buffer
        .as_ref()
        .map_or(PCWSTR::null(), |value| PCWSTR(value.as_ptr()));

    let result = unsafe {
        ShellExecuteW(
            HWND(std::ptr::null_mut()),
            PCWSTR(operation.as_ptr()),
            PCWSTR(file.as_ptr()),
            parameter_ptr,
            PCWSTR::null(),
            SW_SHOWNORMAL,
        )
    };
    let result_code = result.0 as isize;

    if result_code <= 32 {
        return Err(format!("请求管理员权限失败，错误码：{}", result_code));
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn to_wide_string(value: &str) -> Vec<u16> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    OsStr::new(value)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect()
}
