'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { registerUserAction, type RegisterActionResult } from '@/app/actions/auth';

function calculatePasswordStrength(password: string) {
  if (!password) return { score: 0, label: 'Too short' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return { score: 1, label: 'Weak' };
  if (score <= 3) return { score: 2, label: 'Fair' };
  if (score <= 4) return { score: 3, label: 'Good' };
  return { score: 4, label: 'Strong' };
}

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState<RegisterActionResult | null, FormData>(
    registerUserAction,
    null
  );
  const [password, setPassword] = useState('');
  const strength = calculatePasswordStrength(password);

  if (state?.success && state.user) {
    return (
      <div id="register-success-card" className="flex flex-col items-center gap-6 py-3 text-center">
        <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>Account Created!</Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome aboard, <strong>{state.user.name}</strong>. Your account has been registered successfully.
        </Typography>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button component={Link} href="/" variant="contained">Go to Quizzes</Button>
          <Button variant="outlined" onClick={() => window.location.reload()}>Register Another</Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} id="register-form" className="flex flex-col gap-5">
      {state && !state.success && state.message ? <Alert severity="error">{state.message}</Alert> : null}
      <TextField
        id="register-name"
        name="username"
        label="Username"
        placeholder="yourname"
        autoComplete="username"
        required
        fullWidth
        disabled={isPending}
        error={Boolean(state?.errors?.username)}
        helperText={state?.errors?.username?.[0]}
      />
      <TextField
        id="register-email"
        name="email"
        label="Email address"
        placeholder="you@example.com"
        type="email"
        autoComplete="email"
        required
        fullWidth
        disabled={isPending}
        error={Boolean(state?.errors?.email)}
        helperText={state?.errors?.email?.[0]}
      />
      <TextField
        id="register-password"
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        fullWidth
        disabled={isPending}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={Boolean(state?.errors?.password)}
        helperText={state?.errors?.password?.[0]}
      />
      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <Typography variant="caption" color="text.secondary">Password strength</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>{strength.label}</Typography>
        </div>
        <LinearProgress variant="determinate" value={strength.score * 25} />
      </div>
      <Button type="submit" variant="contained" size="large" disabled={isPending}>
        {isPending ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
