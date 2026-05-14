use sysinfo::{Pid, System};
use windows::Win32::Foundation::{HANDLE, NTSTATUS};

use crate::privilege::{enable_debug_privilege, enable_increase_base_priority_privilege};
use crate::types::{ProcessRestrictionState, RestrictResult, RuntimeRestrictionStatus};

const ACE_PROCESS_NAMES: [&str; 2] = ["sguard64.exe", "sguardsvc64.exe"];

#[repr(C)]
struct PagePriorityInformation {
    page_priority: u32,
}

#[link(name = "ntdll")]
extern "system" {
    fn NtSetInformationProcess(
        process_handle: HANDLE,
        process_information_class: u32,
        process_information: *const core::ffi::c_void,
        process_information_length: u32,
    ) -> NTSTATUS;

    fn NtQueryInformationProcess(
        process_handle: HANDLE,
        process_information_class: u32,
        process_information: *mut core::ffi::c_void,
        process_information_length: u32,
        return_length: *mut u32,
    ) -> NTSTATUS;
}

const PROCESS_IO_PRIORITY_CLASS: u32 = 33;
const PROCESS_PAGE_PRIORITY_CLASS: u32 = 39;
const PROCESS_POWER_THROTTLING_CLASS: u32 = 77;
const IO_PRIORITY_VERY_LOW: u32 = 0;
const PAGE_PRIORITY_LOW: u32 = 1;

#[derive(Debug, Clone, Copy)]
pub struct RestrictionOptions {
    pub cpu_affinity: bool,
    pub process_priority: bool,
    pub efficiency_mode: bool,
    pub io_priority: bool,
    pub memory_priority: bool,
}

#[derive(Debug, Default)]
struct AppliedRestriction {
    affinity: Option<String>,
    process_priority: Option<bool>,
    efficiency_mode: Option<bool>,
    io_priority: Option<bool>,
    memory_priority: Option<bool>,
}

impl AppliedRestriction {
    fn any_success(&self) -> bool {
        self.affinity.is_some()
            || self.process_priority == Some(true)
            || self.efficiency_mode == Some(true)
            || self.io_priority == Some(true)
            || self.memory_priority == Some(true)
    }

    fn describe(&self, options: RestrictionOptions) -> String {
        let mut details = Vec::new();

        if let Some(affinity) = &self.affinity {
            details.push(affinity.clone());
        } else if options.cpu_affinity {
            details.push("CPU 亲和性设置失败".to_string());
        }

        if options.process_priority {
            details.push(if self.process_priority == Some(true) {
                "进程优先级已降低".to_string()
            } else {
                "进程优先级设置失败".to_string()
            });
        }

        if options.efficiency_mode {
            details.push(if self.efficiency_mode == Some(true) {
                "效率模式已启用".to_string()
            } else {
                "效率模式设置失败".to_string()
            });
        }

        if options.io_priority {
            details.push(if self.io_priority == Some(true) {
                "I/O 优先级已降低".to_string()
            } else {
                "I/O 优先级设置失败".to_string()
            });
        }

        if options.memory_priority {
            details.push(if self.memory_priority == Some(true) {
                "内存优先级已降低".to_string()
            } else {
                "内存优先级设置失败".to_string()
            });
        }

        if details.is_empty() {
            "没有启用任何限制策略".to_string()
        } else {
            details.join("，")
        }
    }
}

pub fn restrict_target_processes(options: RestrictionOptions) -> RestrictResult {
    enable_debug_privilege();
    if options.io_priority {
        enable_increase_base_priority_privilege();
    }

    let mut system = System::new_all();
    system.refresh_processes();

    let target_core = target_logical_core();
    let core_mask = 1u64 << target_core;
    let mut result = RestrictionRun::new(target_core, options);

    for (pid, process) in system.processes() {
        let process_name = process.name().to_lowercase();
        let Some(target_name) = ACE_PROCESS_NAMES
            .iter()
            .find(|target_name| process_name.contains(**target_name))
        else {
            continue;
        };

        result.mark_found(target_name);
        let applied = apply_restrictions(*pid, core_mask, options);
        result.record_process(target_name, pid.as_u32(), applied);
    }

    result.finish()
}

fn target_logical_core() -> u32 {
    let system = System::new_all();
    system.cpus().len().saturating_sub(1) as u32
}

pub fn collect_runtime_restriction_status() -> RuntimeRestrictionStatus {
    let mut system = System::new_all();
    system.refresh_processes();

    let target_core = target_logical_core();
    let target_mask = 1u64 << target_core;
    let processes = system
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

            Some(query_process_restriction_state(
                pid.as_u32(),
                process.name().to_string(),
                target_mask,
            ))
        })
        .collect();

    RuntimeRestrictionStatus {
        target_core,
        processes,
    }
}

fn apply_restrictions(pid: Pid, core_mask: u64, options: RestrictionOptions) -> AppliedRestriction {
    let mut applied = AppliedRestriction::default();

    if options.cpu_affinity {
        let core_id = core_mask.trailing_zeros();
        let (success, error) = set_process_affinity(pid, core_mask);
        applied.affinity = if success {
            Some(format!("CPU 亲和性已设置到逻辑核心 {}", core_id))
        } else {
            error.map(|message| format!("CPU 亲和性设置失败 ({})", message))
        };
    }

    if options.process_priority {
        applied.process_priority = Some(set_process_priority(pid));
    }

    if options.efficiency_mode {
        applied.efficiency_mode = Some(set_process_efficiency_mode(pid).0);
    }

    if options.io_priority {
        applied.io_priority = Some(set_process_io_priority(pid).0);
    }

    if options.memory_priority {
        applied.memory_priority = Some(set_process_memory_priority(pid).0);
    }

    applied
}

struct RestrictionRun {
    target_core: u32,
    options: RestrictionOptions,
    sguard64_found: bool,
    sguard64_restricted: bool,
    sguardsvc64_found: bool,
    sguardsvc64_restricted: bool,
    message: String,
}

impl RestrictionRun {
    fn new(target_core: u32, options: RestrictionOptions) -> Self {
        let mut message = String::new();
        message.push_str(&format!("限制模式: {}\n", describe_mode(options)));
        message.push_str(&format!("目标逻辑核心: {}\n", target_core));

        Self {
            target_core,
            options,
            sguard64_found: false,
            sguard64_restricted: false,
            sguardsvc64_found: false,
            sguardsvc64_restricted: false,
            message,
        }
    }

    fn mark_found(&mut self, target_name: &str) {
        match target_name {
            "sguard64.exe" => self.sguard64_found = true,
            "sguardsvc64.exe" => self.sguardsvc64_found = true,
            _ => {}
        }
    }

    fn record_process(&mut self, target_name: &str, pid: u32, applied: AppliedRestriction) {
        let restricted = applied.any_success();
        match target_name {
            "sguard64.exe" => self.sguard64_restricted = restricted,
            "sguardsvc64.exe" => self.sguardsvc64_restricted = restricted,
            _ => {}
        }

        self.message.push_str(&format!(
            "{} (PID: {}) [{}]\n",
            target_name,
            pid,
            applied.describe(self.options)
        ));
    }

    fn finish(mut self) -> RestrictResult {
        if !self.sguard64_found {
            self.message.push_str("未检测到 SGuard64.exe\n");
        }

        if !self.sguardsvc64_found {
            self.message.push_str("未检测到 SGuardSvc64.exe\n");
        }

        RestrictResult {
            target_core: self.target_core,
            sguard64_found: self.sguard64_found,
            sguard64_restricted: self.sguard64_restricted,
            sguardsvc64_found: self.sguardsvc64_found,
            sguardsvc64_restricted: self.sguardsvc64_restricted,
            message: self.message,
        }
    }
}

fn describe_mode(options: RestrictionOptions) -> String {
    let mode_parts = [
        (options.cpu_affinity, "CPU 亲和性"),
        (options.process_priority, "进程优先级"),
        (options.efficiency_mode, "效率模式"),
        (options.io_priority, "I/O 优先级"),
        (options.memory_priority, "内存优先级"),
    ]
    .into_iter()
    .filter_map(|(enabled, label)| enabled.then_some(label))
    .collect::<Vec<_>>();

    if mode_parts.is_empty() {
        "标准模式".to_string()
    } else {
        mode_parts.join("+")
    }
}

fn set_process_affinity(pid: Pid, core_mask: u64) -> (bool, Option<String>) {
    unsafe {
        use windows::Win32::Foundation::CloseHandle;
        use windows::Win32::System::Threading::{
            OpenProcess, SetProcessAffinityMask, PROCESS_QUERY_INFORMATION, PROCESS_SET_INFORMATION,
        };

        let process_handle = OpenProcess(
            PROCESS_SET_INFORMATION | PROCESS_QUERY_INFORMATION,
            false,
            pid.as_u32(),
        );

        let handle = match process_handle {
            Ok(handle) => handle,
            Err(error) => {
                eprintln!(
                    "[process affinity] PID {} OpenProcess failed: {:?}",
                    pid, error
                );
                return (false, Some(format!("打开进程失败: {:?}", error)));
            }
        };

        if handle.is_invalid() {
            eprintln!("[process affinity] PID {} invalid process handle", pid);
            return (false, Some("进程句柄无效".to_string()));
        }

        let result = SetProcessAffinityMask(handle, core_mask as usize);
        let _ = CloseHandle(handle);

        if let Err(error) = &result {
            eprintln!(
                "[process affinity] PID {} SetProcessAffinityMask failed: {:?}",
                pid, error
            );
            return (false, Some(format!("设置 CPU 亲和性失败: {:?}", error)));
        }

        (true, None)
    }
}

fn set_process_priority(pid: Pid) -> bool {
    unsafe {
        use windows::Win32::Foundation::CloseHandle;
        use windows::Win32::System::Threading::{
            OpenProcess, SetPriorityClass, IDLE_PRIORITY_CLASS, PROCESS_QUERY_INFORMATION,
            PROCESS_SET_INFORMATION,
        };

        let process_handle = match OpenProcess(
            PROCESS_SET_INFORMATION | PROCESS_QUERY_INFORMATION,
            false,
            pid.as_u32(),
        ) {
            Ok(handle) => handle,
            Err(error) => {
                eprintln!(
                    "[process priority] PID {} OpenProcess failed: {:?}",
                    pid, error
                );
                return false;
            }
        };

        if process_handle.is_invalid() {
            eprintln!("[process priority] PID {} invalid process handle", pid);
            return false;
        }

        let result = SetPriorityClass(process_handle, IDLE_PRIORITY_CLASS);
        let _ = CloseHandle(process_handle);

        if let Err(error) = &result {
            eprintln!(
                "[process priority] PID {} SetPriorityClass failed: {:?}",
                pid, error
            );
        }

        result.is_ok()
    }
}

fn set_process_efficiency_mode(pid: Pid) -> (bool, Option<String>) {
    unsafe {
        use windows::Win32::Foundation::CloseHandle;
        use windows::Win32::System::Threading::{
            OpenProcess, SetPriorityClass, IDLE_PRIORITY_CLASS,
            PROCESS_POWER_THROTTLING_EXECUTION_SPEED, PROCESS_POWER_THROTTLING_STATE,
            PROCESS_QUERY_INFORMATION, PROCESS_QUERY_LIMITED_INFORMATION, PROCESS_SET_INFORMATION,
            PROCESS_SET_LIMITED_INFORMATION,
        };

        let process_handle = match OpenProcess(
            PROCESS_SET_INFORMATION | PROCESS_QUERY_INFORMATION,
            false,
            pid.as_u32(),
        ) {
            Ok(handle) => handle,
            Err(primary_error) => match OpenProcess(
                PROCESS_SET_LIMITED_INFORMATION | PROCESS_QUERY_LIMITED_INFORMATION,
                false,
                pid.as_u32(),
            ) {
                Ok(handle) => handle,
                Err(error) => {
                    eprintln!(
                        "[efficiency mode] PID {} OpenProcess failed: {:?}; limited failed: {:?}",
                        pid, primary_error, error
                    );
                    return (false, Some(format!("打开进程失败: {:?}", error)));
                }
            },
        };

        if process_handle.is_invalid() {
            eprintln!("[efficiency mode] PID {} invalid process handle", pid);
            return (false, Some("进程句柄无效".to_string()));
        }

        let priority_result = SetPriorityClass(process_handle, IDLE_PRIORITY_CLASS);
        if let Err(error) = &priority_result {
            eprintln!(
                "[efficiency mode] PID {} SetPriorityClass(IDLE) before throttling failed: {:?}",
                pid, error
            );
        }

        let mut throttling_state = PROCESS_POWER_THROTTLING_STATE {
            Version: 1,
            ControlMask: PROCESS_POWER_THROTTLING_EXECUTION_SPEED,
            StateMask: PROCESS_POWER_THROTTLING_EXECUTION_SPEED,
        };

        let status = NtSetInformationProcess(
            process_handle,
            PROCESS_POWER_THROTTLING_CLASS,
            &mut throttling_state as *mut _ as *const _,
            std::mem::size_of::<PROCESS_POWER_THROTTLING_STATE>() as u32,
        );

        let _ = CloseHandle(process_handle);

        if status.is_err() {
            eprintln!(
                "[efficiency mode] PID {} NtSetInformationProcess(ProcessPowerThrottling) failed: {:?}",
                pid, status
            );
            return (false, Some(format!("设置效率模式失败: {:?}", status)));
        }

        (true, None)
    }
}

fn set_process_io_priority(pid: Pid) -> (bool, Option<String>) {
    unsafe {
        use windows::Win32::Foundation::CloseHandle;
        use windows::Win32::System::Threading::{
            OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_QUERY_LIMITED_INFORMATION,
            PROCESS_SET_INFORMATION, PROCESS_SET_LIMITED_INFORMATION,
        };

        let process_handle = match OpenProcess(
            PROCESS_SET_INFORMATION | PROCESS_QUERY_INFORMATION,
            false,
            pid.as_u32(),
        ) {
            Ok(handle) => handle,
            Err(primary_error) => match OpenProcess(
                PROCESS_SET_LIMITED_INFORMATION | PROCESS_QUERY_LIMITED_INFORMATION,
                false,
                pid.as_u32(),
            ) {
                Ok(handle) => handle,
                Err(error) => {
                    eprintln!(
                        "[io priority] PID {} OpenProcess failed: {:?}; limited failed: {:?}",
                        pid, primary_error, error
                    );
                    return (false, Some(format!("打开进程失败: {:?}", error)));
                }
            },
        };

        if process_handle.is_invalid() {
            eprintln!("[io priority] PID {} invalid process handle", pid);
            return (false, Some("进程句柄无效".to_string()));
        }

        let io_priority: u32 = IO_PRIORITY_VERY_LOW;
        let status = NtSetInformationProcess(
            process_handle,
            PROCESS_IO_PRIORITY_CLASS,
            &io_priority as *const _ as *const _,
            std::mem::size_of::<u32>() as u32,
        );

        let _ = CloseHandle(process_handle);

        if status.is_err() {
            eprintln!(
                "[io priority] PID {} NtSetInformationProcess(ProcessIoPriority) failed: {:?}",
                pid, status
            );
            return (false, Some(format!("设置 I/O 优先级失败: {:?}", status)));
        }

        (true, None)
    }
}

fn set_process_memory_priority(pid: Pid) -> (bool, Option<String>) {
    unsafe {
        use windows::Win32::Foundation::CloseHandle;
        use windows::Win32::System::Threading::{
            OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_QUERY_LIMITED_INFORMATION,
            PROCESS_SET_INFORMATION, PROCESS_SET_LIMITED_INFORMATION,
        };

        let process_handle = match OpenProcess(
            PROCESS_SET_INFORMATION | PROCESS_QUERY_INFORMATION,
            false,
            pid.as_u32(),
        ) {
            Ok(handle) => handle,
            Err(primary_error) => match OpenProcess(
                PROCESS_SET_LIMITED_INFORMATION | PROCESS_QUERY_LIMITED_INFORMATION,
                false,
                pid.as_u32(),
            ) {
                Ok(handle) => handle,
                Err(error) => {
                    eprintln!(
                        "[memory priority] PID {} OpenProcess failed: {:?}; limited failed: {:?}",
                        pid, primary_error, error
                    );
                    return (false, Some(format!("打开进程失败: {:?}", error)));
                }
            },
        };

        if process_handle.is_invalid() {
            eprintln!("[memory priority] PID {} invalid process handle", pid);
            return (false, Some("进程句柄无效".to_string()));
        }

        let page_priority_info = PagePriorityInformation {
            page_priority: PAGE_PRIORITY_LOW,
        };
        let status = NtSetInformationProcess(
            process_handle,
            PROCESS_PAGE_PRIORITY_CLASS,
            &page_priority_info as *const _ as *const _,
            std::mem::size_of::<PagePriorityInformation>() as u32,
        );

        let _ = CloseHandle(process_handle);

        if status.is_err() {
            eprintln!(
                "[memory priority] PID {} NtSetInformationProcess(ProcessPagePriority) failed: {:?}",
                pid, status
            );
            return (false, Some(format!("设置内存页优先级失败: {:?}", status)));
        }

        (true, None)
    }
}

fn query_process_restriction_state(
    pid: u32,
    name: String,
    target_mask: u64,
) -> ProcessRestrictionState {
    unsafe {
        use windows::Win32::Foundation::CloseHandle;
        use windows::Win32::System::Threading::{
            GetPriorityClass, GetProcessAffinityMask, OpenProcess,
            PROCESS_POWER_THROTTLING_EXECUTION_SPEED, PROCESS_POWER_THROTTLING_STATE,
            PROCESS_QUERY_INFORMATION, PROCESS_QUERY_LIMITED_INFORMATION,
        };

        let handle = match OpenProcess(
            PROCESS_QUERY_INFORMATION | PROCESS_QUERY_LIMITED_INFORMATION,
            false,
            pid,
        ) {
            Ok(handle) => handle,
            Err(error) => {
                return ProcessRestrictionState {
                    pid,
                    name,
                    priority_class: None,
                    affinity_mask: None,
                    io_priority: None,
                    memory_priority: None,
                    efficiency_mode: None,
                    core_restrictions_applied: false,
                    optional_restrictions_unknown: true,
                    status_label: "无法确认".to_string(),
                    error: Some(format!("打开进程失败: {:?}", error)),
                };
            }
        };

        if handle.is_invalid() {
            return ProcessRestrictionState {
                pid,
                name,
                priority_class: None,
                affinity_mask: None,
                io_priority: None,
                memory_priority: None,
                efficiency_mode: None,
                core_restrictions_applied: false,
                optional_restrictions_unknown: true,
                status_label: "无法确认".to_string(),
                error: Some("进程句柄无效".to_string()),
            };
        }

        let priority_class = priority_class_name(GetPriorityClass(handle));

        let mut process_mask = 0usize;
        let mut system_mask = 0usize;
        let affinity_mask =
            if GetProcessAffinityMask(handle, &mut process_mask, &mut system_mask).is_ok() {
                Some(format!("0x{:X}", process_mask))
            } else {
                None
            };

        let io_priority = query_process_io_priority(handle);
        let memory_priority = query_process_page_priority(handle);

        let mut throttling_state = PROCESS_POWER_THROTTLING_STATE {
            Version: 1,
            ControlMask: 0,
            StateMask: 0,
        };
        let efficiency_status = NtQueryInformationProcess(
            handle,
            PROCESS_POWER_THROTTLING_CLASS,
            &mut throttling_state as *mut _ as *mut _,
            std::mem::size_of::<PROCESS_POWER_THROTTLING_STATE>() as u32,
            std::ptr::null_mut(),
        );
        let efficiency_mode = (!efficiency_status.is_err()).then_some(
            (throttling_state.StateMask & PROCESS_POWER_THROTTLING_EXECUTION_SPEED) != 0,
        );

        let _ = CloseHandle(handle);

        let core_restrictions_applied =
            priority_class.as_deref() == Some("低") && process_mask as u64 == target_mask;
        let optional_restrictions_unknown =
            io_priority.is_none() || memory_priority.is_none() || efficiency_mode.is_none();
        let status_label = if core_restrictions_applied && optional_restrictions_unknown {
            "核心项已生效"
        } else if core_restrictions_applied {
            "核心项已生效"
        } else {
            "待应用"
        }
        .to_string();

        ProcessRestrictionState {
            pid,
            name,
            priority_class,
            affinity_mask,
            io_priority,
            memory_priority,
            efficiency_mode,
            core_restrictions_applied,
            optional_restrictions_unknown,
            status_label,
            error: None,
        }
    }
}

fn query_process_io_priority(handle: HANDLE) -> Option<u32> {
    let mut io_priority = 0u32;
    let status = unsafe {
        NtQueryInformationProcess(
            handle,
            PROCESS_IO_PRIORITY_CLASS,
            &mut io_priority as *mut _ as *mut _,
            std::mem::size_of::<u32>() as u32,
            std::ptr::null_mut(),
        )
    };

    if status.is_ok() {
        Some(io_priority)
    } else {
        None
    }
}

fn query_process_page_priority(handle: HANDLE) -> Option<u32> {
    let mut page_priority_info = PagePriorityInformation { page_priority: 0 };
    let status = unsafe {
        NtQueryInformationProcess(
            handle,
            PROCESS_PAGE_PRIORITY_CLASS,
            &mut page_priority_info as *mut _ as *mut _,
            std::mem::size_of::<PagePriorityInformation>() as u32,
            std::ptr::null_mut(),
        )
    };

    if status.is_ok() {
        Some(page_priority_info.page_priority)
    } else {
        None
    }
}

fn priority_class_name(priority_class: u32) -> Option<String> {
    use windows::Win32::System::Threading::{
        ABOVE_NORMAL_PRIORITY_CLASS, BELOW_NORMAL_PRIORITY_CLASS, HIGH_PRIORITY_CLASS,
        IDLE_PRIORITY_CLASS, NORMAL_PRIORITY_CLASS, REALTIME_PRIORITY_CLASS,
    };

    match priority_class {
        value if value == IDLE_PRIORITY_CLASS.0 => Some("低".to_string()),
        value if value == BELOW_NORMAL_PRIORITY_CLASS.0 => Some("低于正常".to_string()),
        value if value == NORMAL_PRIORITY_CLASS.0 => Some("正常".to_string()),
        value if value == ABOVE_NORMAL_PRIORITY_CLASS.0 => Some("高于正常".to_string()),
        value if value == HIGH_PRIORITY_CLASS.0 => Some("高".to_string()),
        value if value == REALTIME_PRIORITY_CLASS.0 => Some("实时".to_string()),
        0 => None,
        value => Some(format!("未知({})", value)),
    }
}
