mod autostart;
mod elevation;
mod policy_config;
mod privilege;
mod process_control;
mod registry_policy;
mod report;
mod system_probe;
mod tray;
mod types;

use process_control::RestrictionOptions;
use types::{
    PolicyConfig, ProcessPerformance, RegistryPriorityStates, RestrictResult,
    RuntimeRestrictionStatus, StoredPriorityPolicy, SystemInfo,
};

struct AppState;

fn combined_policy_exe_names() -> Vec<String> {
    let mut exe_names = registry_policy::managed_exe_names();

    if let Ok(config) = policy_config::load_policy_config() {
        for policy in config.custom_policies {
            if !exe_names
                .iter()
                .any(|exe_name| exe_name.eq_ignore_ascii_case(&policy.exe_name))
            {
                exe_names.push(policy.exe_name);
            }
        }
    }

    exe_names
}

#[tauri::command]
async fn restrict_processes(
    enable_cpu_affinity: bool,
    enable_process_priority: bool,
    enable_efficiency_mode: bool,
    enable_io_priority: bool,
    enable_memory_priority: bool,
) -> RestrictResult {
    process_control::restrict_target_processes(RestrictionOptions {
        cpu_affinity: enable_cpu_affinity,
        process_priority: enable_process_priority,
        efficiency_mode: enable_efficiency_mode,
        io_priority: enable_io_priority,
        memory_priority: enable_memory_priority,
    })
}

#[tauri::command]
async fn get_system_info() -> SystemInfo {
    system_probe::collect_system_info().await
}

#[tauri::command]
async fn get_process_performance() -> Vec<ProcessPerformance> {
    system_probe::collect_process_performance()
}

#[tauri::command]
async fn get_runtime_restriction_status() -> RuntimeRestrictionStatus {
    process_control::collect_runtime_restriction_status()
}

#[tauri::command]
async fn check_game_processes() -> Vec<String> {
    Vec::new()
}

#[tauri::command]
async fn set_game_process_priority() -> Result<String, String> {
    Ok("游戏进程优先级已在 ACE-Lite 中改为手动按钮处理。".to_string())
}

#[tauri::command]
async fn enable_autostart() -> Result<String, String> {
    autostart::enable_autostart_entry()
}

#[tauri::command]
async fn disable_autostart() -> Result<String, String> {
    Ok(autostart::disable_autostart_entry())
}

#[tauri::command]
async fn check_autostart() -> Result<bool, String> {
    Ok(autostart::autostart_entry_exists())
}

#[tauri::command]
async fn lower_ace_priority() -> Result<String, String> {
    registry_policy::lower_ace_priority()
}

#[tauri::command]
async fn modify_valorant_registry_priority() -> Result<String, String> {
    registry_policy::raise_valorant_priority()
}

#[tauri::command]
async fn raise_league_priority() -> Result<String, String> {
    registry_policy::raise_league_priority()
}

#[tauri::command]
async fn reset_ace_priority() -> Result<String, String> {
    registry_policy::reset_ace_priority()
}

#[tauri::command]
async fn reset_valorant_registry_priority() -> Result<String, String> {
    registry_policy::reset_valorant_priority()
}

#[tauri::command]
async fn reset_league_priority() -> Result<String, String> {
    registry_policy::reset_league_priority()
}

#[tauri::command]
async fn check_registry_priority() -> Result<String, String> {
    Ok(registry_policy::check_priorities_for_exes(
        &combined_policy_exe_names(),
    ))
}

#[tauri::command]
async fn get_registry_priority_states() -> RegistryPriorityStates {
    registry_policy::priority_states_for_exes(&combined_policy_exe_names())
}

#[tauri::command]
async fn reset_registry_priority() -> Result<String, String> {
    registry_policy::reset_priorities_for_exes(&combined_policy_exe_names())
}

#[tauri::command]
async fn save_report_to_desktop(image_base64: String, filename: String) -> Result<String, String> {
    report::save_report_to_desktop(image_base64, filename)
}

#[tauri::command]
async fn request_elevation() -> Result<String, String> {
    elevation::request_admin_restart()
}

#[tauri::command]
async fn apply_custom_priority(
    exe_name: String,
    cpu_priority: u32,
    io_priority: u32,
    page_priority: u32,
) -> Result<String, String> {
    registry_policy::apply_custom_priority(exe_name, cpu_priority, io_priority, page_priority)
}

#[tauri::command]
async fn reset_custom_priority(exe_name: String) -> Result<String, String> {
    registry_policy::reset_custom_priority(exe_name)
}

#[tauri::command]
async fn load_policy_config() -> Result<PolicyConfig, String> {
    policy_config::load_policy_config()
}

#[tauri::command]
async fn save_policy_config(
    custom_policies: Vec<StoredPriorityPolicy>,
) -> Result<PolicyConfig, String> {
    policy_config::save_policy_config(custom_policies)
}

#[tauri::command]
async fn raise_delta_priority() -> Result<String, String> {
    Ok("三角洲行动优化已在 ACE-Lite 中停用。".to_string())
}

#[tauri::command]
async fn raise_arena_priority() -> Result<String, String> {
    Ok("暗区突围优化已在 ACE-Lite 中停用。".to_string())
}

#[tauri::command]
async fn raise_finals_priority() -> Result<String, String> {
    Ok("THE FINALS 优化已在 ACE-Lite 中停用。".to_string())
}

#[tauri::command]
async fn raise_nzfuture_priority() -> Result<String, String> {
    Ok("逆战未来优化已在 ACE-Lite 中停用。".to_string())
}

#[tauri::command]
async fn raise_crossfire_priority() -> Result<String, String> {
    Ok("穿越火线优化已在 ACE-Lite 中停用。".to_string())
}

#[tauri::command]
async fn raise_dnf_priority() -> Result<String, String> {
    Ok("DNF 优化已在 ACE-Lite 中停用。".to_string())
}

#[tauri::command]
async fn raise_rocoworld_priority() -> Result<String, String> {
    Ok("洛克王国优化已在 ACE-Lite 中停用。".to_string())
}

#[tauri::command]
async fn raise_wutheringwaves_priority() -> Result<String, String> {
    Ok("鸣潮优化已在 ACE-Lite 中停用。".to_string())
}

#[tauri::command]
async fn raise_poe2_priority() -> Result<String, String> {
    Ok("流放之路 2 优化已在 ACE-Lite 中停用。".to_string())
}

#[tauri::command]
async fn raise_division2_priority() -> Result<String, String> {
    Ok("全境封锁 2 优化已在 ACE-Lite 中停用。".to_string())
}

#[tauri::command]
async fn raise_endfield_priority() -> Result<String, String> {
    Ok("终末地优化已在 ACE-Lite 中停用。".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "windows")]
    elevation::handle_autostart_elevation();

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            tray::show_main_window(app);
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .manage(AppState)
        .setup(|app| {
            tray::setup_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(tray::handle_window_event)
        .invoke_handler(tauri::generate_handler![
            restrict_processes,
            get_system_info,
            get_process_performance,
            get_runtime_restriction_status,
            tray::show_close_dialog,
            tray::close_application,
            enable_autostart,
            disable_autostart,
            check_autostart,
            lower_ace_priority,
            raise_delta_priority,
            modify_valorant_registry_priority,
            raise_league_priority,
            reset_ace_priority,
            reset_valorant_registry_priority,
            reset_league_priority,
            raise_arena_priority,
            raise_finals_priority,
            raise_nzfuture_priority,
            check_registry_priority,
            get_registry_priority_states,
            reset_registry_priority,
            check_game_processes,
            set_game_process_priority,
            save_report_to_desktop,
            request_elevation,
            apply_custom_priority,
            reset_custom_priority,
            load_policy_config,
            save_policy_config,
            raise_crossfire_priority,
            raise_dnf_priority,
            raise_rocoworld_priority,
            raise_wutheringwaves_priority,
            raise_poe2_priority,
            raise_division2_priority,
            raise_endfield_priority,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
