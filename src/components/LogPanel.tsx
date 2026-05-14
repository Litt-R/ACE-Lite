import type { RefObject } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import type { LogEntry } from '../types/app';

interface LogPanelProps {
  logs: LogEntry[];
  containerRef: RefObject<HTMLDivElement | null>;
  onExportLogs: () => void;
}

export function LogPanel({ logs, containerRef, onExportLogs }: LogPanelProps) {
  return (
    <Paper elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%', minHeight: 0 }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1} sx={{ mb: 1 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.2 }}>
            运行日志
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            记录本次运行中的检测、策略写入和限制结果
          </Typography>
        </Box>
        <Button size="small" variant="outlined" onClick={onExportLogs} disabled={logs.length === 0}>
          导出日志
        </Button>
      </Box>
      <Box
        sx={{
          height: 'calc(100% - 52px)',
          minHeight: 120,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          backgroundColor: 'background.default',
          boxShadow: 'inset 0 0 0 1px rgba(148, 163, 184, 0.04)',
        }}
      >
        <Box
          ref={containerRef}
          className="log-scroll-area"
          sx={{
            height: '100%',
            overflowY: 'auto',
            px: 0.9,
            py: 0.8,
          }}
        >
          {logs.map((log) => (
            <Typography
              key={log.id}
              variant="body2"
              sx={{
                fontFamily: 'Consolas, monospace',
                fontSize: '0.72rem',
                py: 0.18,
                lineHeight: 1.45,
                color: 'text.secondary',
              }}
            >
              <Box component="span" sx={{ color: 'primary.main' }}>[{log.timestamp}]</Box> {log.message}
            </Typography>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
