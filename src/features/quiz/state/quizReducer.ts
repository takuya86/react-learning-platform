import type { QuizSession } from '@/domain/types';

export interface QuizState {
  quizId: string;
  currentIndex: number;
  answers: Record<string, number | null>;
  skippedQuestionIds: string[];
  hintUsedByQuestionId: Record<string, boolean>;
  startedAt: string;
  lastUpdatedAt: string;
  timeRemainingSec: number | null;
  isFinished: boolean;
  showExplanation: boolean;
}

export type QuizAction =
  | { type: 'SELECT_ANSWER'; questionId: string; answerIndex: number }
  | { type: 'NEXT_QUESTION'; totalQuestions: number }
  | { type: 'SKIP_QUESTION'; questionId: string; totalQuestions: number }
  | { type: 'USE_HINT'; questionId: string }
  | { type: 'TICK' }
  | { type: 'TIMEOUT' }
  | { type: 'FINISH' }
  | { type: 'RESET'; quizId: string; timeLimitSec: number | null }
  | { type: 'RESUME_FROM_SESSION'; session: QuizSession }
  | { type: 'SHOW_EXPLANATION' }
  | { type: 'HIDE_EXPLANATION' };

export function createInitialState(
  quizId: string,
  timeLimitSec: number | null
): QuizState {
  const now = new Date().toISOString();
  return {
    quizId,
    currentIndex: 0,
    answers: {},
    skippedQuestionIds: [],
    hintUsedByQuestionId: {},
    startedAt: now,
    lastUpdatedAt: now,
    timeRemainingSec: timeLimitSec,
    isFinished: false,
    showExplanation: false,
  };
}

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  const now = new Date().toISOString();

  switch (action.type) {
    case 'SELECT_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: action.answerIndex,
        },
        lastUpdatedAt: now,
        showExplanation: true,
      };

    case 'NEXT_QUESTION': {
      const nextIndex = state.currentIndex + 1;
      const isFinished = nextIndex >= action.totalQuestions;
      return {
        ...state,
        currentIndex: isFinished ? state.currentIndex : nextIndex,
        isFinished,
        lastUpdatedAt: now,
        showExplanation: false,
      };
    }

    case 'SKIP_QUESTION': {
      const nextIndex = state.currentIndex + 1;
      const isFinished = nextIndex >= action.totalQuestions;
      const newSkipped = state.skippedQuestionIds.includes(action.questionId)
        ? state.skippedQuestionIds
        : [...state.skippedQuestionIds, action.questionId];

      return {
        ...state,
        skippedQuestionIds: newSkipped,
        answers: {
          ...state.answers,
          [action.questionId]: state.answers[action.questionId] ?? null,
        },
        currentIndex: isFinished ? state.currentIndex : nextIndex,
        isFinished,
        lastUpdatedAt: now,
        showExplanation: false,
      };
    }

    case 'USE_HINT':
      return {
        ...state,
        hintUsedByQuestionId: {
          ...state.hintUsedByQuestionId,
          [action.questionId]: true,
        },
        lastUpdatedAt: now,
      };

    case 'TICK': {
      if (state.timeRemainingSec === null || state.timeRemainingSec <= 0) {
        return state;
      }
      return {
        ...state,
        timeRemainingSec: state.timeRemainingSec - 1,
        lastUpdatedAt: now,
      };
    }

    case 'TIMEOUT':
      return {
        ...state,
        isFinished: true,
        timeRemainingSec: 0,
        lastUpdatedAt: now,
      };

    case 'FINISH':
      return {
        ...state,
        isFinished: true,
        lastUpdatedAt: now,
      };

    case 'RESET':
      return createInitialState(action.quizId, action.timeLimitSec);

    case 'RESUME_FROM_SESSION':
      return {
        quizId: action.session.quizId,
        currentIndex: action.session.currentIndex,
        answers: action.session.answers,
        skippedQuestionIds: action.session.skippedQuestionIds,
        hintUsedByQuestionId: action.session.hintUsedByQuestionId,
        startedAt: action.session.startedAt,
        lastUpdatedAt: now,
        timeRemainingSec: action.session.timeRemainingSec,
        isFinished: action.session.isFinished,
        showExplanation: false,
      };

    case 'SHOW_EXPLANATION':
      return {
        ...state,
        showExplanation: true,
      };

    case 'HIDE_EXPLANATION':
      return {
        ...state,
        showExplanation: false,
      };

    default:
      return state;
  }
}

export function stateToSession(state: QuizState): QuizSession {
  return {
    quizId: state.quizId,
    currentIndex: state.currentIndex,
    answers: state.answers,
    skippedQuestionIds: state.skippedQuestionIds,
    hintUsedByQuestionId: state.hintUsedByQuestionId,
    startedAt: state.startedAt,
    lastUpdatedAt: state.lastUpdatedAt,
    timeRemainingSec: state.timeRemainingSec,
    isFinished: state.isFinished,
  };
}
