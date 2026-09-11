import { prisma } from '../lib/db';

async function main() {
  console.log('Testing Prisma database connection and CRUD operations...');

  // 1. Create a quiz with questions and options
  const quiz = await prisma.quiz.create({
    data: {
      title: 'JavaScript Fundamentals Trivia',
      description: 'Test your understanding of JavaScript core concepts and modern syntax.',
      category: 'Programming',
      timeLimitMinutes: 10,
      isPublished: true,
      questions: {
        create: [
          {
            text: 'What is the output of typeof NaN in JavaScript?',
            explanation: 'NaN is considered a numeric value according to the IEEE 754 floating-point standard, so typeof NaN is "number".',
            order: 1,
            options: {
              create: [
                { text: 'number', isCorrect: true, order: 1 },
                { text: 'nan', isCorrect: false, order: 2 },
                { text: 'undefined', isCorrect: false, order: 3 },
                { text: 'object', isCorrect: false, order: 4 },
              ],
            },
          },
        ],
      },
    },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  console.log('Created Quiz successfully:');
  console.log(`- ID: ${quiz.id}`);
  console.log(`- Title: ${quiz.title}`);
  console.log(`- Questions Count: ${quiz.questions.length}`);
  console.log(`- Options Count for Q1: ${quiz.questions[0].options.length}`);

  // 2. Query quiz back from database
  const fetchedQuiz = await prisma.quiz.findUnique({
    where: { id: quiz.id },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  if (!fetchedQuiz) {
    throw new Error('Failed to retrieve quiz from database');
  }

  console.log('Successfully retrieved quiz from database!');

  // 3. Clean up test record
  await prisma.quiz.delete({
    where: { id: quiz.id },
  });
  console.log('Test record cleaned up successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Verification completed without errors!');
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('Verification failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
