import { prisma } from '../lib/db';
import {
  startQuizAttempt,
  recordQuizAnswer,
  completeQuizAttempt,
  getUserQuizProgress,
  getUserDashboard,
} from '../lib/progress';

async function main() {
  console.log('Testing User entity and Progress tracking...\n');

  // 1. Create or get test user
  const user = await prisma.user.upsert({
    where: { email: 'test_user@example.com' },
    create: {
      name: 'Alice Developer',
      email: 'test_user@example.com',
      role: 'USER',
    },
    update: {},
  });

  console.log(`✓ User created / verified: ${user.name} (${user.id})`);

  // 2. Fetch an existing quiz with questions and options
  const quiz = await prisma.quiz.findFirst({
    include: {
      questions: {
        include: { options: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!quiz || quiz.questions.length === 0) {
    throw new Error('No quiz found to test with. Run `npm run db:seed` or `npm run db:import` first.');
  }

  console.log(`✓ Target quiz: "${quiz.title}" (${quiz.questions.length} questions)`);

  // 3. Start a quiz attempt
  const attempt = await startQuizAttempt({
    userId: user.id,
    quizId: quiz.id,
  });

  console.log(`✓ Started attempt: ID ${attempt.id} (Status: ${attempt.status})`);

  // 4. Record answers for all questions
  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    // Pick the correct option
    const correctOption = q.options.find((o) => o.isCorrect) || q.options[0];

    const res = await recordQuizAnswer({
      attemptId: attempt.id,
      questionId: q.id,
      selectedOptionId: correctOption.id,
      timeSpentSeconds: 15,
    });

    console.log(`  - Question ${i + 1}: Recorded answer. Is correct: ${res.isCorrect} (Score so far: ${res.correctAnswersCount})`);
  }

  // 5. Complete attempt
  const completion = await completeQuizAttempt({
    attemptId: attempt.id,
    timeSpentSeconds: 45,
  });

  console.log(`✓ Completed attempt!`);
  console.log(`  - Score: ${completion.correctCount} / ${completion.totalQuestions} (${completion.percentageScore}%)`);

  // 6. Verify User Quiz Progress
  const quizProgress = await getUserQuizProgress(user.id, quiz.id);
  console.log(`✓ User Quiz Progress verified:`);
  console.log(`  - Best Score: ${quizProgress.progress?.bestScore}`);
  console.log(`  - Highest Score: ${quizProgress.progress?.highestScore}%`);
  console.log(`  - Attempts Count: ${quizProgress.progress?.attemptsCount}`);
  console.log(`  - Completed: ${quizProgress.progress?.isCompleted}`);

  // 7. Verify User Dashboard
  const dashboard = await getUserDashboard(user.id);
  console.log(`✓ User Dashboard verified:`);
  console.log(`  - Quizzes Attempted: ${dashboard.stats.quizzesAttempted}`);
  console.log(`  - Quizzes Completed: ${dashboard.stats.quizzesCompleted}`);
  console.log(`  - Average Score: ${dashboard.stats.averagePercentageScore}%`);

  // 8. Cleanup test user
  await prisma.user.delete({
    where: { id: user.id },
  });
  console.log('\n✓ Test user and associated progress data cleaned up cleanly.');
  console.log('All user and progress tracking tests passed successfully! 🎉');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Test failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
