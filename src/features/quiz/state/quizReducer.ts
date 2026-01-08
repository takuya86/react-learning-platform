import type { QuizSession } from '@/domain/types';
import { QUIZ_SESSION_VERSION } from '@/domain/types';

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
  | { type: 'SELECT_ANSWER'; questionId: string; answerIndex: number; timestamp: string }
  | { type: 'NEXT_QUESTION'; totalQuestions: number; timestamp: string }
  | { type: 'SKIP_QUESTION'; questionId: string; totalQuestions: number; timestamp: string }
  | { type: 'USE_HINT'; questionId: string; timestamp: string }
  | { type: 'TICK'; timestamp: string }
  | { type: 'FINISH'; timestamp: string }
  | { type: 'RESET'; quizId: string; timeLimitSec: number | null; timestamp: string }
  | { type: 'RESUME_FROM_SESSION'; session: QuizSession; timestamp: string }
  | { type: 'SHOW_EXPLANATION' }
  | { type: 'HIDE_EXPLANATION' };

export function createInitialState(
  quizId: string,
  timeLimitSec: number | null,
  timestamp: string
): QuizState {
  return {
    quizId,
    currentIndex: 0,
    answers: {},
    skippedQuestionIds: [],
    hintUsedByQuestionId: {},
    startedAt: timestamp,
    lastUpdatedAt: timestamp,
    timeRemainingSec: timeLimitSec,
    isFinished: false,
    showExplanation: false,
  };
}

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SELECT_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: action.answerIndex,
        },
        lastUpdatedAt: action.timestamp,
        showExplanation: true,
      };

    case 'NEXT_QUESTION': {
      const nextIndex = state.currentIndex + 1;
      const isFinished = nextIndex >= action.totalQuestions;
      return {
        ...state,
        currentIndex: isFinished ? state.currentIndex : nextIndex,
        isFinished,
        lastUpdatedAt: action.timestamp,
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
        lastUpdatedAt: action.timestamp,
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
        lastUpdatedAt: action.timestamp,
      };

    case 'TICK': {
      // No timer or already finished - no change
      if (state.timeRemainingSec === null || state.isFinished) {
        return state;
      }
      // Already at 0 - no change
      if (state.timeRemainingSec <= 0) {
        return state;
      }

      const newTime = state.timeRemainingSec - 1;
      // Time just ran out - auto finish
      if (newTime <= 0) {
        return {
          ...state,
          timeRemainingSec: 0,
          isFinished: true,
          lastUpdatedAt: action.timestamp,
        };
      }
      // Normal tick
      return {
        ...state,
        timeRemainingSec: newTime,
        lastUpdatedAt: action.timestamp,
      };
    }

    case 'FINISH':
      return {
        ...state,
        isFinished: true,
        lastUpdatedAt: action.timestamp,
      };

    case 'RESET':
      return createInitialState(action.quizId, action.timeLimitSec, action.timestamp);

    case 'RESUME_FROM_SESSION':
      return {
        quizId: action.session.quizId,
        currentIndex: action.session.currentIndex,
        answers: action.session.answers,
        skippedQuestionIds: action.session.skippedQuestionIds,
        hintUsedByQuestionId: action.session.hintUsedByQuestionId,
        startedAt: action.session.startedAt,
        lastUpdatedAt: action.timestamp,
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
    version: QUIZ_SESSION_VERSION,
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
