import { invoke } from '@tauri-apps/api/core';
import type {
  PerfDataPoint,
  ProcessPerformance,
  ProcessStatus,
  RegistryPriorityStates,
  RestrictionSettings,
  RuntimeRestrictionStatus,
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
  enableCommand: LoggedCommandDefinition;
  disableCommand: LoggedCommandDefinition;
}

type RestrictionExecutionOptions = Pick<
  RestrictionSettings,
  'enableCpuAffinity' | 'enableProcessPriority' | 'enableEfficiencyMode' | 'enableIoPriority' | 'enableMemoryPriority'
>;

const aceProcessNames = ['sguard64.exe', 'sguardsvc64.exe'];

export const checkRegistryPriorityCommand: LoggedCommandDefinition = {
  command: 'check_registry_priority',
  startMessage: '正在读取已写入的启动前策略...',
  successMessage: '当前启动前策略:',
  errorMessage: '读取启动前策略失败',
};

export const resetRegistryPriorityCommand: LoggedCommandDefinition = {
  command: 'reset_registry_priority',
  startMessage: '正在清除全部启动前优先级策略...',
  successMessage: '全部启动前优先级策略已清除:',
  errorMessage: '清除全部启动前优先级策略失败',
};

export const startupPolicyDefinitions: StartupPolicyDefinition[] = [
  {
    id: 'ace',
    label: 'ACE 默认降级',
    description: 'SGuard64 / SGuardSvc64',
    enableCommand: {
      command: 'lower_ace_priority',
      startMessage: '正在开启 ACE 默认降级策略...',
      successMessage: 'ACE 默认降级策略已开启:',
      errorMessage: '开启 ACE 默认降级策略失败',
    },
    disableCommand: {
      command: 'reset_ace_priority',
      startMessage: '正在关闭 ACE 默认降级策略...',
      successMessage: 'ACE 默认降级策略已关闭:',
      errorMessage: '关闭 ACE 默认降级策略失败',
    },
  },
  {
    id: 'valorant',
    label: '无畏契约提权',
    description: 'VALORANT-Win64-Shipping.exe',
    enableCommand: {
      command: 'modify_valorant_registry_priority',
      startMessage: '正在开启无畏契约默认提权策略...',
      successMessage: '无畏契约默认提权策略已开启:',
      errorMessage: '开启无畏契约默认提权策略失败',
    },
    disableCommand: {
      command: 'reset_valorant_registry_priority',
      startMessage: '正在关闭无畏契约默认提权策略...',
      successMessage: '无畏契约默认提权策略已关闭:',
      errorMessage: '关闭无畏契约默认提权策略失败',
    },
  },
  {
    id: 'league',
    label: '英雄联盟提权',
    description: 'League of Legends.exe',
    enableCommand: {
      command: 'raise_league_priority',
      startMessage: '正在开启英雄联盟默认提权策略...',
      successMessage: '英雄联盟默认提权策略已开启:',
      errorMessage: '开启英雄联盟默认提权策略失败',
    },
    disableCommand: {
      command: 'reset_league_priority',
      startMessage: '正在关闭英雄联盟默认提权策略...',
      successMessage: '英雄联盟默认提权策略已关闭:',
      errorMessage: '关闭英雄联盟默认提权策略失败',
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
