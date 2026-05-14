import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  HelpOutline as HelpOutlineIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';

interface AppHeaderProps {
  darkMode: boolean;
  isAdmin: boolean;
  aceDetected: boolean;
  onToggleTheme: () => void;
}

export function AppHeader({
  darkMode,
  isAdmin,
  aceDetected,
  onToggleTheme,
}: AppHeaderProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mb: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(144,202,249,0.14), rgba(129,199,132,0.05))',
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
          <Avatar
            src="/logo.png"
            sx={{ width: 42, height: 42, borderRadius: 2 }}
            variant="rounded"
          />
          <Box minWidth={0}>
            <Box display="flex" alignItems="center" gap={0.6}>
              <Typography variant="h5" component="h1" color="primary" sx={{ lineHeight: 1.1, fontWeight: 700 }}>
                ACE-Lite
              </Typography>
              <IconButton
                aria-label="软件使用说明"
                size="small"
                onClick={() => setHelpOpen(true)}
                sx={{
                  width: 24,
                  height: 24,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'transparent',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <HelpOutlineIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" noWrap>
              本地资源调度控制台
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap justifyContent="flex-end">
          <Chip
            label={isAdmin ? '管理员权限' : '普通权限'}
            color={isAdmin ? 'success' : 'warning'}
            variant="outlined"
            size="small"
          />
          <Chip
            label={aceDetected ? 'ACE 已检测' : '等待 ACE'}
            color={aceDetected ? 'success' : 'default'}
            variant="outlined"
            size="small"
          />
          <Button
            variant="outlined"
            startIcon={darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            onClick={onToggleTheme}
            sx={{ minWidth: 'auto', px: 1 }}
            size="small"
          >
            {darkMode ? '浅色' : '暗色'}
          </Button>
        </Stack>
      </Box>

      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>ACE-Lite 使用说明</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.2}>
            <Typography variant="body2" color="text.secondary">
              ACE-Lite 是本地 Windows 资源调度工具，只通过公开系统 API 和注册表优先级配置工作，不读写游戏内存、不注入、不修改游戏文件。
            </Typography>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>管理员权限</Typography>
              <Typography variant="body2" color="text.secondary">
                写入 HKLM 注册表、限制受保护进程时需要以管理员身份运行；普通权限只能查看界面和部分状态。
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>启动前策略</Typography>
              <Typography variant="body2" color="text.secondary">
                “启动前策略”会写入 IFEO PerfOptions：游戏 exe 默认提高优先级，ACE 进程默认降低优先级，成功后由 Windows 在后续创建对应 exe 时自动应用。
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>运行时限制</Typography>
              <Typography variant="body2" color="text.secondary">
                “立即应用到 ACE”和“检测到 ACE 后自动应用”只作用于当前运行中的 ACE 进程，可设置核心绑定、调度级别、效率模式、I/O 和内存优先级；进程重启后需要重新执行。
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </Paper>
  );
}
