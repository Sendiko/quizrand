'use client';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';

const theme = createTheme({
  palette: {
    primary: {
      main: '#63568F',
      light: '#E8DEFF',
      dark: '#4B3E76',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#615B71',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), sans-serif',
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCheckbox: {
      styleOverrides: {
        root: {
          flexShrink: 0,
          color: 'var(--md-outline)',
          padding: 8,
          '&.Mui-checked': {
            color: 'var(--md-primary)',
          },
        },
      },
    },
  },
});

export function MuiProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
