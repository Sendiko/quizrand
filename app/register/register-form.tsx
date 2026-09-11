'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { registerUserAction, type RegisterActionResult } from '@/app/actions/auth';

function calculatePasswordStrength(pass: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!pass) return { score: 0, label: 'Too short', color: 'bg-zinc-200 dark:bg-zinc-800' };

  let score = 0;
  if (pass.length >= 8) score += 1;
  if (pass.length >= 12) score += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
  if (/\d/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
  if (score <= 3) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 4) return { score: 3, label: 'Good', color: 'bg-blue-500' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
}

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState<RegisterActionResult | null, FormData>(
    registerUserAction,
    null
  );

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const strength = calculatePasswordStrength(password);

  if (state?.success && state.user) {
    return (
      <div
        id="register-success-card"
        className="text-center py-8 px-4 flex flex-col items-center space-y-6"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10 animate-bounce">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Account Created!
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm">
            Welcome aboard, <span className="font-semibold text-zinc-900 dark:text-zinc-100">{state.user.name}</span>. Your account (<span className="text-zinc-700 dark:text-zinc-300 font-mono text-xs">{state.user.email}</span>) has been registered successfully.
          </p>
        </div>

        <div className="pt-2 w-full flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            id="btn-go-home"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-semibold text-sm bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 dark:focus:ring-zinc-50"
          >
            Go to Quizzes
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            id="btn-register-another"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 transition-all"
          >
            Register Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} id="register-form" className="space-y-5">
      {/* Global alert error if any */}
      {state && !state.success && state.message && (
        <div
          id="register-error-banner"
          className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-sm"
        >
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>{state.message}</div>
        </div>
      )}

      {/* Username Field */}
      <div className="space-y-1.5">
        <label
          htmlFor="register-name"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Username
        </label>
        <div className="relative rounded-xl shadow-xs">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            id="register-name"
            name="username"
            type="text"
            required
            autoComplete="username"
            placeholder="yourname"
            disabled={isPending}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900/60 border text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 transition-colors focus:outline-none focus:ring-2 ${
              state?.errors?.username
                ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500/20'
                : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-500 dark:focus:border-zinc-400 focus:ring-zinc-400/20'
            }`}
          />
        </div>
        {state?.errors?.username && (
          <p id="error-name" className="text-xs text-rose-600 dark:text-rose-400 mt-1">
            {state.errors.username[0]}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-1.5">
        <label
          htmlFor="register-email"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email Address
        </label>
        <div className="relative rounded-xl shadow-xs">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <input
            id="register-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            disabled={isPending}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900/60 border text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 transition-colors focus:outline-none focus:ring-2 ${
              state?.errors?.email
                ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500/20'
                : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-500 dark:focus:border-zinc-400 focus:ring-zinc-400/20'
            }`}
          />
        </div>
        {state?.errors?.email && (
          <p id="error-email" className="text-xs text-rose-600 dark:text-rose-400 mt-1">
            {state.errors.email[0]}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <label
          htmlFor="register-password"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Password
        </label>
        <div className="relative rounded-xl shadow-xs">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            id="register-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            className={`w-full pl-10 pr-11 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-900/60 border text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 transition-colors focus:outline-none focus:ring-2 ${
              state?.errors?.password
                ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500/20'
                : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-500 dark:focus:border-zinc-400 focus:ring-zinc-400/20'
            }`}
          />
          <button
            type="button"
            id="toggle-password-visibility"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors focus:outline-none"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Dynamic Password Strength Indicator */}
        {password.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Password strength:</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {strength.label}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 h-1.5 w-full">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`rounded-full transition-colors duration-300 ${
                    step <= strength.score ? strength.color : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {state?.errors?.password && (
          <p id="error-password" className="text-xs text-rose-600 dark:text-rose-400 mt-1">
            {state.errors.password[0]}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        id="register-submit-btn"
        disabled={isPending}
        className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 dark:shadow-indigo-500/15 hover:shadow-indigo-500/40 transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Creating your account...
          </>
        ) : (
          <>
            Create Account
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
