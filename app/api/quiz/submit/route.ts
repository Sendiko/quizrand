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

    for (const [questionId, selectedOptionValue] of Object.entries(answerMap)) {
      const selectedOptionIds = Array.isArray(selectedOptionValue)
        ? selectedOptionValue.filter((optionId): optionId is string => typeof optionId === 'string')
        : typeof selectedOptionValue === 'string'
          ? [selectedOptionValue]
          : [];

      await prisma.quizAttemptAnswer.deleteMany({
        where: { attemptId: attempt.id, questionId },
      });

      if (selectedOptionIds.length === 0) {
        continue;
      }

      const options = await prisma.option.findMany({
        where: { id: { in: selectedOptionIds }, questionId },
      });
      const correctOptionCount = await prisma.option.count({
        where: { questionId, isCorrect: true },
      });
      const isCorrect =
        options.length === selectedOptionIds.length &&
        options.length === correctOptionCount &&
        options.every((option) => option.isCorrect);

      await prisma.quizAttemptAnswer.createMany({
        data: options.map((option) => ({
          attemptId: attempt.id,
          questionId,
          selectedOptionId: option.id,
          isCorrect,
        })),
      });
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
