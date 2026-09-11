import { prisma } from './db';

export interface StartAttemptInput {
  userId?: string;
  quizId: string;
}

export interface RecordAnswerInput {
  attemptId: string;
  questionId: string;
  selectedOptionId: string;
  timeSpentSeconds?: number;
}

export interface CompleteAttemptInput {
  attemptId: string;
  timeSpentSeconds?: number;
}

/**
 * Starts a new quiz attempt for a user (or guest) and initializes progress.
 */
export async function startQuizAttempt({ userId, quizId }: StartAttemptInput) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      _count: { select: { questions: true } },
    },
  });

  if (!quiz) {
    throw new Error(`Quiz with ID "${quizId}" not found.`);
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId,
      userId: userId || null,
      totalQuestions: quiz._count.questions,
      status: 'IN_PROGRESS',
      currentQuestionIndex: 0,
      score: 0,
      correctAnswersCount: 0,
    },
  });

  // If authenticated user, ensure UserQuizProgress entry exists
  if (userId) {
    await prisma.userQuizProgress.upsert({
      where: {
        userId_quizId: { userId, quizId },
      },
      create: {
        userId,
        quizId,
        attemptsCount: 1,
        lastAttemptAt: new Date(),
      },
      update: {
        attemptsCount: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });
  }

  return attempt;
}

/**
 * Records an answer to a question within an active attempt.
 */
export async function recordQuizAnswer({
  attemptId,
  questionId,
  selectedOptionId,
  timeSpentSeconds,
}: RecordAnswerInput) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    throw new Error(`Attempt with ID "${attemptId}" not found.`);
  }

  if (attempt.status === 'COMPLETED') {
    throw new Error(`Cannot record answer for an already completed attempt.`);
  }

  // Verify option and correctness
  const option = await prisma.option.findFirst({
    where: {
      id: selectedOptionId,
      questionId,
    },
  });

  if (!option) {
    throw new Error(`Option "${selectedOptionId}" does not belong to Question "${questionId}".`);
  }

  const isCorrect = option.isCorrect;

  // Save or update the answer
  const answer = await prisma.quizAttemptAnswer.upsert({
    where: {
      attemptId_questionId: { attemptId, questionId },
    },
    create: {
      attemptId,
      questionId,
      selectedOptionId,
      isCorrect,
      timeSpentSeconds: timeSpentSeconds || null,
    },
    update: {
      selectedOptionId,
      isCorrect,
      timeSpentSeconds: timeSpentSeconds || null,
    },
  });

  // Recalculate score and answered count
  const allAnswers = await prisma.quizAttemptAnswer.findMany({
    where: { attemptId },
  });

  const correctCount = allAnswers.filter((a) => a.isCorrect).length;
  const totalAnswered = allAnswers.length;

  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      correctAnswersCount: correctCount,
      score: correctCount,
      currentQuestionIndex: totalAnswered,
    },
  });

  return {
    answer,
    isCorrect,
    correctAnswersCount: correctCount,
    totalAnswered,
  };
}

/**
 * Completes a quiz attempt and updates the user's overall progress & high scores.
 */
export async function completeQuizAttempt({
  attemptId,
  timeSpentSeconds,
}: CompleteAttemptInput) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: true,
      quiz: {
        include: {
          _count: { select: { questions: true } },
        },
      },
    },
  });

  if (!attempt) {
    throw new Error(`Attempt with ID "${attemptId}" not found.`);
  }

  const totalQuestions = attempt.quiz._count.questions || attempt.totalQuestions;
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const percentageScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const completedAttempt = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      score: correctCount,
      correctAnswersCount: correctCount,
      totalQuestions,
      timeSpentSeconds: timeSpentSeconds || attempt.timeSpentSeconds || 0,
    },
  });

  // Update User Progress if associated with a user
  if (attempt.userId) {
    const existingProgress = await prisma.userQuizProgress.findUnique({
      where: {
        userId_quizId: {
          userId: attempt.userId,
          quizId: attempt.quizId,
        },
      },
    });

    const currentBest = existingProgress?.bestScore || 0;
    const currentHighest = existingProgress?.highestScore || 0;

    await prisma.userQuizProgress.upsert({
      where: {
        userId_quizId: {
          userId: attempt.userId,
          quizId: attempt.quizId,
        },
      },
      create: {
        userId: attempt.userId,
        quizId: attempt.quizId,
        bestScore: correctCount,
        highestScore: percentageScore,
        attemptsCount: 1,
        lastAttemptAt: new Date(),
        isCompleted: true,
      },
      update: {
        bestScore: Math.max(currentBest, correctCount),
        highestScore: Math.max(currentHighest, percentageScore),
        lastAttemptAt: new Date(),
        isCompleted: true,
      },
    });
  }

  return {
    attempt: completedAttempt,
    totalQuestions,
    correctCount,
    percentageScore,
  };
}

/**
 * Retrieves a user's progress and previous attempts for a specific quiz.
 */
export async function getUserQuizProgress(userId: string, quizId: string) {
  const [progress, attempts, activeAttempt] = await Promise.all([
    prisma.userQuizProgress.findUnique({
      where: { userId_quizId: { userId, quizId } },
    }),
    prisma.quizAttempt.findMany({
      where: { userId, quizId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      take: 10,
    }),
    prisma.quizAttempt.findFirst({
      where: { userId, quizId, status: 'IN_PROGRESS' },
      orderBy: { startedAt: 'desc' },
      include: {
        answers: true,
      },
    }),
  ]);

  return {
    progress,
    attempts,
    activeAttempt,
  };
}

/**
 * Retrieves a high-level dashboard summary for a user.
 */
export async function getUserDashboard(userId: string) {
  const [user, allProgress, recentAttempts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
    }),
    prisma.userQuizProgress.findMany({
      where: { userId },
      include: { quiz: true },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: { quiz: true },
    }),
  ]);

  if (!user) {
    throw new Error(`User with ID "${userId}" not found.`);
  }

  const quizzesAttempted = allProgress.length;
  const quizzesCompleted = allProgress.filter((p) => p.isCompleted).length;
  const avgScore =
    quizzesCompleted > 0
      ? Math.round(
          allProgress.reduce((sum, p) => sum + p.highestScore, 0) / quizzesCompleted
        )
      : 0;

  return {
    user,
    stats: {
      quizzesAttempted,
      quizzesCompleted,
      averagePercentageScore: avgScore,
    },
    quizzes: allProgress,
    recentAttempts,
  };
}
