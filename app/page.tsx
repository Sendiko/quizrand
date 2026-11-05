import Link from 'next/link';
import { AppSidebar } from '@/components/app-sidebar';
import AppBar from '@mui/material/AppBar';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { getUserDashboard } from '@/lib/progress';
import { getSession } from '@/lib/session';

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return 'Not started yet';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function formatStatus(status: string) {
  if (status === 'COMPLETED') {
    return 'Completed';
  }

  if (status === 'IN_PROGRESS') {
    return 'In progress';
  }

  return 'Started';
}

export default async function Home() {
  const session = await getSession();

  if (!session) {
    return (
      <main className="min-h-screen overflow-hidden bg-zinc-50 px-4 py-6 text-zinc-900 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white">
                Q
              </span>
              <span className="text-xl font-bold tracking-tight">
                Quiz<span className="text-indigo-600">Rand</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/login" className="md3-button md3-button-outlined">
                Sign in
              </Link>
              <Link href="/register" className="md3-button hidden sm:inline-flex">
                Get started
              </Link>
            </div>
          </nav>

          <section className="grid items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <div>
              <p className="mb-5 inline-flex rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
                A calmer way to learn
              </p>
              <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Turn every question into progress.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">
                Practice with focused quizzes, understand your results, and build a learning habit
                that lasts.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="md3-button h-12">
                  Create your account
                </Link>
                <Link href="/login" className="md3-button md3-button-outlined h-12">
                  I already have an account
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600">
                <span>✓ Progress tracking</span>
                <span>✓ Instant review</span>
                <span>✓ Flexible practice</span>
              </div>
            </div>

            <div className="md3-card relative overflow-hidden bg-indigo-100 p-6 sm:p-8">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-200/80" />
              <div className="relative">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-indigo-700">Today&apos;s focus</p>
                    <h2 className="mt-1 text-2xl font-bold text-indigo-950">Keep your streak going</h2>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-xl text-white">
                    ★
                  </span>
                </div>
                <div className="rounded-2xl bg-white/80 p-4">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Weekly progress</span>
                    <span className="text-indigo-700">72%</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-indigo-100">
                    <div className="h-full w-[72%] rounded-full bg-indigo-600" />
                  </div>
                  <p className="mt-4 text-sm text-zinc-600">Small sessions add up. Take one quiz today.</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/70 p-4">
                    <p className="text-xs text-zinc-600">Quizzes completed</p>
                    <p className="mt-1 text-2xl font-bold">24</p>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-4">
                    <p className="text-xs text-zinc-600">Current streak</p>
                    <p className="mt-1 text-2xl font-bold">7 days</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 border-t border-zinc-200 py-10 md:grid-cols-3">
            {[
              ['Practice with purpose', 'Choose focused quizzes and spend your time where it matters.'],
              ['Learn from every result', 'Review correct answers, explanations, and the choices you made.'],
              ['See your momentum', 'Track attempts and completion so progress stays visible.'],
            ].map(([title, description]) => (
              <article key={title} className="rounded-2xl bg-white/60 p-5">
                <h2 className="font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
              </article>
            ))}
          </section>
        </div>
      </main>
    );
  }

  const dashboard = await getUserDashboard(session.id);
  const latestAttempt = dashboard.recentAttempts[0];
  const displayName = session.name || session.username || session.email.split('@')[0];

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
        <AppSidebar currentPath="/" displayName={displayName} email={session.email} />

        <div className="flex-1">
          <AppBar
            component="header"
            position="static"
            elevation={1}
            sx={{
              mb: 4,
              borderRadius: 2,
              backgroundColor: 'var(--md-surface-container-lowest)',
              color: 'var(--md-on-surface)',
            }}
          >
            <Toolbar
              sx={{
                minHeight: 112,
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                p: 3,
              }}
            >
              <div>
                <Typography variant="overline" color="primary">Dashboard</Typography>
                <Typography component="h1" variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
                  Welcome back, {displayName}
                </Typography>
              </div>
              <Chip color="primary" label={`${dashboard.stats.availableQuizzes} available quizzes`} />
            </Toolbar>
          </AppBar>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card sx={{ p: 2.5, borderRadius: 2 }}>
              <p className="text-sm text-zinc-500">Available quizzes</p>
              <p className="mt-3 text-3xl font-bold">{dashboard.stats.availableQuizzes}</p>
            </Card>

            <Card sx={{ p: 2.5, borderRadius: 2 }}>
              <p className="text-sm text-zinc-500">Quizzes attempted</p>
              <p className="mt-3 text-3xl font-bold">{dashboard.stats.quizzesAttempted}</p>
            </Card>

            <Card sx={{ p: 2.5, borderRadius: 2 }}>
              <p className="text-sm text-zinc-500">Completed quizzes</p>
              <p className="mt-3 text-3xl font-bold">{dashboard.stats.quizzesCompleted}</p>
            </Card>

            <Card sx={{ p: 2.5, borderRadius: 2 }}>
              <p className="text-sm text-zinc-500">Completion rate</p>
              <p className="mt-3 text-3xl font-bold">{dashboard.stats.completionRate}%</p>
            </Card>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="md3-card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Last progress
                  </p>
                  <h2 className="mt-2 text-xl font-bold">
                    {latestAttempt ? latestAttempt.quiz.title : 'No quiz activity yet'}
                  </h2>
                </div>

                {latestAttempt ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {latestAttempt.status === 'COMPLETED' ? 'Completed' : 'Active'}
                  </span>
                ) : null}
              </div>

              {latestAttempt ? (
                <div className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-zinc-50 p-4">
                      <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Status</p>
                      <p className="mt-2 text-lg font-semibold">{formatStatus(latestAttempt.status)}</p>
                    </div>
                    <div className="rounded-2xl bg-zinc-50 p-4">
                      <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Score</p>
                      <p className="mt-2 text-lg font-semibold">
                        {latestAttempt.correctAnswersCount}/{latestAttempt.totalQuestions}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-zinc-50 p-4">
                      <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Progress</p>
                      <p className="mt-2 text-lg font-semibold">
                        {latestAttempt.totalQuestions > 0
                          ? Math.round(
                              (latestAttempt.correctAnswersCount / latestAttempt.totalQuestions) * 100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                    <p>
                      Started: <span className="font-medium text-zinc-800">{formatDate(latestAttempt.startedAt)}</span>
                    </p>
                    <p className="mt-2">
                      Updated: <span className="font-medium text-zinc-800">{formatDate(latestAttempt.completedAt || latestAttempt.startedAt)}</span>
                    </p>
                  </div>

                  {latestAttempt.status === 'COMPLETED' ? (
                    <div className="flex justify-end">
                      <Link
                        href={`/quiz/${latestAttempt.quizId}/review`}
                        className="md3-button"
                      >
                        Review results
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-zinc-500">
                  Start a quiz to begin tracking your progress here.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Recent activity
              </p>

              <div className="mt-5 space-y-3">
                {dashboard.recentAttempts.length > 0 ? (
                  dashboard.recentAttempts.map((attempt) => (
                    <div key={attempt.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-zinc-800">{attempt.quiz.title}</p>
                          <p className="mt-1 text-xs text-zinc-500">{formatStatus(attempt.status)}</p>
                        </div>
                        <p className="text-sm font-semibold text-indigo-600">
                          {attempt.correctAnswersCount}/{attempt.totalQuestions}
                        </p>
                      </div>

                      {attempt.status === 'COMPLETED' ? (
                        <div className="mt-3">
                          <Link
                            href={`/quiz/${attempt.quizId}/review`}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            Review results →
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
                    No recent quiz attempts yet.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="md3-card mt-8 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Quiz progress
                </p>
                <h2 className="mt-2 text-xl font-bold">Your progress overview</h2>
              </div>
              <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                {dashboard.stats.averagePercentageScore}% avg score
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {dashboard.quizzes.length > 0 ? (
                dashboard.quizzes.map((progress) => (
                  <div
                    key={progress.id}
                    className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-zinc-800">{progress.quiz.title}</p>
                      <p className="text-sm text-zinc-500">
                        {progress.isCompleted ? 'Completed' : 'In progress'} • {progress.attemptsCount} attempts
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Best score</p>
                        <p className="text-sm font-semibold text-zinc-800">{progress.highestScore}%</p>
                      </div>
                      <div className="h-2.5 w-28 overflow-hidden rounded-full bg-zinc-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                          style={{ width: `${Math.min(progress.highestScore, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-zinc-500">
                  You have not started any quizzes yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
