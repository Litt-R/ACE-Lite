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
fn relaunch_autostart_as_admin() -> Result<(), String> {
    use windows::core::PCWSTR;
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::Shell::ShellExecuteW;
    use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

    let exe_path = current_exe_path()?;
    let operation = to_wide_string("runas");
    let file = to_wide_string(&exe_path);
    let parameters = to_wide_string(ELEVATED_AUTOSTART_ARG);

    let result = unsafe {
        ShellExecuteW(
            HWND(std::ptr::null_mut()),
            PCWSTR(operation.as_ptr()),
            PCWSTR(file.as_ptr()),
            PCWSTR(parameters.as_ptr()),
            PCWSTR::null(),
            SW_SHOWNORMAL,
        )
    };
    let result_code = result.0 as isize;

    if result_code <= 32 {
        return Err(format!("request admin permission failed: {}", result_code));
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
