import { Box, Button, Chip, Divider, MenuItem, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import { Tune as TuneIcon } from '@mui/icons-material';
import { priorityLevels } from '../services/processControl';

export interface PolicyLibraryItem {
  id: string;
  label: string;
  description: string;
  summary: string;
  enabled: boolean;
  builtIn: boolean;
  onToggle: (enabled: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export interface CustomPriorityFormState {
  name: string;
  exeName: string;
  cpuPriority: number;
  ioPriority: number;
  pagePriority: number;
}

interface PassiveActionsCardProps {
  loading: boolean;
  isAdmin: boolean;
  policies: PolicyLibraryItem[];
  customPolicy: CustomPriorityFormState;
  configPath: string;
  editingCustomPolicyId: string | null;
  onCustomPolicyChange: (field: keyof CustomPriorityFormState, value: string | number) => void;
  onSaveCustomPolicy: () => void;
  onCancelCustomPolicyEdit: () => void;
  onCheckRegistry: () => void;
  onResetRegistry: () => void;
}

function CustomPrioritySelect({
  label,
  value,
  field,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  field: keyof CustomPriorityFormState;
  disabled: boolean;
  onChange: (field: keyof CustomPriorityFormState, value: string | number) => void;
}) {
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(field, Number(event.target.value))}
      sx={{ minWidth: 96 }}
    >
      {priorityLevels.map((level) => (
        <MenuItem key={level.value} value={level.value}>
          {level.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

export function PassiveActionsCard({
  loading,
  isAdmin,
  policies,
  customPolicy,
  configPath,
  editingCustomPolicyId,
  onCustomPolicyChange,
  onSaveCustomPolicy,
  onCancelCustomPolicyEdit,
  onCheckRegistry,
  onResetRegistry,
}: PassiveActionsCardProps) {
  const customActionsDisabled = loading || customPolicy.exeName.trim().length === 0;
  const enabledCount = policies.filter((policy) => policy.enabled).length;
  const customCount = policies.filter((policy) => !policy.builtIn).length;

  return (
    <Paper elevation={0} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
      <Stack spacing={1} height="100%">
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
          <Box minWidth={0}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              启动策略库
            </Typography>
            <Typography variant="caption" color="text.secondary">
              已配置 {policies.length} 项 · 已启用 {enabledCount} 项 · 自定义 {customCount} 项
            </Typography>
          </Box>
          <Chip
            size="small"
            label={isAdmin ? '可写入' : '需管理员'}
            color={isAdmin ? 'success' : 'warning'}
            variant={isAdmin ? 'filled' : 'outlined'}
            sx={{ height: 22 }}
          />
        </Box>

        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }} gap={0.7}>
          {policies.map((policy) => (
            <Box
              key={policy.id}
              sx={{
                p: 0.85,
                border: '1px solid',
                borderColor: policy.enabled ? 'primary.main' : 'divider',
                borderRadius: 2,
                bgcolor: policy.enabled ? 'action.selected' : 'action.hover',
                transition: 'border-color 160ms ease, background-color 160ms ease',
                minWidth: 0,
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" gap={0.6}>
                <Box minWidth={0}>
                  <Box display="flex" alignItems="center" gap={0.45} flexWrap="wrap">
                    <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.15 }} noWrap>
                      {policy.label}
                    </Typography>
                    <Chip
                      size="small"
                      label={policy.builtIn ? '内置' : '自定义'}
                      variant="outlined"
                      sx={{ height: 18, fontSize: '0.62rem' }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.15 }} noWrap>
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
              <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap" sx={{ mt: 0.55 }}>
                <Chip
                  size="small"
                  label={policy.enabled ? '已启用' : '未启用'}
                  color={policy.enabled ? 'success' : 'default'}
                  variant={policy.enabled ? 'filled' : 'outlined'}
                  sx={{ height: 20, fontSize: '0.66rem' }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem' }}>
                  {policy.summary}
                </Typography>
              </Box>
              {!policy.builtIn && (
                <Box display="flex" gap={0.5} sx={{ mt: 0.65 }}>
                  <Button size="small" variant="text" onClick={policy.onEdit} disabled={loading} sx={{ minWidth: 0, px: 0.7 }}>
                    编辑
                  </Button>
                  <Button size="small" variant="text" color="inherit" onClick={policy.onDelete} disabled={loading} sx={{ minWidth: 0, px: 0.7 }}>
                    删除
                  </Button>
                </Box>
              )}
            </Box>
          ))}
        </Box>

        <Divider />

        <Box sx={{ p: 0.9, borderRadius: 2, bgcolor: 'action.hover' }}>
          <Box display="flex" alignItems="center" gap={0.7} sx={{ mb: 0.8 }}>
            <TuneIcon sx={{ fontSize: 17, color: 'primary.main' }} />
            <Typography variant="body2" fontWeight={700}>
              {editingCustomPolicyId ? '编辑自定义策略' : '添加自定义策略'}
            </Typography>
          </Box>

          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'minmax(120px, 0.9fr) minmax(180px, 1.25fr) repeat(3, minmax(82px, 0.75fr))' }} gap={0.7}>
            <TextField
              size="small"
              label="名称"
              placeholder="例如：播放器"
              value={customPolicy.name}
              disabled={loading}
              autoComplete="off"
              inputProps={{ autoComplete: 'off' }}
              onChange={(event) => onCustomPolicyChange('name', event.target.value)}
            />
            <TextField
              size="small"
              label="程序名"
              placeholder="example.exe"
              value={customPolicy.exeName}
              disabled={loading}
              autoComplete="off"
              inputProps={{ autoComplete: 'off' }}
              onChange={(event) => onCustomPolicyChange('exeName', event.target.value)}
            />
            <CustomPrioritySelect label="CPU" field="cpuPriority" value={customPolicy.cpuPriority} disabled={loading} onChange={onCustomPolicyChange} />
            <CustomPrioritySelect label="I/O" field="ioPriority" value={customPolicy.ioPriority} disabled={loading} onChange={onCustomPolicyChange} />
            <CustomPrioritySelect label="内存" field="pagePriority" value={customPolicy.pagePriority} disabled={loading} onChange={onCustomPolicyChange} />
          </Box>

          <Box display="flex" gap={0.7} sx={{ mt: 0.8 }}>
            <Button
              variant="contained"
              onClick={onSaveCustomPolicy}
              disabled={customActionsDisabled}
              size="small"
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              {editingCustomPolicyId ? '保存修改' : '保存到策略库'}
            </Button>
            {editingCustomPolicyId && (
              <Button
                variant="outlined"
                onClick={onCancelCustomPolicyEdit}
                disabled={loading}
                size="small"
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                取消
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ px: 0.2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all' }}>
            配置文件：{configPath || '程序目录 / ace-lite-policies.json'}
          </Typography>
        </Box>

        <Box display="flex" gap={0.7} mt="auto">
          <Button
            variant="outlined"
            onClick={onCheckRegistry}
            disabled={loading}
            color="info"
            size="small"
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            查看已配置
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
            清空全部策略
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
