import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',

    primary: {
      main: '#2563eb',
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },

    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },

    background: {
      default: '#f5f7fb',
      paper: '#ffffff',
    },

    text: {
      primary: '#111827',
      secondary: '#6b7280',
    },

    success: {
      main: '#22c55e',
    },

    warning: {
      main: '#f59e0b',
    },

    error: {
      main: '#ef4444',
    },

    divider: 'rgba(15, 23, 42, 0.06)',
  },

  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),

    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.03em',
      color: '#111827',
    },

    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#111827',
    },

    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#111827',
    },

    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#111827',
    },

    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#111827',
    },

    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#111827',
      letterSpacing: '-0.01em',
    },

    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.7,
      color: '#374151',
    },

    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#6b7280',
    },

    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0',
    },
  },

  shape: {
    borderRadius: 18,
  },

  shadows: [
    'none',
    '0px 1px 2px rgba(15, 23, 42, 0.04)',
    '0px 2px 6px rgba(15, 23, 42, 0.06)',
    '0px 4px 12px rgba(15, 23, 42, 0.08)',
    '0px 8px 20px rgba(15, 23, 42, 0.08)',
    ...Array(20).fill('0px 10px 30px rgba(15, 23, 42, 0.08)'),
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f5f7fb',
          color: '#111827',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.6)',
          background: '#ffffff',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
          transition: 'all 0.25s ease',

          '&:hover': {
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)',
          },
        },
      },
    },

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
          borderRadius: 14,
          paddingLeft: 16,
          paddingRight: 16,
          boxShadow: 'none',
          fontWeight: 600,

          '&:hover': {
            boxShadow: 'none',
          },
        },

        containedPrimary: {
          background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          marginBottom: 4,
          transition: 'all 0.2s ease',
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: '#ffffff',

          '& fieldset': {
            borderColor: 'rgba(15, 23, 42, 0.08)',
          },

          '&:hover fieldset': {
            borderColor: 'rgba(37, 99, 235, 0.3)',
          },

          '&.Mui-focused fieldset': {
            borderColor: '#2563eb',
            borderWidth: '1px',
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(15, 23, 42, 0.06)',
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 10,
          backgroundColor: '#111827',
          fontSize: '0.75rem',
        },
      },
    },
  },
});

export default theme;