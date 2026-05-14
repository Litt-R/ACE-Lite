import { createTheme } from '@mui/material/styles';

const sharedShape = {
  borderRadius: 12,
};

const sharedTypography = {
  fontFamily: 'Inter, "Segoe UI", "Microsoft YaHei", Arial, sans-serif',
  h5: {
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  subtitle1: {
    fontWeight: 700,
  },
  button: {
    fontWeight: 700,
    textTransform: 'none' as const,
  },
};

const sharedComponents = {
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        boxShadow: 'none',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 700,
      },
    },
  },
};

export const lightTheme = createTheme({
  shape: sharedShape,
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7c3aed',
    },
    success: {
      main: '#16a34a',
    },
    warning: {
      main: '#d97706',
    },
    error: {
      main: '#dc2626',
    },
    background: {
      default: '#eaf1fb',
      paper: '#f8fbff',
    },
    text: {
      primary: '#0f172a',
      secondary: 'rgba(15, 23, 42, 0.68)',
    },
    divider: 'rgba(37, 99, 235, 0.16)',
    action: {
      hover: 'rgba(37, 99, 235, 0.06)',
      selected: 'rgba(37, 99, 235, 0.1)',
    },
  },
  typography: sharedTypography,
  components: sharedComponents,
});

export const darkTheme = createTheme({
  shape: sharedShape,
  palette: {
    mode: 'dark',
    primary: {
      main: '#7dd3fc',
    },
    secondary: {
      main: '#c084fc',
    },
    success: {
      main: '#86efac',
    },
    warning: {
      main: '#fbbf24',
    },
    error: {
      main: '#fb7185',
    },
    background: {
      default: '#0b1120',
      paper: '#111827',
    },
    text: {
      primary: '#f8fafc',
      secondary: 'rgba(226, 232, 240, 0.72)',
    },
    divider: 'rgba(148, 163, 184, 0.18)',
    action: {
      hover: 'rgba(148, 163, 184, 0.08)',
      selected: 'rgba(125, 211, 252, 0.12)',
    },
  },
  typography: sharedTypography,
  components: sharedComponents,
});
