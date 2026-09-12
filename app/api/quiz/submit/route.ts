import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { completeQuizAttempt } from '@/lib/progress';
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

    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: session.id,
        quizId,
        status: 'IN_PROGRESS',
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, message: 'No active quiz attempt found.' },
        { status: 404 }
      );
    }

    const answerMap = body?.answerMap && typeof body.answerMap === 'object' ? body.answerMap : {};
    const timerMinutes = Number(body?.timerMinutes ?? 0);
    const timeLeft = typeof body?.timeLeft === 'number' ? body.timeLeft : timerMinutes > 0 ? timerMinutes * 60 : 0;

    const totalQuestions = await prisma.question.count({ where: { quizId } });

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

    const updatedAttempt = await completeQuizAttempt({
      attemptId: attempt.id,
      timeSpentSeconds: normalizeTimeSpentSeconds(timerMinutes, timeLeft),
    });

    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'COMPLETED',
        currentQuestionIndex: totalQuestions,
        totalQuestions,
        correctAnswersCount: updatedAttempt.attempt.correctAnswersCount,
        score: updatedAttempt.attempt.score,
        timeSpentSeconds: normalizeTimeSpentSeconds(timerMinutes, timeLeft),
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      totalQuestions,
      correctAnswersCount: updatedAttempt.attempt.correctAnswersCount,
      score: updatedAttempt.attempt.score,
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
