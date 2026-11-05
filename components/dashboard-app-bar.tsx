'use client';

import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

interface DashboardAppBarProps {
  displayName: string;
  email: string;
  availableQuizzes: number;
}

const drawerWidth = 280;
const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Quizzes', href: '/quizzes' },
];

export function DashboardAppBar({ displayName, email, availableQuizzes }: DashboardAppBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <AppBar
        component="header"
        position="static"
        elevation={1}
        sx={{
          borderRadius: 2,
          backgroundColor: 'var(--md-surface-container-lowest)',
          color: 'var(--md-on-surface)',
        }}
      >
        <Toolbar sx={{ minHeight: 88, gap: { xs: 1, sm: 2 }, px: { xs: 2, sm: 3 } }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="Open navigation menu"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <div className="min-w-0 flex-1">
            <Typography component="h1" sx={{ fontWeight: 700, lineHeight: 1.2 }} variant="overline" color="primary">QuizRand</Typography>
          </div>
          <div className="hidden w-full max-w-sm items-center rounded-xl bg-[var(--md-surface-container-high)] px-3 sm:flex">
            <SearchIcon sx={{ color: 'var(--md-on-surface-variant)' }} />
            <InputBase
              placeholder="Search..."
              inputProps={{ 'aria-label': 'Search' }}
              sx={{
                ml: 1,
                flex: 1,
                color: 'var(--md-on-surface)',
                '& input::placeholder': {
                  color: 'var(--md-on-surface-variant)',
                  opacity: 1,
                },
              }}
            />
          </div>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            p: 2,
            backgroundColor: 'var(--md-surface-container-lowest)',
            color: 'var(--md-on-surface)',
          },
        }}
      >
        <div className="flex items-center justify-between px-1 pb-3">
          <div className="flex items-center gap-3">
            <Avatar sx={{ bgcolor: 'primary.main' }}>Q</Avatar>
            <div>
              <Typography variant="overline" color="text.secondary">QuizRand</Typography>
              <Typography component="p" variant="body2" sx={{ fontWeight: 700 }}>Learning hub</Typography>
            </div>
          </div>
          <IconButton aria-label="Close navigation menu" onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </div>
        <Divider />
        <List sx={{ py: 2 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.href}
              component="a"
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
        <div className="mt-auto border-t border-zinc-200 px-1 pt-4">
          <Typography component="p" variant="body2" sx={{ fontWeight: 700 }}>{displayName}</Typography>
          <Typography variant="caption" color="text.secondary">{email}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {availableQuizzes} available quizzes
          </Typography>
        </div>
      </Drawer>
    </>
  );
}
