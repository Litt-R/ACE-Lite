import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { Box, Container, CssBaseline, Stack, ThemeProvider } from '@mui/material';
import { ActiveActionsCard } from './components/ActiveActionsCard';
import { AppHeader } from './components/AppHeader';
import { LogPanel } from './components/LogPanel';
import { PassiveActionsCard } from './components/PassiveActionsCard';
import { PerformancePanel } from './components/PerformancePanel';
import { RestrictionStatusCard } from './components/RestrictionStatusCard';
import { SystemInfoCard } from './components/SystemInfoCard';
import { WindowTitleBar } from './components/WindowTitleBar';
import './styles.css';
import {
  buildPerformancePoint,
  checkAutoStartStatus,
  checkRegistryPriorityCommand,
  executeTextCommand,
  getProcessPerformance,
  getRegistryPriorityStates,
  getRuntimeRestrictionStatus,
  getSystemInfo,
  hasAceProcess,
  resetRegistryPriorityCommand,
  restrictProcesses,
  setAutoStartState,
  startupPolicyDefinitions,
  type LoggedCommandDefinition,
} from './services/processControl';
import { savePerformanceReport } from './services/report';
import { darkTheme, lightTheme } from './theme/appTheme';
import type {
  LogEntry,
  PerfDataPoint,
  ProcessPerformance,
  ProcessStatus,
  RegistryPriorityStates,
  RestrictionSettingKey,
  RestrictionSettings,
  RuntimeRestrictionStatus,
  SystemInfo,
} from './types/app';
import { storage } from './utils/storage';

const maxVisibleHistoryPoints = 360;
const restrictionSettingKeys: RestrictionSettingKey[] = [
  'enableCpuAffinity',
  'enableProcessPriority',
  'enableEfficiencyMode',
  'enableIoPriority',
  'enableMemoryPriority',
  'autoRestrict',
  'autoRestrictIntervalSeconds',
];

function App() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [targetCore, setTargetCore] = useState<number | null>(null);
  const [processStatus, setProcessStatus] = useState<ProcessStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeLoading, setActiveLoading] = useState(false);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [performance, setPerformance] = useState<ProcessPerformance[]>([]);
  const [perfHistory, setPerfHistory] = useState<PerfDataPoint[]>([]);
  const [enableCpuAffinity, setEnableCpuAffinity] = useState(true);
  const [enableProcessPriority, setEnableProcessPriority] = useState(true);
  const [enableEfficiencyMode, setEnableEfficiencyMode] = useState(false);
  const [enableIoPriority, setEnableIoPriority] = useState(false);
  const [enableMemoryPriority, setEnableMemoryPriority] = useState(false);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [autoRestrict, setAutoRestrict] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [monitoringIntervalSeconds, setMonitoringIntervalSeconds] = useState(5);
  const [autoRestrictIntervalSeconds, setAutoRestrictIntervalSeconds] = useState(10);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeRestrictionStatus | null>(null);
  const lastAutoRestrictSignatureRef = useRef<string>('');
  const [registryPriorityStates, setRegistryPriorityStates] = useState<RegistryPriorityStates>({});

  const [startupPolicyStates, setStartupPolicyStates] = useState<Record<string, boolean>>({
    ace: false,
    valorant: false,
    league: false,
  });

  const gameProcesses = performance.map((process) => process.name);
  const restrictionSettingSetters = useMemo<Record<RestrictionSettingKey, (value: boolean | number) => void>>(() => ({
    enableCpuAffinity: (value) => setEnableCpuAffinity(Boolean(value)),
    enableProcessPriority: (value) => setEnableProcessPriority(Boolean(value)),
    enableEfficiencyMode: (value) => setEnableEfficiencyMode(Boolean(value)),
    enableIoPriority: (value) => setEnableIoPriority(Boolean(value)),
    enableMemoryPriority: (value) => setEnableMemoryPriority(Boolean(value)),
    autoRestrict: (value) => setAutoRestrict(Boolean(value)),
    autoRestrictIntervalSeconds: (value) => setAutoRestrictIntervalSeconds(Number(value)),
  }), []);

  const addLog = useCallback((message: string) => {
    const entry: LogEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      message,
    };

    setLogs((previousLogs) => [...previousLogs, entry]);
  }, []);

  const fetchRuntimeRestrictionStatus = useCallback(async () => {
    try {
      const status = await getRuntimeRestrictionStatus();
      setRuntimeStatus(status);
      setTargetCore(status.target_core);
      return status;
    } catch (error) {
      console.error('读取运行时限制状态失败:', error);
      return null;
    }
  }, []);

  const executeProcessRestriction = useCallback(async () => {
    try {
      addLog('进程限制开始执行');
      setActiveLoading(true);

      const result = await restrictProcesses({
        enableCpuAffinity,
        enableProcessPriority,
        enableEfficiencyMode,
        enableIoPriority,
        enableMemoryPriority,
      });

      setProcessStatus(result);
      setTargetCore(result.target_core);
      addLog(result.message);
      await fetchRuntimeRestrictionStatus();
    } catch (error) {
      addLog(`执行失败: ${error}`);
      console.error('执行进程限制失败:', error);
    } finally {
      setActiveLoading(false);
    }
  }, [
    addLog,
    enableCpuAffinity,
    enableProcessPriority,
    enableEfficiencyMode,
    enableIoPriority,
    enableMemoryPriority,
    fetchRuntimeRestrictionStatus,
  ]);

  const executeOnce = useCallback(async () => {
    const enabledModes = [
      enableCpuAffinity ? 'CPU 亲和性' : null,
      enableProcessPriority ? '进程优先级' : null,
      enableEfficiencyMode ? '效率模式' : null,
      enableIoPriority ? 'I/O 优先级' : null,
      enableMemoryPriority ? '内存优先级' : null,
    ].filter(Boolean).join('+') || '标准模式';

    setIsMonitoring(true);
    addLog(`执行进程限制 (${enabledModes})`);

    try {
      await executeProcessRestriction();
    } finally {
      setIsMonitoring(false);
    }
  }, [
    addLog,
    enableCpuAffinity,
    enableProcessPriority,
    enableEfficiencyMode,
    enableIoPriority,
    enableMemoryPriority,
    executeProcessRestriction,
  ]);

  const fetchSystemInfo = useCallback(async () => {
    try {
      const info = await getSystemInfo();

      setSystemInfo(info);
      setTargetCore(info.cpu_logical_cores - 1);
      addLog(`系统信息已加载: ${info.os_name} ${info.os_version}`);
      addLog(`CPU: ${info.cpu_model}`);
      addLog(`核心: ${info.cpu_cores} 物理 / ${info.cpu_logical_cores} 逻辑`);
      addLog(`内存: ${info.total_memory_gb.toFixed(2)} GB`);
      addLog(`WebView2 环境: ${info.webview2_env}`);

      if (!info.is_admin) {
        addLog('当前未以管理员权限运行，部分功能可能受限');
      } else {
        addLog('已获取管理员权限，可以执行 ACE 资源调度');
      }
    } catch (error) {
      addLog(`获取系统信息失败: ${error}`);
    }
  }, [addLog]);

  const fetchPerformance = useCallback(async () => {
    try {
      const currentPerformance = await getProcessPerformance();

      setPerformance(currentPerformance);

      const point = buildPerformancePoint(currentPerformance);

      setPerfHistory((previousHistory) => [...previousHistory, point]);
    } catch (error) {
      console.error('获取性能数据失败:', error);
    }
  }, []);

  const checkAutoStart = useCallback(async () => {
    try {
      const enabled = await checkAutoStartStatus();
      setAutoStartEnabled(enabled);
    } catch (error) {
      console.error('检查自启动状态失败:', error);
    }
  }, []);

  const toggleAutoStartup = useCallback(async () => {
    try {
      const nextState = !autoStartEnabled;

      const message = await setAutoStartState(nextState);
      addLog(message);
      await checkAutoStart();
    } catch (error) {
      addLog(`切换自启动失败: ${error}`);
      console.error('切换自启动失败:', error);
    }
  }, [autoStartEnabled, addLog, checkAutoStart]);

  const refreshRegistryPriorityStates = useCallback(async () => {
    try {
      const states = await getRegistryPriorityStates();
      setRegistryPriorityStates(states);
      setStartupPolicyStates({
        ace: Boolean(states['SGuard64.exe']?.configured && states['SGuardSvc64.exe']?.configured),
        valorant: Boolean(states['VALORANT-Win64-Shipping.exe']?.configured),
        league: Boolean(states['League of Legends.exe']?.configured),
      });
    } catch (error) {
      console.error('读取启动前策略状态失败:', error);
    }
  }, []);

  const runLoggedCommand = useCallback(async ({
    command,
    startMessage,
    successMessage,
    errorMessage,
  }: LoggedCommandDefinition) => {
    try {
      setRegistryLoading(true);
      addLog(startMessage);

      const outputLines = await executeTextCommand({
        command,
        startMessage,
        successMessage,
        errorMessage,
      });

      addLog(successMessage);
      outputLines.forEach((line) => addLog(line));
      return true;
    } catch (error) {
      addLog(`${errorMessage}: ${error}`);
      console.error(errorMessage, error);
      return false;
    } finally {
      setRegistryLoading(false);
    }
  }, [addLog]);

  const toggleStartupPolicy = useCallback(async (policyId: string, enabled: boolean) => {
    const policy = startupPolicyDefinitions.find((item) => item.id === policyId);
    if (!policy) {
      addLog(`未知启动前策略: ${policyId}`);
      return;
    }

    const command = enabled ? policy.enableCommand : policy.disableCommand;
    const succeeded = await runLoggedCommand(command);
    if (succeeded) {
      await refreshRegistryPriorityStates();
    }
  }, [addLog, refreshRegistryPriorityStates, runLoggedCommand]);

  const checkRegistryPriority = useCallback(async () => {
    await runLoggedCommand(checkRegistryPriorityCommand);
    await refreshRegistryPriorityStates();
  }, [refreshRegistryPriorityStates, runLoggedCommand]);

  const resetRegistryPriority = useCallback(async () => {
    const succeeded = await runLoggedCommand(resetRegistryPriorityCommand);
    if (succeeded) {
      await refreshRegistryPriorityStates();
    }
  }, [refreshRegistryPriorityStates, runLoggedCommand]);

  const exportLogs = useCallback(async () => {
    if (logs.length === 0) {
      addLog('没有操作日志可导出');
      return;
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19);
    const filePath = await save({
      title: '保存操作日志',
      defaultPath: `ACE-Lite_操作日志_${timestamp}.txt`,
      filters: [
        {
          name: '文本文件',
          extensions: ['txt'],
        },
      ],
    });

    if (!filePath) {
      addLog('已取消导出操作日志');
      return;
    }

    const content = logs
      .map((log) => `[${log.timestamp}] ${log.message}`)
      .join('\n');

    try {
      await writeTextFile(filePath, content);
      addLog(`操作日志已保存: ${filePath}`);
    } catch (error) {
      addLog(`导出操作日志失败: ${error}`);
    }
  }, [addLog, logs]);

  const generateReport = useCallback(async () => {
    if (perfHistory.length === 0) {
      addLog('没有性能数据可导出');
      return;
    }

    setExportingReport(true);
    addLog('正在生成性能报告...');

    try {
      const savedPath = await savePerformanceReport({
        data: perfHistory,
        systemInfo,
      });

      addLog(`报告已保存: ${savedPath}`);
    } catch (error) {
      addLog(`生成报告失败: ${error}`);
    } finally {
      setExportingReport(false);
    }
  }, [addLog, perfHistory, systemInfo]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    addLog('ACE-Lite 已启动，开始监控 ACE');
    void fetchSystemInfo();
    void checkAutoStart();
    void fetchRuntimeRestrictionStatus();
    void refreshRegistryPriorityStates();
  }, [addLog, checkAutoStart, fetchRuntimeRestrictionStatus, fetchSystemInfo, refreshRegistryPriorityStates]);

  useEffect(() => {
    const monitoringSettings = storage.getMonitoringSettings();

    setMonitoringEnabled(monitoringSettings.enabled);
    setMonitoringIntervalSeconds(monitoringSettings.intervalSeconds);
  }, []);

  useEffect(() => {
    storage.saveMonitoringSettings({
      enabled: monitoringEnabled,
      intervalSeconds: monitoringIntervalSeconds,
    });
  }, [monitoringEnabled, monitoringIntervalSeconds]);

  useEffect(() => {
    if (!monitoringEnabled) {
      return;
    }

    void fetchPerformance();

    const perfInterval = setInterval(() => {
      void fetchPerformance();
    }, monitoringIntervalSeconds * 1000);

    return () => {
      clearInterval(perfInterval);
    };
  }, [fetchPerformance, monitoringEnabled, monitoringIntervalSeconds]);

  useEffect(() => {
    const cachedChoices = storage.getChoices();

    if (!cachedChoices.rememberChoices) {
      return;
    }

    restrictionSettingKeys.forEach((key) => {
      const value = cachedChoices[key];

      if (value !== undefined) {
        restrictionSettingSetters[key](value);
      }
    });
  }, []);

  useEffect(() => {
    storage.saveChoices({
      enableCpuAffinity,
      enableProcessPriority,
      enableEfficiencyMode,
      enableIoPriority,
      enableMemoryPriority,
      autoRestrict,
      autoRestrictIntervalSeconds,
      rememberChoices: true,
    });
  }, [
    enableCpuAffinity,
    enableProcessPriority,
    enableEfficiencyMode,
    enableIoPriority,
    enableMemoryPriority,
    autoRestrict,
    autoRestrictIntervalSeconds,
  ]);

  useEffect(() => {
    void fetchRuntimeRestrictionStatus();
  }, [fetchRuntimeRestrictionStatus, performance]);

  useEffect(() => {
    if (!autoRestrict || !systemInfo?.is_admin) {
      return;
    }

    if (!runtimeStatus || runtimeStatus.processes.length === 0) {
      lastAutoRestrictSignatureRef.current = '';
      return;
    }

    const targetAffinityMask = `0x${(1 << runtimeStatus.target_core).toString(16).toUpperCase()}`;
    const needsApply = runtimeStatus.processes.some((process) => {
      const priorityMismatch = enableProcessPriority && process.priority_class !== null && process.priority_class !== '低';
      const affinityMismatch = enableCpuAffinity && process.affinity_mask !== null && process.affinity_mask.toUpperCase() !== targetAffinityMask;
      const efficiencyMismatch = enableEfficiencyMode && process.efficiency_mode !== null && !process.efficiency_mode;
      const ioMismatch = enableIoPriority && process.io_priority !== null && process.io_priority !== 0;
      const memoryMismatch = enableMemoryPriority && process.memory_priority !== null && process.memory_priority !== 1;

      return priorityMismatch || affinityMismatch || efficiencyMismatch || ioMismatch || memoryMismatch;
    });
    const signature = runtimeStatus.processes
      .map((process) => `${process.name}:${process.pid}:${process.priority_class}:${process.affinity_mask}:${process.io_priority}:${process.memory_priority}:${process.efficiency_mode}`)
      .sort()
      .join('|');

    if (!needsApply || signature === lastAutoRestrictSignatureRef.current) {
      return;
    }

    lastAutoRestrictSignatureRef.current = signature;
    addLog('检测到 ACE 新进程或已勾选限制项明确未生效，自动执行运行时限制...');
    void executeProcessRestriction();
  }, [
    addLog,
    autoRestrict,
    enableCpuAffinity,
    enableEfficiencyMode,
    enableIoPriority,
    enableMemoryPriority,
    enableProcessPriority,
    executeProcessRestriction,
    runtimeStatus,
    systemInfo,
  ]);

  const handleSettingChange = useCallback((key: Exclude<RestrictionSettingKey, 'autoRestrictIntervalSeconds'>, checked: boolean) => {
    restrictionSettingSetters[key](checked);
  }, [restrictionSettingSetters]);

  const handleAutoRestrictIntervalChange = useCallback((intervalSeconds: number) => {
    setAutoRestrictIntervalSeconds(intervalSeconds);
    addLog(`自动应用间隔已调整为 ${intervalSeconds} 秒`);
  }, [addLog]);

  const handleMonitoringEnabledChange = useCallback((enabled: boolean) => {
    setMonitoringEnabled(enabled);
    addLog(enabled ? '运行观察刷新已开启' : '运行观察刷新已暂停');
  }, [addLog]);

  const handleMonitoringIntervalChange = useCallback((intervalSeconds: number) => {
    setMonitoringIntervalSeconds(intervalSeconds);
    addLog(`运行观察刷新间隔已调整为 ${intervalSeconds} 秒`);
  }, [addLog]);

  const toggleDarkMode = () => {
    setDarkMode((currentValue) => !currentValue);
  };

  const isAdmin = Boolean(systemInfo?.is_admin);
  const displayedHistory = perfHistory.slice(-maxVisibleHistoryPoints);
  const restrictionSettings: RestrictionSettings = {
    enableCpuAffinity,
    enableProcessPriority,
    enableEfficiencyMode,
    enableIoPriority,
    enableMemoryPriority,
    autoRestrict,
    autoRestrictIntervalSeconds,
  };
  const startupPolicies = startupPolicyDefinitions.map((policy) => ({
    id: policy.id,
    label: policy.label,
    description: policy.description,
    enabled: Boolean(startupPolicyStates[policy.id]),
    stateText: policy.id === 'ace'
      ? `ACE: ${registryPriorityStates['SGuard64.exe']?.configured ? '已写入' : '未写入'} / ${registryPriorityStates['SGuardSvc64.exe']?.configured ? '已写入' : '未写入'}`
      : policy.id === 'valorant'
        ? `Page:${registryPriorityStates['VALORANT-Win64-Shipping.exe']?.page_priority ?? '未设置'}`
        : `Page:${registryPriorityStates['League of Legends.exe']?.page_priority ?? '未设置'}`,
    onToggle: (enabled: boolean) => {
      void toggleStartupPolicy(policy.id, enabled);
    },
  }));
  const currentTheme = darkMode ? darkTheme : lightTheme;

  const aceDetected = hasAceProcess(performance);

  document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <WindowTitleBar darkMode={darkMode} />
      <Container
        maxWidth="xl"
        sx={{
          py: 1,
          height: 'calc(100vh - 34px)',
          overflowY: 'auto',
          bgcolor: 'background.default',
          background: darkMode
            ? 'radial-gradient(circle at 12% 0%, rgba(14, 165, 233, 0.18), transparent 34%), linear-gradient(180deg, #0b1120 0%, #0f172a 100%)'
            : 'radial-gradient(circle at 12% 0%, rgba(37, 99, 235, 0.14), transparent 34%), linear-gradient(180deg, #eaf1fb 0%, #f8fbff 100%)',
        }}
      >
        <AppHeader
          darkMode={darkMode}
          isAdmin={isAdmin}
          aceDetected={aceDetected}
          onToggleTheme={toggleDarkMode}
        />

        <Stack spacing={1}>
          <SystemInfoCard systemInfo={systemInfo} />

          <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '1.15fr 0.85fr' }} gap={1}>
            <ActiveActionsCard
              settings={restrictionSettings}
              autoStartEnabled={autoStartEnabled}
              loading={activeLoading}
              isMonitoring={isMonitoring}
              onSettingChange={handleSettingChange}
              onToggleAutoStartup={toggleAutoStartup}
              onAutoRestrictIntervalChange={handleAutoRestrictIntervalChange}
              onExecute={executeOnce}
            />
            <PassiveActionsCard
              loading={registryLoading}
              isAdmin={isAdmin}
              policies={startupPolicies}
              onCheckRegistry={checkRegistryPriority}
              onResetRegistry={resetRegistryPriority}
            />
          </Box>

          <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: 'minmax(0, 1.45fr) minmax(320px, 0.55fr)' }} gap={1} alignItems="stretch">
            <PerformancePanel
              history={displayedHistory}
              exportingReport={exportingReport}
              monitoringEnabled={monitoringEnabled}
              monitoringIntervalSeconds={monitoringIntervalSeconds}
              onMonitoringEnabledChange={handleMonitoringEnabledChange}
              onMonitoringIntervalChange={handleMonitoringIntervalChange}
              onExportReport={generateReport}
            />
            <RestrictionStatusCard
              targetCore={targetCore}
              gameProcesses={gameProcesses}
              processStatus={processStatus}
              loading={activeLoading}
              runtimeStatus={runtimeStatus}
            />
          </Box>

          <Box sx={{ height: 220 }}>
            <LogPanel logs={logs} containerRef={logContainerRef} onExportLogs={exportLogs} />
          </Box>
        </Stack>
      </Container>
    </ThemeProvider>
  );
}

export default App;