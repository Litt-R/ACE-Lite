#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "windows")]
use std::path::{Path, PathBuf};

fn main() {
    #[cfg(target_os = "windows")]
    {
        setup_portable_webview2();
    }

    ace_lite_lib::run()
}

#[cfg(target_os = "windows")]
fn setup_portable_webview2() {
    use std::env;

    let exe_path = env::current_exe().unwrap_or_else(|_| PathBuf::from("."));
    let default_path = PathBuf::from(".");
    let exe_dir = exe_path.parent().unwrap_or(&default_path);
    let user_data_dir = exe_dir.join(".webview2-data");

    cleanup_path(&user_data_dir);
    cleanup_legacy_local_appdata_cache();

    env::set_var(
        "WEBVIEW2_USER_DATA_FOLDER",
        user_data_dir.to_str().unwrap_or(""),
    );

    let webview2_dir = exe_dir.join("webview2");
    if webview2_dir.exists() && webview2_dir.is_dir() {
        env::set_var(
            "WEBVIEW2_BROWSER_EXECUTABLE_FOLDER",
            webview2_dir.to_str().unwrap_or(""),
        );
        env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--no-sandbox");
    }
}

#[cfg(target_os = "windows")]
fn cleanup_legacy_local_appdata_cache() {
    if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
        let legacy_app_dir = PathBuf::from(local_appdata).join("com.local.acelite");
        let legacy_cache_dir = legacy_app_dir.join("EBWebView");

        cleanup_path(&legacy_cache_dir);
        cleanup_empty_dir(&legacy_app_dir);
    }
}

#[cfg(target_os = "windows")]
fn cleanup_empty_dir(path: &Path) {
    if path
        .read_dir()
        .map(|mut entries| entries.next().is_none())
        .unwrap_or(false)
    {
        let _ = std::fs::remove_dir(path);
    }
}

#[cfg(target_os = "windows")]
fn cleanup_path(path: &Path) {
    if path.exists() {
        let _ = std::fs::remove_dir_all(path);
    }
}
