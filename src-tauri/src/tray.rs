use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::Manager;
use tauri::{AppHandle, WindowEvent};

pub fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
    let hide = MenuItem::with_id(app, "hide", "隐藏到托盘", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show,
            &PredefinedMenuItem::separator(app)?,
            &hide,
            &PredefinedMenuItem::separator(app)?,
            &quit,
        ],
    )?;

    let _tray = TrayIconBuilder::with_id("main-tray")
        .tooltip("ACE-Lite")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                button: tauri::tray::MouseButton::Left,
                ..
            }
            | TrayIconEvent::DoubleClick {
                button: tauri::tray::MouseButton::Left,
                ..
            } => {
                let app = tray.app_handle();
                show_main_window(&app);
            }
            _ => {}
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            "quit" => std::process::exit(0),
            "show" => show_main_window(app),
            "hide" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}

pub fn handle_window_event(window: &tauri::Window, event: &WindowEvent) {
    if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        let _ = window.hide();
    }
}

pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[tauri::command]
pub async fn show_close_dialog(app_handle: AppHandle) -> Result<String, String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.hide().map_err(|error| error.to_string())?;
    }
    Ok("已最小化到托盘".to_string())
}

#[tauri::command]
pub async fn close_application(_app_handle: AppHandle) -> Result<String, String> {
    std::process::exit(0);
}
