import { Box, Paper, Typography } from '@mui/material';
import type { SystemInfo } from '../types/app';

interface SystemInfoCardProps {
  systemInfo: SystemInfo | null;
}

function InfoItem({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'action.hover', minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} noWrap title={title ?? value}>
        {value}
      </Typography>
    </Box>
  );
}

export function SystemInfoCard({ systemInfo }: SystemInfoCardProps) {
  return (
    <Paper elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} sx={{ mb: 1 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            本机环境
          </Typography>
          <Typography variant="caption" color="text.secondary">
            用于判断权限、核心数量和运行环境
          </Typography>
        </Box>
      </Box>

      {systemInfo ? (
        <Box display="grid" gridTemplateColumns="2fr 1fr 1fr 1fr" gap={0.8}>
          <InfoItem label="CPU" value={systemInfo.cpu_model} />
          <InfoItem label="CPU 核心" value={`${systemInfo.cpu_cores} 物理 / ${systemInfo.cpu_logical_cores} 逻辑`} />
          <InfoItem label="内存" value={`${systemInfo.total_memory_gb.toFixed(1)} GB`} />
          <InfoItem label="权限" value={systemInfo.is_admin ? '管理员' : '普通用户'} />
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          加载中...
        </Typography>
      )}
    </Paper>
  );
}
