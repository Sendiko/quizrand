import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

export default async function QuizReviewPage({ params }: { params: Promise<{ id: string }> }) {
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

  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      userId: session.id,
      quizId: id,
      status: 'COMPLETED',
    },
    orderBy: { completedAt: 'desc' },
    include: {
      answers: {
        include: {
          selectedOption: true,
        },
      },
    },
  });

  if (!attempt) {
    redirect(`/quiz/${id}`);
  }

  const totalQuestions = attempt.totalQuestions || quiz.questions.length;
  const percentageScore = totalQuestions > 0 ? Math.round((attempt.correctAnswersCount / totalQuestions) * 100) : 0;

  return (
    <main className="review-page min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="md3-card mx-auto max-w-5xl p-6">
        <div className="review-divider mb-8 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">Review</p>
            <Typography component="h1" variant="h4" sx={{ mt: 1, fontWeight: 700 }}>{quiz.title}</Typography>
            {quiz.description ? (
              <p className="review-muted mt-2 max-w-2xl text-sm">{quiz.description}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Chip color="primary" label={`${attempt.correctAnswersCount}/${totalQuestions} correct`} />
            <Chip color="success" label={`${percentageScore}% score`} />
            <Button
              href="/quizzes"
              variant="outlined"
            >
              Back to quizzes
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          {quiz.questions.map((question, index) => {
            const answers = attempt.answers.filter((item) => item.questionId === question.id);
            const selectedOptionIds = new Set(
              answers.flatMap((answer) => (answer.selectedOptionId ? [answer.selectedOptionId] : []))
            );
            const selectedOptions = question.options.filter((option) => selectedOptionIds.has(option.id));
            const correctOptions = question.options.filter((option) => option.isCorrect);
            const isCorrect = answers.length > 0 && answers.every((answer) => answer.isCorrect);

            return (
              <Card
                key={question.id}
                sx={{ borderRadius: 4, p: 2.5 }}
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="review-muted text-xs font-semibold uppercase tracking-[0.2em]">
                    Question {index + 1}
                  </p>
                  <span
                    className={`review-status rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${isCorrect ? 'review-status-correct' : 'review-status-incorrect'}`}
                  >
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>{question.text}</Typography>

                {question.header ? (
                  <div className="review-header mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">
                    {question.header}
                  </div>
                ) : null}

                <div className="mt-5 space-y-3">
                  {question.options.map((option) => {
                    const isSelected = selectedOptionIds.has(option.id);
                    const isCorrectOption = option.isCorrect;

                    const optionStyles = isCorrectOption
                      ? 'review-option-correct'
                      : isSelected && !isCorrectOption
                        ? 'review-option-incorrect'
                        : 'review-option-default';

                    return (
                      <div
                        key={option.id}
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${optionStyles}`}
                      >
                        <span className="review-option-text text-base font-medium">{option.text}</span>
                        <span className="review-muted text-xs font-semibold uppercase tracking-[0.16em]">
                              {isCorrectOption ? 'Correct answer' : isSelected ? 'Your choice' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="review-summary mt-5 rounded-2xl border p-4">
                  <p className="review-summary-text text-sm">
                    <span className="review-summary-heading font-semibold">Your answer:</span>{' '}
                    {selectedOptions.length > 0
                      ? selectedOptions.map((option) => option.text).join(', ')
                      : 'No answer selected'}
                  </p>
                  <p className="review-summary-text mt-2 text-sm">
                    <span className="review-summary-heading font-semibold">Correct answer:</span>{' '}
                    {correctOptions.map((option) => option.text).join(', ')}
                  </p>
                  {question.explanation ? (
                    <p className="review-muted mt-3 text-sm">
                      <span className="review-summary-heading font-semibold">Explanation:</span>{' '}
                      {question.explanation}
                    </p>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
