import { logoutUserAction } from '@/app/actions/auth';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

interface AppSidebarProps {
  currentPath: string;
  displayName: string;
  email: string;
}

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Quizzes', href: '/quizzes' },
];

export function AppSidebar({ currentPath, displayName, email }: AppSidebarProps) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        display: { xs: 'none', lg: 'block' },
        '& .MuiDrawer-paper': {
          position: 'static',
          boxSizing: 'border-box',
          width: 280,
          border: 0,
          borderRadius: 2,
          p: 2,
          backgroundColor: 'var(--md-surface-container-lowest)',
          color: 'var(--md-on-surface)',
        },
      }}
    >
      <div className="flex min-h-full flex-col gap-4">
        <div className="flex items-center gap-3 px-1">
          <Avatar sx={{ bgcolor: 'primary.main' }}>Q</Avatar>
          <div>
            <Typography variant="overline" color="text.secondary">QuizRand</Typography>
            <Typography component="p" variant="body2" sx={{ fontWeight: 700 }}>Learning hub</Typography>
          </div>
        </div>
        <List disablePadding>
          {navItems.map((item) => {
            const active = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
            return (
              <ListItemButton
                key={item.href}
                href={item.href}
                selected={active}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
        <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4">
          <div className="px-1">
            <Typography component="p" variant="body2" sx={{ fontWeight: 700 }}>{displayName}</Typography>
            <Typography variant="caption" color="text.secondary">{email}</Typography>
          </div>
          <form action={logoutUserAction}>
            <Button type="submit" variant="outlined" fullWidth>Logout</Button>
          </form>
        </div>
      </div>
    </Drawer>
  );
}
