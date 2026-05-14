use sysinfo::System;

use crate::privilege::is_elevated;
use crate::types::{ProcessPerformance, SystemInfo};

const ACE_PROCESS_NAMES: [&str; 2] = ["sguard64.exe", "sguardsvc64.exe"];

pub async fn get_webview2_environment() -> String {
    #[cfg(target_os = "windows")]
    {
        use std::env;

        if env::var("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER")
            .map(|path| !path.is_empty())
            .unwrap_or(false)
        {
            return "portable environment".to_string();
        }

        if let Ok(exe_path) = env::current_exe() {
            if exe_path
                .parent()
                .map(|exe_dir| exe_dir.join("webview2").exists())
                .unwrap_or(false)
            {
                return "portable environment".to_string();
            }
        }

        "local environment".to_string()
    }

    #[cfg(not(target_os = "windows"))]
    {
        "non-windows platform".to_string()
    }
}

pub async fn collect_system_info() -> SystemInfo {
    let mut system = System::new();
    system.refresh_cpu_specifics(sysinfo::CpuRefreshKind::everything());
    system.refresh_memory();

    SystemInfo {
        cpu_model: resolve_cpu_model(&system),
        cpu_cores: system.physical_core_count().unwrap_or(0),
        cpu_logical_cores: system.cpus().len(),
        os_name: System::name().unwrap_or_else(|| "Unknown".to_string()),
        os_version: System::os_version().unwrap_or_else(|| "Unknown".to_string()),
        is_admin: is_elevated(),
        total_memory_gb: system.total_memory() as f64 / 1024.0 / 1024.0 / 1024.0,
        webview2_env: get_webview2_environment().await,
    }
}

pub fn collect_process_performance() -> Vec<ProcessPerformance> {
    let mut system = System::new();
    system.refresh_cpu_specifics(sysinfo::CpuRefreshKind::everything());
    system.refresh_processes();
    std::thread::sleep(std::time::Duration::from_millis(200));
    system.refresh_processes();

    system
        .processes()
        .iter()
        .filter_map(|(pid, process)| {
            let process_name = process.name().to_lowercase();
            if !ACE_PROCESS_NAMES
                .iter()
                .any(|target| process_name.contains(target))
            {
                return None;
            }

            let disk = process.disk_usage();
            Some(ProcessPerformance {
                pid: pid.as_u32(),
                name: process.name().to_string(),
                cpu_usage: process.cpu_usage(),
                memory_mb: process.memory() as f64 / 1024.0 / 1024.0,
                disk_read_bytes: disk.read_bytes,
                disk_write_bytes: disk.written_bytes,
            })
        })
        .collect()
}

fn resolve_cpu_model(system: &System) -> String {
    system
        .cpus()
        .first()
        .map(|cpu| cpu.brand().trim())
        .filter(|brand| !brand.is_empty())
        .map(|brand| brand.to_string())
        .or_else(read_cpu_model_from_registry)
        .unwrap_or_else(|| "Unknown".to_string())
}

fn read_cpu_model_from_registry() -> Option<String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::HKEY_LOCAL_MACHINE;
        use winreg::RegKey;

        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let cpu_key = hklm
            .open_subkey(r"HARDWARE\DESCRIPTION\System\CentralProcessor\0")
            .ok()?;

        return cpu_key
            .get_value::<String, _>("ProcessorNameString")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());
    }

    #[cfg(not(target_os = "windows"))]
    {
        None
    }
}
