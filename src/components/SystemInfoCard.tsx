import { Box, Chip, Paper, Typography } from '@mui/material';
import type { SystemInfo } from '../types/app';

interface SystemInfoCardProps {
  systemInfo: SystemInfo | null;
}

function InfoItem({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.1 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} noWrap title={title ?? value}>
        {value}
      </Typography>
    </Box>
  );
}

export function SystemInfoCard({ systemInfo }: SystemInfoCardProps) {
  if (!systemInfo) {
    return (
      <Paper elevation={0} sx={{ p: 1.1, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Typography variant="body2" color="text.secondary">
          正在读取环境...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 1.1, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: 'minmax(220px, 1.7fr) 1fr 0.7fr 0.7fr' }} gap={1} alignItems="center">
        <InfoItem label="CPU" value={systemInfo.cpu_model} />
        <InfoItem label="核心" value={`${systemInfo.cpu_cores} 物理 / ${systemInfo.cpu_logical_cores} 逻辑`} />
        <InfoItem label="内存" value={`${systemInfo.total_memory_gb.toFixed(1)} GB`} />
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.1 }}>
            权限
          </Typography>
          <Chip
            size="small"
            label={systemInfo.is_admin ? '管理员' : '普通'}
            color={systemInfo.is_admin ? 'success' : 'warning'}
            variant={systemInfo.is_admin ? 'filled' : 'outlined'}
            sx={{ height: 22, mt: 0.2 }}
          />
        </Box>
      </Box>
    </Paper>
  );
}
