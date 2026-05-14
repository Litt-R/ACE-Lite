import { Box, Button, Chip, Divider, Paper, Stack, Switch, Typography } from '@mui/material';

interface PassivePolicyItem {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  stateText?: string;
}

interface PassiveActionsCardProps {
  loading: boolean;
  isAdmin: boolean;
  policies: PassivePolicyItem[];
  onCheckRegistry: () => void;
  onResetRegistry: () => void;
}

export function PassiveActionsCard({
  loading,
  isAdmin,
  policies,
  onCheckRegistry,
  onResetRegistry,
}: PassiveActionsCardProps) {
  return (
    <Paper elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
      <Stack spacing={1.2} height="100%">
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            启动前策略
          </Typography>
          <Typography variant="caption" color="text.secondary">
            开关会写入或清除 IFEO 优先级规则，下次启动对应进程时自动生效
          </Typography>
        </Box>

        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={0.8}>
          {policies.map((policy) => (
            <Box
              key={policy.id}
              sx={{
                p: 1,
                border: '1px solid',
                borderColor: policy.enabled ? 'primary.main' : 'divider',
                borderRadius: 2,
                bgcolor: policy.enabled ? 'action.selected' : 'action.hover',
                transition: 'border-color 160ms ease, background-color 160ms ease',
                minWidth: 0,
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" gap={0.8}>
                <Box minWidth={0}>
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                    {policy.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    {policy.description}
                  </Typography>
                </Box>
                <Switch
                  size="small"
                  checked={policy.enabled}
                  onChange={(event) => policy.onToggle(event.target.checked)}
                  disabled={loading || !isAdmin}
                />
              </Box>
              <Box display="flex" alignItems="center" gap={0.6} flexWrap="wrap" sx={{ mt: 0.8 }}>
                <Chip
                  size="small"
                  label={policy.enabled ? '已开启' : '未开启'}
                  color={policy.enabled ? 'success' : 'default'}
                  variant={policy.enabled ? 'filled' : 'outlined'}
                  sx={{ height: 22, fontSize: '0.68rem' }}
                />
                {policy.stateText && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem' }}>
                    {policy.stateText}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>

        <Divider />

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.6 }}>
            策略维护
          </Typography>
          <Box display="flex" gap={0.8}>
            <Button
              variant="outlined"
              onClick={onCheckRegistry}
              disabled={loading}
              color="info"
              size="small"
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              查看已写入策略
            </Button>
            <Button
              variant="outlined"
              onClick={onResetRegistry}
              disabled={loading || !isAdmin}
              color="inherit"
              size="small"
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              全部清除
            </Button>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}
