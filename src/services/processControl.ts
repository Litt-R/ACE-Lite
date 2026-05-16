import { invoke } from '@tauri-apps/api/core';
import type {
  PerfDataPoint,
  PolicyConfig,
  ProcessPerformance,
  ProcessStatus,
  RegistryPriorityStates,
  RestrictionSettings,
  RuntimeRestrictionStatus,
  StoredPriorityPolicy,
  SystemInfo,
} from '../types/app';

export interface LoggedCommandDefinition {
  command: string;
  startMessage: string;
  successMessage: string;
  errorMessage: string;
}

export interface StartupPolicyDefinition {
  id: string;
  label: string;
  description: string;
  exeNames: string[];
  cpuPriority: number;
  ioPriority: number;
  pagePriority: number;
  enableCommand: LoggedCommandDefinition;
  disableCommand: LoggedCommandDefinition;
}

export interface CustomPriorityOptions {
  exeName: string;
  cpuPriority: number;
  ioPriority: number;
  pagePriority: number;
}

type RestrictionExecutionOptions = Pick<
  RestrictionSettings,
  'enableCpuAffinity' | 'enableProcessPriority' | 'enableEfficiencyMode' | 'enableIoPriority' | 'enableMemoryPriority'
>;

const aceProcessNames = ['sguard64.exe', 'sguardsvc64.exe'];

export const priorityLabels: Record<number, string> = {
  1: '低',
  2: '普通',
  3: '高',
  5: '实时',
};

export const priorityLevels = [
  { value: 1, label: priorityLabels[1] },
  { value: 2, label: priorityLabels[2] },
  { value: 3, label: priorityLabels[3] },
  { value: 5, label: priorityLabels[5] },
];

export function formatPriorityLabel(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '默认';
  }

  return priorityLabels[value] ?? String(value);
}

export function formatPrioritySummary(cpuPriority: number, ioPriority: number, pagePriority: number) {
  return `CPU ${formatPriorityLabel(cpuPriority)} / I/O ${formatPriorityLabel(ioPriority)} / 内存 ${formatPriorityLabel(pagePriority)}`;
}

export const checkRegistryPriorityCommand: LoggedCommandDefinition = {
  command: 'check_registry_priority',
  startMessage: '正在读取启动策略...',
  successMessage: '当前策略：',
  errorMessage: '读取策略失败',
};

export const resetRegistryPriorityCommand: LoggedCommandDefinition = {
  command: 'reset_registry_priority',
  startMessage: '正在清空全部启动策略...',
  successMessage: '已清空全部启动策略：',
  errorMessage: '清空启动策略失败',
};

export const startupPolicyDefinitions: StartupPolicyDefinition[] = [
  {
    id: 'ace',
    label: 'ACE 反作弊',
    description: '降低 SGuard64 / SGuardSvc64 启动优先级',
    exeNames: ['SGuard64.exe', 'SGuardSvc64.exe'],
    cpuPriority: 1,
    ioPriority: 1,
    pagePriority: 1,
    enableCommand: {
      command: 'lower_ace_priority',
      startMessage: '正在配置 ACE 启动限制...',
      successMessage: 'ACE 启动限制已配置：',
      errorMessage: '配置 ACE 启动限制失败',
    },
    disableCommand: {
      command: 'reset_ace_priority',
      startMessage: '正在恢复 ACE 启动策略...',
      successMessage: 'ACE 启动策略已恢复：',
      errorMessage: '恢复 ACE 启动策略失败',
    },
  },
  {
    id: 'valorant',
    label: '无畏契约',
    description: '提升 VALORANT-Win64-Shipping.exe 启动优先级',
    exeNames: ['VALORANT-Win64-Shipping.exe'],
    cpuPriority: 3,
    ioPriority: 3,
    pagePriority: 5,
    enableCommand: {
      command: 'modify_valorant_registry_priority',
      startMessage: '正在配置无畏契约启动提升...',
      successMessage: '无畏契约启动提升已配置：',
      errorMessage: '配置无畏契约启动提升失败',
    },
    disableCommand: {
      command: 'reset_valorant_registry_priority',
      startMessage: '正在恢复无畏契约启动策略...',
      successMessage: '无畏契约启动策略已恢复：',
      errorMessage: '恢复无畏契约启动策略失败',
    },
  },
  {
    id: 'league',
    label: '英雄联盟',
    description: '提升 League of Legends.exe 启动优先级',
    exeNames: ['League of Legends.exe'],
    cpuPriority: 3,
    ioPriority: 3,
    pagePriority: 5,
    enableCommand: {
      command: 'raise_league_priority',
      startMessage: '正在配置英雄联盟启动提升...',
      successMessage: '英雄联盟启动提升已配置：',
      errorMessage: '配置英雄联盟启动提升失败',
    },
    disableCommand: {
      command: 'reset_league_priority',
      startMessage: '正在恢复英雄联盟启动策略...',
      successMessage: '英雄联盟启动策略已恢复：',
      errorMessage: '恢复英雄联盟启动策略失败',
    },
  },
];

export async function getSystemInfo() {
  return invoke<SystemInfo>('get_system_info');
}

export async function getProcessPerformance() {
  return invoke<ProcessPerformance[]>('get_process_performance');
}

export async function getRuntimeRestrictionStatus() {
  return invoke<RuntimeRestrictionStatus>('get_runtime_restriction_status');
}

export async function getRegistryPriorityStates() {
  return invoke<RegistryPriorityStates>('get_registry_priority_states');
}

export async function restrictProcesses(options: RestrictionExecutionOptions) {
  return invoke<ProcessStatus>('restrict_processes', options);
}

export async function requestElevation() {
  return invoke<string>('request_elevation');
}

export async function applyCustomPriority(options: CustomPriorityOptions) {
  return invoke<string>('apply_custom_priority', { ...options });
}

export async function resetCustomPriority(exeName: string) {
  return invoke<string>('reset_custom_priority', { exeName });
}

export async function loadPolicyConfig() {
  return invoke<PolicyConfig>('load_policy_config');
}

export async function savePolicyConfig(customPolicies: StoredPriorityPolicy[]) {
  return invoke<PolicyConfig>('save_policy_config', { customPolicies });
}

export async function checkAutoStartStatus() {
  return invoke<boolean>('check_autostart');
}

export async function setAutoStartState(enabled: boolean) {
  const command = enabled ? 'enable_autostart' : 'disable_autostart';
  return invoke<string>(command);
}

export async function executeTextCommand(command: LoggedCommandDefinition) {
  const output = await invoke<string>(command.command);
  return output.split('\n');
}

export function hasAceProcess(performance: ProcessPerformance[]) {
  return performance.some((process) => {
    const normalizedName = process.name.toLowerCase();
    return aceProcessNames.some((aceProcessName) => normalizedName.includes(aceProcessName));
  });
}

export function buildPerformancePoint(performance: ProcessPerformance[]): PerfDataPoint {
  const sguardProcess = performance.find((process) => process.name.toLowerCase().includes('sguard64.exe'));
  const sguardServiceProcess = performance.find((process) => process.name.toLowerCase().includes('sguardsvc64.exe'));

  return {
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    sguard_cpu: sguardProcess ? parseFloat(sguardProcess.cpu_usage.toFixed(1)) : null,
    sguard_mem: sguardProcess ? parseFloat(sguardProcess.memory_mb.toFixed(1)) : null,
    sguardsvc_cpu: sguardServiceProcess ? parseFloat(sguardServiceProcess.cpu_usage.toFixed(1)) : null,
    sguardsvc_mem: sguardServiceProcess ? parseFloat(sguardServiceProcess.memory_mb.toFixed(1)) : null,
    sguard_io: sguardProcess
      ? parseFloat(((sguardProcess.disk_read_bytes + sguardProcess.disk_write_bytes) / 1024 / 5).toFixed(1))
      : null,
    sguardsvc_io: sguardServiceProcess
      ? parseFloat(((sguardServiceProcess.disk_read_bytes + sguardServiceProcess.disk_write_bytes) / 1024 / 5).toFixed(1))
      : null,
  };
}
