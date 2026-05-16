export interface ProcessStatus {
  target_core: number;
  sguard64_found: boolean;
  sguard64_restricted: boolean;
  sguardsvc64_found: boolean;
  sguardsvc64_restricted: boolean;
  message: string;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
}

export interface SystemInfo {
  cpu_model: string;
  cpu_cores: number;
  cpu_logical_cores: number;
  os_name: string;
  os_version: string;
  is_admin: boolean;
  total_memory_gb: number;
  webview2_env: string;
}
export interface ProcessPerformance {
  pid:number;
  name:string;
  cpu_usage:number;
  memory_mb:number;
  disk_read_bytes: number;
  disk_write_bytes: number;
}
export interface PerfDataPoint{
  time: string;
  sguard_cpu: number | null;
  sguard_mem: number | null;
  sguardsvc_cpu: number | null;
  sguardsvc_mem: number | null;
  sguard_io:number | null;
  sguardsvc_io: number | null;
}
export interface RegistryPriorityState {
  configured: boolean;
  cpu_priority: number | null;
  io_priority: number | null;
  page_priority: number | null;
}

export interface StoredPriorityPolicy {
  id: string;
  name: string;
  exe_name: string;
  cpu_priority: number;
  io_priority: number;
  page_priority: number;
}

export interface PolicyConfig {
  version: number;
  config_path: string;
  custom_policies: StoredPriorityPolicy[];
}

export type RegistryPriorityStates = Record<string, RegistryPriorityState>;

export interface RestrictionSettings {
  enableCpuAffinity:boolean;
  enableProcessPriority:boolean;
  enableEfficiencyMode:boolean;
  enableIoPriority:boolean;
  enableMemoryPriority:boolean;
  autoRestrict:boolean;
  autoRestrictIntervalSeconds:number;
}

export interface ProcessRestrictionState {
  pid: number;
  name: string;
  priority_class: string | null;
  affinity_mask: string | null;
  io_priority: number | null;
  memory_priority: number | null;
  efficiency_mode: boolean | null;
  core_restrictions_applied: boolean;
  optional_restrictions_unknown: boolean;
  status_label: string;
  error: string | null;
}

export interface RuntimeRestrictionStatus {
  target_core: number;
  processes: ProcessRestrictionState[];
}

export type RestrictionSettingKey = keyof RestrictionSettings;
