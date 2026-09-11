import { prisma } from '../lib/db';

async function seed() {
  console.log('Seeding initial quiz data...');

  const sampleQuizzes = [
    {
      title: 'JavaScript & Web Fundamentals',
      description: 'Test your knowledge on core JavaScript behaviors, event loops, and web APIs.',
      category: 'Technology',
      timeLimitMinutes: 10,
      isPublished: true,
      questions: [
        {
          text: 'What does "NaN === NaN" evaluate to in JavaScript?',
          explanation: 'NaN is the only value in JavaScript that is not equal to itself using the strict equality operator (===). Use Number.isNaN() instead.',
          order: 1,
          options: [
            { text: 'false', isCorrect: true, order: 1 },
            { text: 'true', isCorrect: false, order: 2 },
            { text: 'undefined', isCorrect: false, order: 3 },
            { text: 'TypeError', isCorrect: false, order: 4 },
          ],
        },
        {
          text: 'Which JavaScript method creates a shallow copy of an Array?',
          explanation: 'Array.prototype.slice() or the spread operator ([...arr]) creates a shallow copy.',
          order: 2,
          options: [
            { text: 'Array.prototype.slice()', isCorrect: true, order: 1 },
            { text: 'Array.prototype.splice()', isCorrect: false, order: 2 },
            { text: 'Array.prototype.push()', isCorrect: false, order: 3 },
            { text: 'Array.prototype.reverse()', isCorrect: false, order: 4 },
          ],
        },
      ],
    },
    {
      title: 'General Science & Space Trivia',
      description: 'A quick trivia quiz exploring space exploration and natural sciences.',
      category: 'Science',
      timeLimitMinutes: 8,
      isPublished: true,
      questions: [
        {
          text: 'Which planet in our solar system has the most extensive ring system?',
          explanation: 'Saturn possesses the most prominent and extensive ring system, composed largely of water ice and rock fragments.',
          order: 1,
          options: [
            { text: 'Saturn', isCorrect: true, order: 1 },
            { text: 'Jupiter', isCorrect: false, order: 2 },
            { text: 'Neptune', isCorrect: false, order: 3 },
            { text: 'Uranus', isCorrect: false, order: 4 },
          ],
        },
      ],
    },
  ];

  for (const quizData of sampleQuizzes) {
    const existing = await prisma.quiz.findFirst({
      where: { title: quizData.title },
    });

    if (!existing) {
      const created = await prisma.quiz.create({
        data: {
          title: quizData.title,
          description: quizData.description,
          category: quizData.category,
          timeLimitMinutes: quizData.timeLimitMinutes,
          isPublished: quizData.isPublished,
          questions: {
            create: quizData.questions.map((q) => ({
              text: q.text,
              explanation: q.explanation,
              order: q.order,
              options: {
                create: q.options.map((o) => ({
                  text: o.text,
                  isCorrect: o.isCorrect,
                  order: o.order,
                })),
              },
            })),
          },
        },
      });
      console.log(`✓ Seeded quiz: "${created.title}"`);
    } else {
      console.log(`- Quiz already exists: "${quizData.title}"`);
    }
  }

  console.log('Seeding finished successfully!');
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seeding failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
