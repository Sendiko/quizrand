import Link from 'next/link';
import { AppSidebar } from '@/components/app-sidebar';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export default async function QuizzesPage() {
  const session = await getSession();

  if (!session) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-12 text-zinc-900">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/20">
            Q
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Sign in to view quizzes</h1>
          <p className="mt-4 max-w-xl text-center text-base text-zinc-600">
            You need to be logged in to see the available quizzes and continue learning.
          </p>
          <div className="mt-8 flex gap-3">
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

  const quizzes = await prisma.quiz.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      timeLimitMinutes: true,
      createdAt: true,
      _count: { select: { questions: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const completedQuizIds = new Set(
    (
      await prisma.quizAttempt.findMany({
        where: {
          userId: session.id,
          status: 'COMPLETED',
        },
        select: {
          quizId: true,
        },
      })
    ).map((attempt) => attempt.quizId)
  );

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
        <AppSidebar currentPath="/quizzes" displayName={session.name || session.username || session.email.split('@')[0]} email={session.email} />

        <div className="flex-1">
          <header className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Quizzes
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Browse available quizzes</h1>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quizzes.map((quiz) => (
              <article key={quiz.id} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                      {quiz.category || 'General'}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-zinc-900">{quiz.title}</h2>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    {quiz._count.questions} qs
                  </span>
                </div>

                <p className="line-clamp-3 text-sm text-zinc-600">
                  {quiz.description || 'This quiz is ready for you to take and track your progress.'}
                </p>

                <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                  <span>{quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : 'No time limit'}</span>
                  <span>
                    {new Intl.DateTimeFormat('en', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }).format(new Date(quiz.createdAt))}
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <Link
                    href={`/quiz/${quiz.id}`}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500"
                  >
                    {completedQuizIds.has(quiz.id) ? 'Retake quiz' : 'Start quiz'}
                  </Link>

                  {completedQuizIds.has(quiz.id) ? (
                    <Link
                      href={`/quiz/${quiz.id}/review`}
                      className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                    >
                      Review
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
