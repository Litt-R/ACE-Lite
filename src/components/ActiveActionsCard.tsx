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
  isAdmin: boolean;
  onSettingChange: (key: RestrictionSwitchKey, checked: boolean) => void;
  onToggleAutoStartup: () => void;
  onAutoRestrictIntervalChange: (intervalSeconds: number) => void;
  onExecute: () => void;
}

const autoRestrictIntervals = [5, 10, 30, 60];

const primaryItems: SettingItem[] = [
  { key: 'enableCpuAffinity', label: '绑定核心', description: '限制到低占用逻辑核心', color: 'success' },
  { key: 'enableProcessPriority', label: '降低优先级', description: '把 ACE 调到低优先级', color: 'success' },
];

const advancedItems: SettingItem[] = [
  { key: 'enableEfficiencyMode', label: '效率模式', description: '降低后台执行速度', color: 'warning' },
  { key: 'enableIoPriority', label: '低 I/O', description: '减少磁盘抢占', color: 'error' },
  { key: 'enableMemoryPriority', label: '低内存', description: '降低驻留权重', color: 'error' },
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
        p: 0.8,
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
        label={<Typography variant="body2" fontWeight={700}>{item.label}</Typography>}
        sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
        labelPlacement="start"
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.1 }}>
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
  isAdmin,
  onSettingChange,
  onToggleAutoStartup,
  onAutoRestrictIntervalChange,
  onExecute,
}: ActiveActionsCardProps) {
  return (
    <Paper elevation={0} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
      <Stack spacing={1} height="100%">
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              ACE 限制
            </Typography>
            <Typography variant="caption" color="text.secondary">
              对当前运行中的 ACE 立即生效
            </Typography>
          </Box>
          <Typography variant="caption" color={isAdmin ? 'success.main' : 'warning.main'} fontWeight={700}>
            {isAdmin ? '权限正常' : '需管理员'}
          </Typography>
        </Box>

        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={0.7}>
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

        <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={0.7}>
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

        <Divider />

        <Box display="flex" gap={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={0.7} flexWrap="wrap">
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoRestrict}
                  onChange={(event) => onSettingChange('autoRestrict', event.target.checked)}
                  disabled={!isAdmin}
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
            label={<Typography variant="caption">开机启动并请求权限</Typography>}
            sx={{ m: 0 }}
          />
        </Box>

        <Button
          variant="contained"
          startIcon={<StartIcon />}
          onClick={onExecute}
          disabled={loading || isMonitoring || !isAdmin}
          color="primary"
          size="large"
          fullWidth
          sx={{ mt: 'auto', borderRadius: 2 }}
        >
          立即应用
        </Button>
      </Stack>
    </Paper>
  );
}
