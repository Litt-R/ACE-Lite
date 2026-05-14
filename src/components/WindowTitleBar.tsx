import type { MouseEvent } from 'react';
import {
  Close as CloseIcon,
  CropSquare as MaximizeIcon,
  Remove as MinimizeIcon,
} from '@mui/icons-material';
import { Avatar, Box, IconButton, Typography } from '@mui/material';
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

interface WindowTitleBarProps {
  darkMode: boolean;
}

export function WindowTitleBar({ darkMode }: WindowTitleBarProps) {
  const startDrag = (event: MouseEvent) => {
    if (event.button !== 0) {
      return;
    }

    void appWindow.startDragging();
  };

  const minimize = () => {
    void appWindow.minimize();
  };

  const toggleMaximize = () => {
    void appWindow.toggleMaximize();
  };

  const close = () => {
    void appWindow.close();
  };

  return (
    <Box
      data-tauri-drag-region
      onMouseDown={startDrag}
      sx={{
        height: 34,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: darkMode
          ? 'linear-gradient(90deg, rgba(15,23,42,0.98), rgba(17,24,39,0.96))'
          : 'linear-gradient(90deg, rgba(226,240,255,0.98), rgba(248,251,255,0.96))',
        userSelect: 'none',
      }}
    >
      <Box data-tauri-drag-region display="flex" alignItems="center" gap={0.8} minWidth={0}>
        <Avatar src="/logo.png" variant="rounded" sx={{ width: 18, height: 18, borderRadius: 0.8 }} />
        <Typography data-tauri-drag-region variant="caption" color={darkMode ? 'text.primary' : '#0f172a'} fontWeight={700} noWrap>
          ACE-Lite
        </Typography>
      </Box>

      <Box display="flex" alignItems="center" onMouseDown={(event) => event.stopPropagation()}>
        <IconButton aria-label="最小化" size="small" onMouseDown={(event) => event.stopPropagation()} onClick={minimize} sx={{ width: 34, height: 28, borderRadius: 1 }}>
          <MinimizeIcon fontSize="inherit" />
        </IconButton>
        <IconButton aria-label="最大化" size="small" onMouseDown={(event) => event.stopPropagation()} onClick={toggleMaximize} sx={{ width: 34, height: 28, borderRadius: 1 }}>
          <MaximizeIcon fontSize="inherit" />
        </IconButton>
        <IconButton
          aria-label="关闭"
          size="small"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={close}
          sx={{
            width: 34,
            height: 28,
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'error.main',
              color: 'error.contrastText',
            },
          }}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      </Box>
    </Box>
  );
}
