'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface QuizPlayerProps {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    timeLimitMinutes: number | null;
    questions: Array<{
      id: string;
      text: string;
      header: string | null;
      explanation: string | null;
      order: number;
      options: Array<{
        id: string;
        text: string;
        order: number;
      }>;
    }>;
  };
  activeAttempt: {
    id: string;
    quizId: string;
    userId: string | null;
    score: number;
    totalQuestions: number;
    correctAnswersCount: number;
    currentQuestionIndex: number;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    timeSpentSeconds: number | null;
    answers: Array<{
      questionId: string;
      selectedOptionId: string | null;
    }>;
  } | null;
}

const STORAGE_PREFIX = 'quizrand-active-quiz';
const DEFAULT_TIME_OPTIONS = [0, 60, 90];

type QuizAnswerState = Record<string, string | null>;

type PersistedState = {
  selectedTimer: number;
  timeLeft: number;
  answers: QuizAnswerState;
  currentQuestionIndex: number;
  savedAt: number;
};

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatTimestamp(value: number) {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getPersistedState(quizId: string): PersistedState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}:${quizId}`);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<PersistedState>;

    if (
      typeof parsed.selectedTimer === 'number' &&
      typeof parsed.timeLeft === 'number' &&
      parsed.answers && typeof parsed.answers === 'object'
    ) {
      return {
        selectedTimer: parsed.selectedTimer,
        timeLeft: parsed.timeLeft,
        answers: parsed.answers,
        currentQuestionIndex: typeof parsed.currentQuestionIndex === 'number' ? parsed.currentQuestionIndex : 0,
        savedAt: parsed.savedAt ?? Date.now(),
      };
    }
  } catch {
    // Ignore malformed persisted data.
  }

  return null;
}

function persistState(quizId: string, state: PersistedState) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(`${STORAGE_PREFIX}:${quizId}`, JSON.stringify(state));
}

function buildAnswersFromAttempt(attempt: QuizPlayerProps['activeAttempt']) {
  if (!attempt?.answers) {
    return {};
  }

  return attempt.answers.reduce<QuizAnswerState>((acc, answer) => {
    if (answer.selectedOptionId) {
      acc[answer.questionId] = answer.selectedOptionId;
    }

    return acc;
  }, {});
}

export function QuizPlayer({ quiz, activeAttempt }: QuizPlayerProps) {
  const router = useRouter();
  const [showSetup, setShowSetup] = useState<boolean>(() => !activeAttempt);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<QuizAnswerState>(() => {
    const persisted = getPersistedState(quiz.id);
    if (persisted) {
      return persisted.answers;
    }

    return buildAnswersFromAttempt(activeAttempt);
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() => {
    const persisted = getPersistedState(quiz.id);

    if (persisted) {
      return persisted.currentQuestionIndex;
    }

    return activeAttempt?.currentQuestionIndex ?? 0;
  });

  const [selectedTimer, setSelectedTimer] = useState<number>(() => {
    const persisted = getPersistedState(quiz.id);
    if (persisted) {
      return persisted.selectedTimer;
    }

    return quiz.timeLimitMinutes ?? 0;
  });

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const persisted = getPersistedState(quiz.id);
    if (persisted) {
      return persisted.timeLeft;
    }

    if (activeAttempt?.timeSpentSeconds && (quiz.timeLimitMinutes ?? 0) > 0) {
      const totalSeconds = (quiz.timeLimitMinutes ?? 0) * 60;
      return Math.max(0, totalSeconds - activeAttempt.timeSpentSeconds);
    }

    return selectedTimer > 0 ? selectedTimer * 60 : 0;
  });

  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => {
    const persisted = getPersistedState(quiz.id);

    return persisted ? formatTimestamp(persisted.savedAt) : null;
  });

  useEffect(() => {
    if (showSetup || selectedTimer === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [selectedTimer, showSetup]);

  useEffect(() => {
    const persistedState: PersistedState = {
      selectedTimer,
      timeLeft,
      answers: selectedOptions,
      currentQuestionIndex,
      savedAt: Date.now(),
    };

    persistState(quiz.id, persistedState);
  }, [currentQuestionIndex, quiz.id, selectedOptions, selectedTimer, timeLeft]);

  useEffect(() => {
    const persistOnLeave = () => {
      const persistedState: PersistedState = {
        selectedTimer,
        timeLeft,
        answers: selectedOptions,
        currentQuestionIndex,
        savedAt: Date.now(),
      };

      persistState(quiz.id, persistedState);

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/quiz/save-progress',
          JSON.stringify({
            quizId: quiz.id,
            answerMap: selectedOptions,
            timeLeft,
            timerMinutes: selectedTimer,
            currentIndex: currentQuestionIndex,
          })
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistOnLeave();
      }
    };

    window.addEventListener('beforeunload', persistOnLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', persistOnLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentQuestionIndex, quiz.id, selectedOptions, selectedTimer, timeLeft]);

  const answeredCount = Object.keys(selectedOptions).length;
  const progressPercent = Math.round((answeredCount / quiz.questions.length) * 100);
  const currentQuestion = quiz.questions[currentQuestionIndex] ?? quiz.questions[0];

  const handleSelect = (questionId: string, optionId: string) => {
    setSelectedOptions((previous) => ({
      ...previous,
      [questionId]: optionId,
    }));
  };

  const handleTimerOptionChange = (option: number) => {
    setSelectedTimer(option);
    setTimeLeft(option > 0 ? option * 60 : 0);
  };

  const startQuiz = async () => {
    setIsStartingQuiz(true);

    try {
      const response = await fetch('/api/quiz/save-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: quiz.id,
          answerMap: selectedOptions,
          timeLeft,
          timerMinutes: selectedTimer,
          currentIndex: currentQuestionIndex,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not start quiz');
      }

      const persistedState: PersistedState = {
        selectedTimer,
        timeLeft,
        answers: selectedOptions,
        currentQuestionIndex,
        savedAt: Date.now(),
      };

      persistState(quiz.id, persistedState);
      setLastSavedAt(formatTimestamp(persistedState.savedAt));
      setShowSetup(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsStartingQuiz(false);
    }
  };

  const saveProgress = async () => {
    const response = await fetch('/api/quiz/save-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quizId: quiz.id,
        answerMap: selectedOptions,
        timeLeft,
        timerMinutes: selectedTimer,
        currentIndex: currentQuestionIndex,
      }),
    });

    if (!response.ok) {
      throw new Error('Could not save progress');
    }

    setLastSavedAt(formatTimestamp(Date.now()));
  };

  const submitQuiz = async () => {
    const response = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quizId: quiz.id,
        answerMap: selectedOptions,
        timeLeft,
        timerMinutes: selectedTimer,
        currentIndex: currentQuestionIndex,
      }),
    });

    if (!response.ok) {
      throw new Error('Could not submit quiz');
    }

    localStorage.removeItem(`${STORAGE_PREFIX}:${quiz.id}`);
    router.push(`/quiz/${quiz.id}/review`);
  };

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      {showSetup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 px-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">
              Quiz setup
            </p>
            <h2 className="mt-3 text-2xl font-bold text-zinc-900">Choose your timer</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Pick how long you want the quiz to run. You can change this anytime before you start.
            </p>

            <div className="mt-6 space-y-3">
              {DEFAULT_TIME_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleTimerOptionChange(option)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    selectedTimer === option
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  <span className="font-medium">
                    {option === 0 ? 'No time' : `${option} minutes`}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em]">
                    {selectedTimer === option ? 'Selected' : 'Select'}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={startQuiz}
                disabled={isStartingQuiz}
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
              >
                {isStartingQuiz ? 'Starting...' : 'Start quiz'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">Quiz</p>
            <h1 className="mt-2 text-3xl font-bold">{quiz.title}</h1>
            {quiz.description ? (
              <p className="mt-2 max-w-2xl text-sm text-zinc-600">{quiz.description}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
              {selectedTimer === 0 ? 'No timer' : `${selectedTimer} min`}
            </div>
            {selectedTimer > 0 ? (
              <div className="rounded-2xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                {formatClock(timeLeft)}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-600">Time selection</span>
            <select
              value={selectedTimer}
              onChange={(event) => handleTimerOptionChange(Number(event.target.value))}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              {DEFAULT_TIME_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 0 ? 'No time' : `${option} minutes`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-500">{answeredCount}/{quiz.questions.length} answered</div>
            {lastSavedAt ? (
              <span className="text-xs text-zinc-500">Saved at {lastSavedAt}</span>
            ) : null}
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm text-zinc-600">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.9fr)]">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Question {currentQuestionIndex + 1}
              </p>
              {currentQuestion.header ? (
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                  {currentQuestion.header}
                </span>
              ) : null}
            </div>

            <h2 className="text-xl font-bold leading-tight text-zinc-900">{currentQuestion.text}</h2>

            <div className="mt-5 space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOptions[currentQuestion.id] === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(currentQuestion.id, option.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    <span className="text-base font-medium text-zinc-800">{option.text}</span>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-zinc-300 bg-white text-zinc-400'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-zinc-200 pt-4">
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((previous) => Math.max(0, previous - 1))}
                disabled={currentQuestionIndex === 0}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setCurrentQuestionIndex((previous) => Math.min(quiz.questions.length - 1, previous + 1))
                }
                disabled={currentQuestionIndex === quiz.questions.length - 1}
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
              >
                Next
              </button>
            </div>
          </div>

          <aside className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Questions
              </h3>
              <span className="text-xs text-zinc-500">{quiz.questions.length} total</span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {quiz.questions.map((question, index) => {
                const isCurrent = index === currentQuestionIndex;
                const isAnswered = Boolean(selectedOptions[question.id]);

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`flex h-12 items-center justify-center rounded-2xl border text-sm font-semibold transition ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                        : isAnswered
                          ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100'
                    }`}
                    aria-label={`Go to question ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveProgress}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Save progress
            </button>
            <Link href="/quizzes" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              ← Back to quizzes
            </Link>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/quizzes')}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Exit
            </button>
            <button
              type="button"
              onClick={submitQuiz}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Finish quiz
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
