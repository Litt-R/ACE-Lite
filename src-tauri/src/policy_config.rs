use std::collections::HashSet;
use std::path::PathBuf;

use crate::registry_policy::{normalize_custom_exe_name, validate_priority};
use crate::types::{PolicyConfig, StoredPriorityPolicy};

const CONFIG_FILE_NAME: &str = "ace-lite-policies.json";

pub fn load_policy_config() -> Result<PolicyConfig, String> {
    let config_path = policy_config_path()?;

    if !config_path.exists() {
        return Ok(default_config(config_path));
    }

    let content = std::fs::read_to_string(&config_path)
        .map_err(|error| format!("读取策略配置失败: {}", error))?;

    if content.trim().is_empty() {
        return Ok(default_config(config_path));
    }

    let parsed: PolicyConfig =
        serde_json::from_str(&content).map_err(|error| format!("解析策略配置失败: {}", error))?;

    normalize_config(parsed.custom_policies, config_path)
}

pub fn save_policy_config(
    custom_policies: Vec<StoredPriorityPolicy>,
) -> Result<PolicyConfig, String> {
    let config_path = policy_config_path()?;
    let config = normalize_config(custom_policies, config_path.clone())?;

    let content = serde_json::to_string_pretty(&config)
        .map_err(|error| format!("生成策略配置失败: {}", error))?;

    std::fs::write(&config_path, content).map_err(|error| {
        format!(
            "保存策略配置失败: {}。配置文件位于程序目录，请确认当前目录可写。",
            error
        )
    })?;

    Ok(config)
}

fn default_config(config_path: PathBuf) -> PolicyConfig {
    PolicyConfig {
        version: 1,
        config_path: config_path.to_string_lossy().to_string(),
        custom_policies: Vec::new(),
    }
}

fn normalize_config(
    custom_policies: Vec<StoredPriorityPolicy>,
    config_path: PathBuf,
) -> Result<PolicyConfig, String> {
    let mut seen_exe_names = HashSet::new();
    let mut normalized_policies = Vec::new();

    for (index, policy) in custom_policies.into_iter().enumerate() {
        let exe_name = normalize_custom_exe_name(&policy.exe_name)?;
        validate_priority(policy.cpu_priority, "CPU")?;
        validate_priority(policy.io_priority, "I/O")?;
        validate_priority(policy.page_priority, "内存")?;

        let normalized_key = exe_name.to_ascii_lowercase();
        if !seen_exe_names.insert(normalized_key.clone()) {
            return Err(format!("策略配置中存在重复程序名：{}", exe_name));
        }

        let display_name = if policy.name.trim().is_empty() {
            exe_name.trim_end_matches(".exe").to_string()
        } else {
            policy.name.trim().to_string()
        };

        let id = if policy.id.trim().is_empty() {
            format!("custom-{}-{}", index + 1, normalized_key.replace('.', "-"))
        } else {
            policy.id.trim().to_string()
        };

        normalized_policies.push(StoredPriorityPolicy {
            id,
            name: display_name,
            exe_name,
            cpu_priority: policy.cpu_priority,
            io_priority: policy.io_priority,
            page_priority: policy.page_priority,
        });
    }

    Ok(PolicyConfig {
        version: 1,
        config_path: config_path.to_string_lossy().to_string(),
        custom_policies: normalized_policies,
    })
}

fn policy_config_path() -> Result<PathBuf, String> {
    let exe_path =
        std::env::current_exe().map_err(|error| format!("获取程序路径失败: {}", error))?;
    let exe_dir = exe_path
        .parent()
        .ok_or_else(|| "获取程序目录失败".to_string())?;

    Ok(exe_dir.join(CONFIG_FILE_NAME))
}
