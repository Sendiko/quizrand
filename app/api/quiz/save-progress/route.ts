import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startQuizAttempt } from '@/lib/progress';
import { getSession } from '@/lib/session';

function normalizeTimeSpentSeconds(timerMinutes: number | undefined, timeLeft: number | undefined) {
  if (!timerMinutes || timerMinutes <= 0) {
    return 0;
  }

  const totalSeconds = timerMinutes * 60;
  const remainingSeconds = typeof timeLeft === 'number' ? Math.max(0, timeLeft) : totalSeconds;

  return Math.max(0, totalSeconds - remainingSeconds);
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const quizId = body?.quizId;

    if (!quizId) {
      return NextResponse.json(
        { success: false, message: 'Quiz ID is required.' },
        { status: 400 }
      );
    }

    let attempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: session.id,
        quizId,
        status: 'IN_PROGRESS',
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!attempt) {
      const created = await startQuizAttempt({ userId: session.id, quizId });
      attempt = await prisma.quizAttempt.findUnique({ where: { id: created.id } });
    }

    if (!attempt) {
      return NextResponse.json(
        { success: false, message: 'Unable to create quiz attempt.' },
        { status: 500 }
      );
    }

    const answerMap = body?.answerMap && typeof body.answerMap === 'object' ? body.answerMap : {};
    const timerMinutes = Number(body?.timerMinutes ?? 0);
    const timeLeft = typeof body?.timeLeft === 'number' ? body.timeLeft : timerMinutes > 0 ? timerMinutes * 60 : 0;

    if (Object.keys(answerMap).length > 0) {
      for (const [questionId, selectedOptionId] of Object.entries(answerMap)) {
        if (!selectedOptionId || typeof selectedOptionId !== 'string') {
          continue;
        }

        const option = await prisma.option.findFirst({
          where: {
            id: selectedOptionId,
            questionId,
          },
        });

        if (!option) {
          continue;
        }

        await prisma.quizAttemptAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attempt.id,
              questionId,
            },
          },
          create: {
            attemptId: attempt.id,
            questionId,
            selectedOptionId,
            isCorrect: option.isCorrect,
          },
          update: {
            selectedOptionId,
            isCorrect: option.isCorrect,
          },
        });
      }
    }

    const totalQuestions = await prisma.question.count({ where: { quizId } });
    const currentAnswers = await prisma.quizAttemptAnswer.findMany({ where: { attemptId: attempt.id } });
    const correctAnswersCount = currentAnswers.filter((answer) => answer.isCorrect).length;

    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        currentQuestionIndex: typeof body?.currentIndex === 'number' ? body.currentIndex : 0,
        totalQuestions,
        correctAnswersCount,
        score: correctAnswersCount,
        timeSpentSeconds: normalizeTimeSpentSeconds(timerMinutes, timeLeft),
      },
    });

    return NextResponse.json({
      success: true,
      answered: currentAnswers.length,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Save progress error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
