import { DashboardAppBar } from '@/components/dashboard-app-bar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export default async function QuizzesPage() {
  const session = await getSession();

  if (!session) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-12 text-zinc-900">
        <Paper sx={{ maxWidth: 720, mx: 'auto', p: 5, textAlign: 'center', borderRadius: 2 }}>
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white">
            Q
          </div>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>Sign in to view quizzes</Typography>
          <Typography sx={{ mt: 2 }} color="text.secondary">
            You need to be logged in to see the available quizzes and continue learning.
          </Typography>
          <div className="mt-8 flex justify-center gap-3">
            <Button href="/login" variant="contained">Sign in</Button>
            <Button href="/register" variant="outlined">Create account</Button>
          </div>
        </Paper>
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
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <DashboardAppBar
          displayName={session.name || session.username || session.email.split('@')[0]}
          email={session.email}
          availableQuizzes={quizzes.length}
          title="Browse available quizzes"
          currentPath="/quizzes"
          quizzes={quizzes.map(({ id, title, category }) => ({ id, title, category }))}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, minWidth: 0, p: 2.5 }}>
                  <div className="mb-4 flex min-w-0 items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                        {quiz.category || 'General'}
                      </p>
                      <Typography component="h2" variant="h6" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                        {quiz.title}
                      </Typography>
                    </div>
                    <Chip label={`${quiz._count.questions} qs`} color="primary" size="small" sx={{ flexShrink: 0 }} />
                  </div>
                  <Typography variant="body2" color="text.secondary">
                    {quiz.description || 'This quiz is ready for you to take and track your progress.'}
                  </Typography>
                  <div className="mt-2 flex justify-between gap-3">
                    <Typography variant="caption" color="text.secondary">
                      {quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : 'No time limit'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Intl.DateTimeFormat('en', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }).format(new Date(quiz.createdAt))}
                    </Typography>
                  </div>
                </CardContent>
                <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                  <Button href={`/quiz/${quiz.id}`} variant="contained">
                    {completedQuizIds.has(quiz.id) ? 'Retake quiz' : 'Start quiz'}
                  </Button>

                  {completedQuizIds.has(quiz.id) ? (
                    <Button href={`/quiz/${quiz.id}/review`} variant="outlined">Review</Button>
                  ) : null}
                </CardActions>
              </Card>
            ))}
        </section>
      </div>
    </main>
  );
}
