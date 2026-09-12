import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

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
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-8 flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">Review</p>
            <h1 className="mt-2 text-3xl font-bold">{quiz.title}</h1>
            {quiz.description ? (
              <p className="mt-2 max-w-2xl text-sm text-zinc-600">{quiz.description}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
              {attempt.correctAnswersCount}/{totalQuestions} correct
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {percentageScore}% score
            </div>
            <Link
              href="/quizzes"
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Back to quizzes
            </Link>
          </div>
        </div>

        <div className="space-y-5">
          {quiz.questions.map((question, index) => {
            const answer = attempt.answers.find((item) => item.questionId === question.id);
            const selectedOption =
              answer?.selectedOptionId && question.options.some((option) => option.id === answer.selectedOptionId)
                ? question.options.find((option) => option.id === answer.selectedOptionId)
                : null;
            const correctOption = question.options.find((option) => option.isCorrect);
            const isCorrect = answer?.isCorrect ?? false;

            return (
              <div
                key={question.id}
                className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Question {index + 1}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                      isCorrect
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                <h2 className="text-xl font-bold leading-tight text-zinc-900">{question.text}</h2>

                {question.header ? (
                  <div className="mt-3 inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                    {question.header}
                  </div>
                ) : null}

                <div className="mt-5 space-y-3">
                  {question.options.map((option) => {
                    const isSelected = option.id === selectedOption?.id;
                    const isCorrectOption = option.id === correctOption?.id;

                    const optionStyles = isCorrectOption
                      ? 'border-emerald-500 bg-emerald-50'
                      : isSelected && !isCorrectOption
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-zinc-200 bg-white';

                    return (
                      <div
                        key={option.id}
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${optionStyles}`}
                      >
                        <span className="text-base font-medium text-zinc-800">{option.text}</span>
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                          {isCorrectOption ? 'Correct answer' : isSelected ? 'Your choice' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4">
                  <p className="text-sm text-zinc-700">
                    <span className="font-semibold text-zinc-900">Your answer:</span>{' '}
                    {selectedOption ? selectedOption.text : 'No answer selected'}
                  </p>
                  <p className="mt-2 text-sm text-zinc-700">
                    <span className="font-semibold text-zinc-900">Correct answer:</span>{' '}
                    {correctOption?.text}
                  </p>
                  {question.explanation ? (
                    <p className="mt-3 text-sm text-zinc-600">
                      <span className="font-semibold text-zinc-900">Explanation:</span>{' '}
                      {question.explanation}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
