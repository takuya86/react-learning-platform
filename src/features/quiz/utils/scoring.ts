import type { QuizQuestion, QuestionResult, QuizAttempt } from '@/domain/types';
import type { QuizState } from '../state/quizReducer';

export function buildQuestionResults(
  state: QuizState,
  questions: QuizQuestion[]
): QuestionResult[] {
  return questions.map((question) => {
    const selectedIndex = state.answers[question.id];
    const isSkipped = state.skippedQuestionIds.includes(question.id);
    const hintUsed = state.hintUsedByQuestionId[question.id] || false;
    const isCorrect =
      !isSkipped && selectedIndex !== null && selectedIndex === question.correctIndex;

    return {
      questionId: question.id,
      isCorrect,
      isSkipped,
      hintUsed,
      selectedChoiceIndex: selectedIndex ?? null,
    };
  });
}

export function buildQuizAttempt(
  state: QuizState,
  questions: QuizQuestion[]
): QuizAttempt {
  const perQuestion = buildQuestionResults(state, questions);
  const score = perQuestion.filter((r) => r.isCorrect).length;

  const startTime = new Date(state.startedAt).getTime();
  const endTime = new Date(state.lastUpdatedAt).getTime();
  const timeTakenSec = Math.round((endTime - startTime) / 1000);

  return {
    quizId: state.quizId,
    attemptedAt: state.lastUpdatedAt,
    score,
    totalQuestions: questions.length,
    perQuestion,
    timeTakenSec,
  };
}
