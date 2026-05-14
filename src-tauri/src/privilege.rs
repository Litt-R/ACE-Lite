#[cfg(target_os = "windows")]
fn enable_named_privilege(privilege_name: &str) -> bool {
    unsafe {
        use windows::core::PCWSTR;
        use windows::Win32::Foundation::{CloseHandle, LUID};
        use windows::Win32::Security::{
            AdjustTokenPrivileges, LookupPrivilegeValueW, LUID_AND_ATTRIBUTES,
            SE_PRIVILEGE_ENABLED, TOKEN_ADJUST_PRIVILEGES, TOKEN_PRIVILEGES,
        };
        use windows::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};

        let mut token_handle = windows::Win32::Foundation::HANDLE::default();

        if OpenProcessToken(
            GetCurrentProcess(),
            TOKEN_ADJUST_PRIVILEGES,
            &mut token_handle,
        )
        .is_err()
        {
            eprintln!("[privilege] OpenProcessToken failed for {}", privilege_name);
            return false;
        }

        let mut luid = LUID::default();
        let privilege_name_wide: Vec<u16> =
            format!("{}\0", privilege_name).encode_utf16().collect();

        if LookupPrivilegeValueW(
            PCWSTR::null(),
            PCWSTR(privilege_name_wide.as_ptr()),
            &mut luid,
        )
        .is_err()
        {
            eprintln!(
                "[privilege] LookupPrivilegeValueW failed for {}",
                privilege_name
            );
            let _ = CloseHandle(token_handle);
            return false;
        }

        let mut token_privileges = TOKEN_PRIVILEGES {
            PrivilegeCount: 1,
            Privileges: [LUID_AND_ATTRIBUTES {
                Luid: luid,
                Attributes: SE_PRIVILEGE_ENABLED,
            }],
        };

        let result = AdjustTokenPrivileges(
            token_handle,
            false,
            Some(&mut token_privileges),
            0,
            None,
            None,
        );
        let _ = CloseHandle(token_handle);

        if result.is_ok() {
            eprintln!("[privilege] {} enabled", privilege_name);
            true
        } else {
            eprintln!(
                "[privilege] AdjustTokenPrivileges failed for {}",
                privilege_name
            );
            false
        }
    }
}

#[cfg(target_os = "windows")]
pub fn enable_debug_privilege() -> bool {
    enable_named_privilege("SeDebugPrivilege")
}

#[cfg(target_os = "windows")]
pub fn enable_increase_base_priority_privilege() -> bool {
    enable_named_privilege("SeIncreaseBasePriorityPrivilege")
}

#[cfg(not(target_os = "windows"))]
pub fn enable_debug_privilege() -> bool {
    false
}

#[cfg(not(target_os = "windows"))]
pub fn enable_increase_base_priority_privilege() -> bool {
    false
}

#[cfg(target_os = "windows")]
pub fn is_elevated() -> bool {
    unsafe {
        use windows::Win32::Foundation::CloseHandle;
        use windows::Win32::Security::{
            GetTokenInformation, TokenElevation, TOKEN_ELEVATION, TOKEN_QUERY,
        };
        use windows::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};

        let mut token_handle = windows::Win32::Foundation::HANDLE::default();

        if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token_handle).is_err() {
            return false;
        }

        let mut elevation = TOKEN_ELEVATION { TokenIsElevated: 0 };
        let mut return_length: u32 = 0;

        let result = GetTokenInformation(
            token_handle,
            TokenElevation,
            Some(&mut elevation as *mut _ as *mut _),
            std::mem::size_of::<TOKEN_ELEVATION>() as u32,
            &mut return_length,
        );

        let _ = CloseHandle(token_handle);

        result.is_ok() && elevation.TokenIsElevated != 0
    }
}

#[cfg(not(target_os = "windows"))]
pub fn is_elevated() -> bool {
    false
}
