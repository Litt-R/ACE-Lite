import { PlayArrow as StartIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import type { SwitchProps } from '@mui/material/Switch';
import type {
  RestrictionSettings,
} from '../types/app';

type RestrictionSwitchKey = Exclude<keyof RestrictionSettings, 'autoRestrictIntervalSeconds'>;

interface SettingItem {
  key: RestrictionSwitchKey;
  label: string;
  description: string;
  color: SwitchProps['color'];
}

interface ActiveActionsCardProps {
  settings: RestrictionSettings;
  autoStartEnabled: boolean;
  loading: boolean;
  isMonitoring: boolean;
  onSettingChange: (key: RestrictionSwitchKey, checked: boolean) => void;
  onToggleAutoStartup: () => void;
  onAutoRestrictIntervalChange: (intervalSeconds: number) => void;
  onExecute: () => void;
}

const autoRestrictIntervals = [5, 10, 30, 60];

const primaryItems: SettingItem[] = [
  { key: 'enableCpuAffinity', label: '绑定低占用核心', description: '把 ACE 进程限制到指定逻辑核心', color: 'success' },
  { key: 'enableProcessPriority', label: '降低调度级别', description: '把 ACE 进程降到任务管理器六档中的“低”', color: 'success' },
];

const advancedItems: SettingItem[] = [
  { key: 'enableEfficiencyMode', label: '启用效率模式', description: '降低后台执行速度', color: 'warning' },
  { key: 'enableIoPriority', label: '降低磁盘优先级', description: '减少磁盘读写抢占', color: 'error' },
  { key: 'enableMemoryPriority', label: '降低内存页优先级', description: '降低内存驻留权重', color: 'error' },
];

function SettingSwitch({
  item,
  checked,
  disabled,
  onSettingChange,
}: {
  item: SettingItem;
  checked: boolean;
  disabled: boolean;
  onSettingChange: (key: RestrictionSwitchKey, checked: boolean) => void;
}) {
  return (
    <Box
      sx={{
        p: 0.9,
        border: '1px solid',
        borderColor: checked ? 'primary.main' : 'divider',
        borderRadius: 2,
        bgcolor: checked ? 'action.selected' : 'transparent',
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={checked}
            onChange={(event) => onSettingChange(item.key, event.target.checked)}
            disabled={disabled}
            color={item.color}
            size="small"
          />
        }
        label={<Typography variant="body2" fontWeight={600}>{item.label}</Typography>}
        sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
        labelPlacement="start"
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
        {item.description}
      </Typography>
    </Box>
  );
}

export function ActiveActionsCard({
  settings,
  autoStartEnabled,
  loading,
  isMonitoring,
  onSettingChange,
  onToggleAutoStartup,
  onAutoRestrictIntervalChange,
  onExecute,
}: ActiveActionsCardProps) {
  return (
    <Paper elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
      <Stack spacing={1.2} height="100%">
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            运行时限制
          </Typography>
          <Typography variant="caption" color="text.secondary">
            对已运行的 ACE 进程即时应用资源限制
          </Typography>
        </Box>

        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={0.8}>
          {primaryItems.map((item) => (
            <SettingSwitch
              key={item.key}
              item={item}
              checked={settings[item.key]}
              disabled={false}
              onSettingChange={onSettingChange}
            />
          ))}
        </Box>

        <Box>
          <Box display="flex" alignItems="baseline" justifyContent="space-between" gap={1} sx={{ mb: 0.6 }}>
            <Typography variant="caption" color="text.secondary">
              可选限制项
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.66rem' }}>
              三项受保护进程可能拒绝或无法确认
            </Typography>
          </Box>
          <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={0.8}>
            {advancedItems.map((item) => (
              <SettingSwitch
                key={item.key}
                item={item}
                checked={settings[item.key]}
                disabled={false}
                onSettingChange={onSettingChange}
              />
            ))}
          </Box>
        </Box>

        <Divider />

        <Box display="flex" gap={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={0.7} flexWrap="wrap">
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoRestrict}
                  onChange={(event) => onSettingChange('autoRestrict', event.target.checked)}
                  disabled={false}
                  color="info"
                  size="small"
                />
              }
              label={<Typography variant="caption">自动应用</Typography>}
              sx={{ m: 0 }}
            />
            <FormControl size="small" disabled={!settings.autoRestrict} sx={{ minWidth: 82 }}>
              <Select
                value={settings.autoRestrictIntervalSeconds}
                onChange={(event) => onAutoRestrictIntervalChange(Number(event.target.value))}
                sx={{ height: 28, fontSize: '0.72rem', borderRadius: 2 }}
              >
                {autoRestrictIntervals.map((interval) => (
                  <MenuItem key={interval} value={interval}>
                    {interval} 秒
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={autoStartEnabled}
                onChange={() => onToggleAutoStartup()}
                color="primary"
                size="small"
              />
            }
            label={<Typography variant="caption">开机自启并请求权限</Typography>}
            sx={{ m: 0 }}
          />
        </Box>

        <Button
          variant="contained"
          startIcon={<StartIcon />}
          onClick={onExecute}
          disabled={loading || isMonitoring}
          color="primary"
          size="large"
          fullWidth
          sx={{ mt: 'auto', borderRadius: 2 }}
        >
          立即应用到 ACE
        </Button>
      </Stack>
    </Paper>
  );
}
