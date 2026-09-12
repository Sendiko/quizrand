import { notFound, redirect } from 'next/navigation';
import { QuizPlayer } from '@/components/quiz-player';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  const activeAttempt = await prisma.quizAttempt.findFirst({
    where: {
      userId: session.id,
      quizId: id,
      status: 'IN_PROGRESS',
    },
    orderBy: { startedAt: 'desc' },
    include: {
      answers: true,
    },
  });

  return <QuizPlayer quiz={quiz} activeAttempt={activeAttempt} />;
}
