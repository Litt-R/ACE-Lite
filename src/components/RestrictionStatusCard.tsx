import { Box, Chip, Divider, LinearProgress, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import type { ProcessStatus, RuntimeRestrictionStatus } from '../types/app';

interface RestrictionStatusCardProps {
  targetCore: number | null;
  gameProcesses: string[];
  processStatus: ProcessStatus | null;
  loading: boolean;
  runtimeStatus: RuntimeRestrictionStatus | null;
}

function getRuntimeStatusColor(statusLabel: string): ChipProps['color'] {
  if (statusLabel === '已生效') return 'success';
  if (statusLabel === '核心项已生效') return 'info';
  if (statusLabel === '部分已生效') return 'warning';
  if (statusLabel === '无法确认') return 'default';
  return 'warning';
}

function getProcessStatusColor(found: boolean, restricted: boolean): ChipProps['color'] {
  if (!found) {
    return 'default';
  }

  return restricted ? 'warning' : 'success';
}

function getProcessStatusText(found: boolean, restricted: boolean) {
  if (!found) {
    return '未检测';
  }

  return restricted ? '已处理' : '运行中';
}

function formatOptionalValue(value: string | number | boolean | null) {
  if (value === null) {
    return '未知';
  }

  if (typeof value === 'boolean') {
    return value ? '已启用' : '未启用';
  }

  return String(value);
}

export function RestrictionStatusCard({
  targetCore,
  gameProcesses,
  processStatus,
  loading,
  runtimeStatus,
}: RestrictionStatusCardProps) {
  return (
    <Paper elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
      <Stack spacing={1} height="100%">
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            ACE 状态
          </Typography>
          <Typography variant="caption" color="text.secondary">
            当前检测到的 ACE 进程和限制结果
          </Typography>
        </Box>

        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={0.8}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary">限制核心</Typography>
            <Typography variant="body2" fontWeight={700}>
              {targetCore !== null ? `核心 ${targetCore}` : '检测中'}
            </Typography>
          </Box>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary">ACE 进程</Typography>
            <Typography variant="body2" fontWeight={700} noWrap title={gameProcesses.join(', ')}>
              {gameProcesses.length > 0 ? `${gameProcesses.length} 个` : '暂无'}
            </Typography>
          </Box>
        </Box>

        <Divider />

        <List dense sx={{ py: 0 }}>
          <ListItem
            secondaryAction={
              <Chip
                label={getProcessStatusText(processStatus?.sguard64_found || false, processStatus?.sguard64_restricted || false)}
                color={getProcessStatusColor(processStatus?.sguard64_found || false, processStatus?.sguard64_restricted || false)}
                size="small"
              />
            }
            sx={{ px: 0, py: 0.2 }}
          >
            <ListItemText primary="SGuard64" primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
          </ListItem>
          <ListItem
            secondaryAction={
              <Chip
                label={getProcessStatusText(processStatus?.sguardsvc64_found || false, processStatus?.sguardsvc64_restricted || false)}
                color={getProcessStatusColor(processStatus?.sguardsvc64_found || false, processStatus?.sguardsvc64_restricted || false)}
                size="small"
              />
            }
            sx={{ px: 0, py: 0.2 }}
          >
            <ListItemText primary="SGuardSvc64" primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
          </ListItem>
        </List>

        <Divider />

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            运行时状态反查
          </Typography>
          <Stack spacing={0.6}>
            {runtimeStatus && runtimeStatus.processes.length > 0 ? runtimeStatus.processes.map((process) => (
              <Box key={process.pid} sx={{ p: 0.8, borderRadius: 2, bgcolor: 'action.hover' }}>
                <Box display="flex" justifyContent="space-between" gap={1}>
                  <Typography variant="caption" fontWeight={700} noWrap title={`${process.name} (${process.pid})`}>
                    {process.name} · PID {process.pid}
                  </Typography>
                  <Chip
                    label={process.status_label}
                    color={getRuntimeStatusColor(process.status_label)}
                    size="small"
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                  优先级 {formatOptionalValue(process.priority_class)} · 亲和性 {formatOptionalValue(process.affinity_mask)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  I/O {formatOptionalValue(process.io_priority)} · 内存页 {formatOptionalValue(process.memory_priority)} · 效率 {formatOptionalValue(process.efficiency_mode)}
                </Typography>
                {process.optional_restrictions_unknown && (
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                    I/O / 内存页 / 效率存在无法反查项；受保护进程可能拒绝该类运行时控制
                  </Typography>
                )}
                {process.error && (
                  <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                    {process.error}
                  </Typography>
                )}
              </Box>
            )) : (
              <Typography variant="caption" color="text.secondary">
                暂未检测到 ACE 运行时状态
              </Typography>
            )}
          </Stack>
        </Box>

        {loading && <LinearProgress sx={{ mt: 'auto' }} />}
      </Stack>
    </Paper>
  );
}
