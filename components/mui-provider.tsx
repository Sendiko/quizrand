'use client';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';

const theme = createTheme({
  palette: {
    background: {
      default: '#fdf7ff',
      paper: '#ffffff',
    },
    text: {
      primary: '#1c1b20',
      secondary: '#48454e',
    },
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
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--md-surface-container-lowest)',
          color: 'var(--md-on-surface)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--md-surface-container-lowest)',
          color: 'var(--md-on-surface)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          '&.MuiButton-containedPrimary': {
            backgroundColor: 'var(--md-primary)',
            color: 'var(--md-on-primary)',
            '&:hover': {
              backgroundColor: 'var(--md-primary)',
              filter: 'brightness(1.08)',
            },
          },
          '&.MuiButton-outlinedPrimary': {
            borderColor: 'var(--md-outline)',
            color: 'var(--md-primary)',
            '&:hover': {
              borderColor: 'var(--md-primary)',
              backgroundColor: 'var(--md-primary-container)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: 'var(--md-primary)',
          color: 'var(--md-on-primary)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--md-surface-container-lowest)',
          '& input': {
            color: 'var(--md-on-surface)',
          },
          '& input::placeholder': {
            color: 'var(--md-on-surface-variant)',
            opacity: 0.9,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--md-outline)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--md-on-surface-variant)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--md-primary)',
            borderWidth: 2,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'var(--md-on-surface-variant)',
          '&.Mui-focused': {
            color: 'var(--md-primary)',
          },
        },
      },
    },
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
