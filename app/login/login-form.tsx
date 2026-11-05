'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { loginUserAction, type LoginActionResult } from '@/app/actions/auth';

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginActionResult | null, FormData>(
    loginUserAction,
    null
  );
  const [showPassword, setShowPassword] = useState(false);

  if (state?.success && state.user) {
    return (
      <div id="login-success-card" className="flex flex-col items-center gap-6 py-3 text-center">
        <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>Welcome Back!</Typography>
        <Typography variant="body2" color="text.secondary">
          Signed in as <strong>{state.user.name || state.user.username || state.user.email}</strong>.
          You can now access your quizzes and track your learning progress.
        </Typography>
        <Button component={Link} href="/" variant="contained" size="large">
          Explore Quizzes
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} id="login-form" className="flex flex-col gap-5">
      {state && !state.success && state.message ? <Alert severity="error">{state.message}</Alert> : null}
      <TextField
        id="login-username"
        name="username"
        label="Username"
        placeholder="johndoe"
        autoComplete="username"
        required
        fullWidth
        disabled={isPending}
        error={Boolean(state?.errors?.username)}
        helperText={state?.errors?.username?.[0]}
      />
      <TextField
        id="login-password"
        name="password"
        label="Password"
        placeholder="Enter your password"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        required
        fullWidth
        disabled={isPending}
        error={Boolean(state?.errors?.password)}
        helperText={state?.errors?.password?.[0]}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <Button type="submit" variant="contained" size="large" disabled={isPending}>
        {isPending ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
