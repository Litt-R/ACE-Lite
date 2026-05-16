import { Box, Button, FormControl, MenuItem, Paper, Select, Switch, Typography } from '@mui/material';
import { SaveAlt as SaveIcon } from '@mui/icons-material';
import { MetricChart } from './MetricChart';
import type { MetricLine } from './MetricChart';
import type { PerfDataPoint } from '../types/app';

interface PerformancePanelProps {
  history: PerfDataPoint[];
  exportingReport: boolean;
  monitoringEnabled: boolean;
  monitoringIntervalSeconds: number;
  onMonitoringEnabledChange: (enabled: boolean) => void;
  onMonitoringIntervalChange: (intervalSeconds: number) => void;
  onExportReport: () => void;
}

interface ChartSection {
  title: string;
  unit: string;
  tooltipFormatter: (value: unknown) => string;
  lines: readonly MetricLine[];
  showLegend?: boolean;
  yDomain?: [number | 'auto', number | 'auto'];
}

const monitoringIntervals = [3, 5, 10, 30, 60];

const chartSections: ChartSection[] = [
  {
    title: 'CPU',
    unit: '%',
    tooltipFormatter: (value: unknown) => `${value}%（100%≈一个逻辑核心）`,
    lines: [
      { dataKey: 'sguard_cpu', name: 'SGuard64', stroke: '#66d9ef' },
      { dataKey: 'sguardsvc_cpu', name: 'SGuardSvc64', stroke: '#a6e22e' },
    ],
    showLegend: true,
    yDomain: [0, 100],
  },
  {
    title: '内存',
    unit: 'MB',
    tooltipFormatter: (value: unknown) => `${value} MB`,
    lines: [
      { dataKey: 'sguard_mem', name: 'SGuard64', stroke: '#66d9ef' },
      { dataKey: 'sguardsvc_mem', name: 'SGuardSvc64', stroke: '#a6e22e' },
    ],
  },
  {
    title: '磁盘 I/O',
    unit: 'KB/s',
    tooltipFormatter: (value: unknown) => `${value} KB/s`,
    lines: [
      { dataKey: 'sguard_io', name: 'SGuard64', stroke: '#66d9ef' },
      { dataKey: 'sguardsvc_io', name: 'SGuardSvc64', stroke: '#a6e22e' },
    ],
  },
];

export function PerformancePanel({
  history,
  exportingReport,
  monitoringEnabled,
  monitoringIntervalSeconds,
  onMonitoringEnabledChange,
  onMonitoringIntervalChange,
  onExportReport,
}: PerformancePanelProps) {
  return (
    <Paper elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} sx={{ mb: 1 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            观察
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {monitoringEnabled ? `每 ${monitoringIntervalSeconds} 秒刷新一次 ACE 进程占用` : '刷新已暂停，减少额外资源占用'}
          </Typography>
        </Box>
        <Box display="flex" gap={0.8} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
          <Box display="flex" alignItems="center" gap={0.4}>
            <Typography variant="caption" color="text.secondary">自动刷新</Typography>
            <Switch
              checked={monitoringEnabled}
              onChange={(event) => onMonitoringEnabledChange(event.target.checked)}
              color="info"
              size="small"
            />
          </Box>
          <FormControl size="small" disabled={!monitoringEnabled} sx={{ minWidth: 92 }}>
            <Select
              value={monitoringIntervalSeconds}
              onChange={(event) => onMonitoringIntervalChange(Number(event.target.value))}
              sx={{ borderRadius: 2, fontSize: '0.8rem' }}
            >
              {monitoringIntervals.map((interval) => (
                <MenuItem key={interval} value={interval}>
                  {interval} 秒
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SaveIcon />}
            onClick={onExportReport}
            disabled={exportingReport || history.length === 0}
            sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
          >
            {exportingReport ? '生成中...' : '导出报告'}
          </Button>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, opacity: monitoringEnabled ? 1 : 0.72 }}>
        {chartSections.map((section) => (
          <MetricChart
            key={section.title}
            title={section.title}
            data={history}
            unit={section.unit}
            tooltipFormatter={section.tooltipFormatter}
            lines={section.lines}
            showLegend={section.showLegend}
            yDomain={section.yDomain}
          />
        ))}
      </Box>
    </Paper>
  );
}
