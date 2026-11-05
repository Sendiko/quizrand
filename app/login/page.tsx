import type { Metadata } from 'next';
import Link from 'next/link';
import LoginForm from './login-form';

export const metadata: Metadata = {
  title: 'Sign In | QuizRand',
  description: 'Sign in to QuizRand to resume your quizzes, check your scores, and track your learning progress.',
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-50 px-4 py-12 text-zinc-900 sm:px-6 lg:px-8">
      {/* Background ambient lighting effects */}
      <div
        className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-500/20 via-blue-500/15 to-violet-500/0 rounded-full blur-3xl dark:from-indigo-600/10 dark:via-blue-600/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tl from-purple-500/20 via-indigo-500/15 to-blue-500/0 rounded-full blur-3xl dark:from-purple-600/10 dark:via-indigo-600/10"
        aria-hidden="true"
      />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 group transition-transform hover:scale-105"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
              Q
            </div>
            <span className="text-2xl font-black tracking-tight text-zinc-900">
                Quiz<span className="text-indigo-600">Rand</span>
            </span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 pt-2">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to continue your quiz progress and view your statistics.
          </p>
        </div>

        {/* Card container */}
        <div className="md3-card p-6 sm:p-8">
          <LoginForm />
        </div>

        {/* Footer link to register */}
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            id="link-go-to-register"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
