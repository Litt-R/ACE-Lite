import type { RestrictionSettings } from '../types/app';

export type StoredRestrictionChoices = RestrictionSettings & {
  rememberChoices: boolean;
};

export interface MonitoringSettings {
  enabled: boolean;
  intervalSeconds: number;
}

const choicesStorageKey = 'ace-lite.restriction-choices';
const monitoringStorageKey = 'ace-lite.monitoring-settings';

const defaultChoices: StoredRestrictionChoices = {
  enableCpuAffinity: true,
  enableProcessPriority: true,
  enableEfficiencyMode: false,
  enableIoPriority: false,
  enableMemoryPriority: false,
  autoRestrict: false,
  autoRestrictIntervalSeconds: 10,
  rememberChoices: false,
};

const defaultMonitoringSettings: MonitoringSettings = {
  enabled: true,
  intervalSeconds: 5,
};

const allowedMonitoringIntervals = [3, 5, 10, 30, 60];
const allowedAutoRestrictIntervals = [5, 10, 30, 60];

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function normalizeInterval(value: unknown) {
  if (typeof value !== 'number') {
    return defaultMonitoringSettings.intervalSeconds;
  }

  return allowedMonitoringIntervals.includes(value) ? value : defaultMonitoringSettings.intervalSeconds;
}

function normalizeAutoRestrictInterval(value: unknown) {
  if (typeof value !== 'number') {
    return defaultChoices.autoRestrictIntervalSeconds;
  }

  return allowedAutoRestrictIntervals.includes(value) ? value : defaultChoices.autoRestrictIntervalSeconds;
}

function normalizeChoices(value: unknown): StoredRestrictionChoices {
  if (!value || typeof value !== 'object') {
    return defaultChoices;
  }

  const candidate = value as Partial<Record<keyof StoredRestrictionChoices, unknown>>;

  return {
    enableCpuAffinity: isBoolean(candidate.enableCpuAffinity)
      ? candidate.enableCpuAffinity
      : defaultChoices.enableCpuAffinity,
    enableProcessPriority: isBoolean(candidate.enableProcessPriority)
      ? candidate.enableProcessPriority
      : defaultChoices.enableProcessPriority,
    enableEfficiencyMode: isBoolean(candidate.enableEfficiencyMode)
      ? candidate.enableEfficiencyMode
      : defaultChoices.enableEfficiencyMode,
    enableIoPriority: isBoolean(candidate.enableIoPriority) ? candidate.enableIoPriority : defaultChoices.enableIoPriority,
    enableMemoryPriority: isBoolean(candidate.enableMemoryPriority)
      ? candidate.enableMemoryPriority
      : defaultChoices.enableMemoryPriority,
    autoRestrict: isBoolean(candidate.autoRestrict) ? candidate.autoRestrict : defaultChoices.autoRestrict,
    autoRestrictIntervalSeconds: normalizeAutoRestrictInterval(candidate.autoRestrictIntervalSeconds),
    rememberChoices: isBoolean(candidate.rememberChoices) ? candidate.rememberChoices : defaultChoices.rememberChoices,
  };
}

function normalizeMonitoringSettings(value: unknown): MonitoringSettings {
  if (!value || typeof value !== 'object') {
    return defaultMonitoringSettings;
  }

  const candidate = value as Partial<Record<keyof MonitoringSettings, unknown>>;

  return {
    enabled: isBoolean(candidate.enabled) ? candidate.enabled : defaultMonitoringSettings.enabled,
    intervalSeconds: normalizeInterval(candidate.intervalSeconds),
  };
}

export const storage = {
  getChoices(): StoredRestrictionChoices {
    try {
      const rawValue = window.localStorage.getItem(choicesStorageKey);

      if (!rawValue) {
        return defaultChoices;
      }

      return normalizeChoices(JSON.parse(rawValue));
    } catch (error) {
      console.warn('读取本地设置失败，已使用默认设置。', error);
      return defaultChoices;
    }
  },

  saveChoices(choices: StoredRestrictionChoices) {
    try {
      window.localStorage.setItem(choicesStorageKey, JSON.stringify(normalizeChoices(choices)));
    } catch (error) {
      console.warn('保存本地设置失败。', error);
    }
  },

  getMonitoringSettings(): MonitoringSettings {
    try {
      const rawValue = window.localStorage.getItem(monitoringStorageKey);

      if (!rawValue) {
        return defaultMonitoringSettings;
      }

      return normalizeMonitoringSettings(JSON.parse(rawValue));
    } catch (error) {
      console.warn('读取监控设置失败，已使用默认设置。', error);
      return defaultMonitoringSettings;
    }
  },

  saveMonitoringSettings(settings: MonitoringSettings) {
    try {
      window.localStorage.setItem(monitoringStorageKey, JSON.stringify(normalizeMonitoringSettings(settings)));
    } catch (error) {
      console.warn('保存监控设置失败。', error);
    }
  },
};
