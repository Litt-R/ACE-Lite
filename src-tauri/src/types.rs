use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct RestrictResult {
    pub target_core: u32,
    pub sguard64_found: bool,
    pub sguard64_restricted: bool,
    pub sguardsvc64_found: bool,
    pub sguardsvc64_restricted: bool,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub cpu_model: String,
    pub cpu_cores: usize,
    pub cpu_logical_cores: usize,
    pub os_name: String,
    pub os_version: String,
    pub is_admin: bool,
    pub total_memory_gb: f64,
    pub webview2_env: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessPerformance {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory_mb: f64,
    pub disk_read_bytes: u64,
    pub disk_write_bytes: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessRestrictionState {
    pub pid: u32,
    pub name: String,
    pub priority_class: Option<String>,
    pub affinity_mask: Option<String>,
    pub io_priority: Option<u32>,
    pub memory_priority: Option<u32>,
    pub efficiency_mode: Option<bool>,
    pub core_restrictions_applied: bool,
    pub optional_restrictions_unknown: bool,
    pub status_label: String,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RuntimeRestrictionStatus {
    pub target_core: u32,
    pub processes: Vec<ProcessRestrictionState>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RegistryPriorityState {
    pub configured: bool,
    pub cpu_priority: Option<u32>,
    pub io_priority: Option<u32>,
    pub page_priority: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StoredPriorityPolicy {
    pub id: String,
    pub name: String,
    pub exe_name: String,
    pub cpu_priority: u32,
    pub io_priority: u32,
    pub page_priority: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PolicyConfig {
    pub version: u32,
    pub config_path: String,
    pub custom_policies: Vec<StoredPriorityPolicy>,
}

pub type RegistryPriorityStates = HashMap<String, RegistryPriorityState>;
