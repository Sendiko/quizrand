import Link from 'next/link';
import { AppSidebar } from '@/components/app-sidebar';
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
      <main className="min-h-screen bg-zinc-50 px-4 py-12 text-zinc-900">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/20">
            Q
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Dashboard
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to QuizRand</h1>
          <p className="mt-4 max-w-xl text-center text-base text-zinc-600">
            Sign in to view your dashboard, track quiz completion, and see your latest progress.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 px-6 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200"
            >
              Create account
            </Link>
          </div>
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
          <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Welcome back, {displayName}
              </h1>
            </div>

            <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              <span className="font-semibold">{dashboard.stats.availableQuizzes}</span> available quizzes
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-zinc-500">Available quizzes</p>
              <p className="mt-3 text-3xl font-bold">{dashboard.stats.availableQuizzes}</p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-zinc-500">Quizzes attempted</p>
              <p className="mt-3 text-3xl font-bold">{dashboard.stats.quizzesAttempted}</p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-zinc-500">Completed quizzes</p>
              <p className="mt-3 text-3xl font-bold">{dashboard.stats.quizzesCompleted}</p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-zinc-500">Completion rate</p>
              <p className="mt-3 text-3xl font-bold">{dashboard.stats.completionRate}%</p>
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
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
                        className="inline-flex h-11 items-center justify-center rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500"
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

          <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
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
