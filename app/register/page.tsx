import type { Metadata } from 'next';
import Link from 'next/link';
import RegisterForm from './register-form';

export const metadata: Metadata = {
  title: 'Create an Account | QuizRand',
  description: 'Join QuizRand to test your knowledge, track your quiz progress, and challenge yourself with curated questions.',
};

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-50 px-4 py-12 text-zinc-900 sm:px-6 lg:px-8">
      {/* Background ambient lighting effects */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-purple-500/0 rounded-full blur-3xl dark:from-blue-600/10 dark:via-indigo-600/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-tl from-indigo-500/20 via-violet-500/15 to-pink-500/0 rounded-full blur-3xl dark:from-indigo-600/10 dark:via-violet-600/10"
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
            Create your account
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sign up to track your scores, practice quizzes, and compete.
          </p>
        </div>

        {/* Card container */}
        <div className="md3-card p-6 sm:p-8">
          <RegisterForm />
        </div>

        {/* Footer links */}
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Already have an account?{' '}
          <Link
            href="/login"
            id="link-go-to-login"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
