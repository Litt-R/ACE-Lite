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
  AdminPanelSettings as AdminIcon,
  DarkMode as DarkModeIcon,
  HelpOutline as HelpOutlineIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';

interface AppHeaderProps {
  darkMode: boolean;
  isAdmin: boolean;
  aceDetected: boolean;
  onToggleTheme: () => void;
  onRequestElevation: () => void;
}

export function AppHeader({
  darkMode,
  isAdmin,
  aceDetected,
  onToggleTheme,
  onRequestElevation,
}: AppHeaderProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        mb: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(144,202,249,0.13), rgba(129,199,132,0.05))',
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
        <Box display="flex" alignItems="center" gap={1.25} minWidth={0}>
          <Avatar
            src="/logo.png"
            sx={{ width: 38, height: 38, borderRadius: 2 }}
            variant="rounded"
          />
          <Box minWidth={0}>
            <Box display="flex" alignItems="center" gap={0.55}>
              <Typography variant="h5" component="h1" color="primary" sx={{ lineHeight: 1.05, fontWeight: 800 }}>
                ACE-Lite
              </Typography>
              <IconButton
                aria-label="使用说明"
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
              小型本地资源调度工具
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={0.7} alignItems="center" flexWrap="wrap" useFlexGap justifyContent="flex-end">
          <Chip
            label={isAdmin ? '管理员' : '普通权限'}
            color={isAdmin ? 'success' : 'warning'}
            variant="outlined"
            size="small"
          />
          <Chip
            label={aceDetected ? 'ACE 运行中' : '未检测到 ACE'}
            color={aceDetected ? 'success' : 'default'}
            variant="outlined"
            size="small"
          />
          {!isAdmin && (
            <Button
              variant="contained"
              startIcon={<AdminIcon />}
              onClick={onRequestElevation}
              sx={{ minWidth: 'auto', px: 1 }}
              size="small"
            >
              提权
            </Button>
          )}
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
        <DialogTitle sx={{ pb: 1 }}>使用说明</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.1}>
            <Typography variant="body2" color="text.secondary">
              ACE-Lite 只调用 Windows 系统能力，不读写游戏内存、不注入、不修改游戏文件。
            </Typography>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>权限</Typography>
              <Typography variant="body2" color="text.secondary">
                写入启动策略、限制受保护进程需要管理员权限。点击“提权”会重新打开一个管理员窗口。
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>应用策略</Typography>
              <Typography variant="body2" color="text.secondary">
                策略写入 IFEO PerfOptions，后续启动对应 exe 时由 Windows 自动应用。内置支持 ACE、无畏契约和英雄联盟，也可手动填写 exe 名称。
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>ACE 限制</Typography>
              <Typography variant="body2" color="text.secondary">
                立即应用只作用于当前运行中的 ACE 进程；进程重启后需要重新执行，或开启自动应用。
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </Paper>
  );
}
