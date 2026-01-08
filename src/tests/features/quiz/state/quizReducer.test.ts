import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  quizReducer,
  createInitialState,
  stateToSession,
  type QuizState,
} from '@/features/quiz/state/quizReducer';

describe('quizReducer', () => {
  let initialState: QuizState;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
    initialState = createInitialState('quiz-1', 180);
  });

  describe('createInitialState', () => {
    it('should create initial state with correct values', () => {
      const state = createInitialState('quiz-1', 180);

      expect(state.quizId).toBe('quiz-1');
      expect(state.currentIndex).toBe(0);
      expect(state.answers).toEqual({});
      expect(state.skippedQuestionIds).toEqual([]);
      expect(state.hintUsedByQuestionId).toEqual({});
      expect(state.timeRemainingSec).toBe(180);
      expect(state.isFinished).toBe(false);
      expect(state.showExplanation).toBe(false);
    });

    it('should handle null time limit', () => {
      const state = createInitialState('quiz-1', null);
      expect(state.timeRemainingSec).toBeNull();
    });
  });

  describe('SELECT_ANSWER', () => {
    it('should record the selected answer', () => {
      const newState = quizReducer(initialState, {
        type: 'SELECT_ANSWER',
        questionId: 'q1',
        answerIndex: 2,
      });

      expect(newState.answers['q1']).toBe(2);
      expect(newState.showExplanation).toBe(true);
    });

    it('should preserve other answers', () => {
      const stateWithAnswer = {
        ...initialState,
        answers: { q1: 1 },
      };

      const newState = quizReducer(stateWithAnswer, {
        type: 'SELECT_ANSWER',
        questionId: 'q2',
        answerIndex: 0,
      });

      expect(newState.answers).toEqual({ q1: 1, q2: 0 });
    });
  });

  describe('NEXT_QUESTION', () => {
    it('should increment currentIndex', () => {
      const newState = quizReducer(initialState, {
        type: 'NEXT_QUESTION',
        totalQuestions: 5,
      });

      expect(newState.currentIndex).toBe(1);
      expect(newState.isFinished).toBe(false);
      expect(newState.showExplanation).toBe(false);
    });

    it('should set isFinished when reaching last question', () => {
      const stateAtLastQuestion = { ...initialState, currentIndex: 4 };

      const newState = quizReducer(stateAtLastQuestion, {
        type: 'NEXT_QUESTION',
        totalQuestions: 5,
      });

      expect(newState.isFinished).toBe(true);
      expect(newState.currentIndex).toBe(4);
    });
  });

  describe('SKIP_QUESTION', () => {
    it('should add question to skipped list and move to next', () => {
      const newState = quizReducer(initialState, {
        type: 'SKIP_QUESTION',
        questionId: 'q1',
        totalQuestions: 5,
      });

      expect(newState.skippedQuestionIds).toContain('q1');
      expect(newState.currentIndex).toBe(1);
      expect(newState.answers['q1']).toBeNull();
    });

    it('should not duplicate skipped question', () => {
      const stateWithSkipped = {
        ...initialState,
        skippedQuestionIds: ['q1'],
      };

      const newState = quizReducer(stateWithSkipped, {
        type: 'SKIP_QUESTION',
        questionId: 'q1',
        totalQuestions: 5,
      });

      expect(newState.skippedQuestionIds.filter((id) => id === 'q1').length).toBe(1);
    });

    it('should finish quiz when skipping last question', () => {
      const stateAtLastQuestion = { ...initialState, currentIndex: 4 };

      const newState = quizReducer(stateAtLastQuestion, {
        type: 'SKIP_QUESTION',
        questionId: 'q5',
        totalQuestions: 5,
      });

      expect(newState.isFinished).toBe(true);
    });
  });

  describe('USE_HINT', () => {
    it('should record hint usage for question', () => {
      const newState = quizReducer(initialState, {
        type: 'USE_HINT',
        questionId: 'q1',
      });

      expect(newState.hintUsedByQuestionId['q1']).toBe(true);
    });
  });

  describe('TICK', () => {
    it('should decrement time remaining', () => {
      const newState = quizReducer(initialState, { type: 'TICK' });

      expect(newState.timeRemainingSec).toBe(179);
    });

    it('should not decrement below 0', () => {
      const stateWithZeroTime = { ...initialState, timeRemainingSec: 0 };

      const newState = quizReducer(stateWithZeroTime, { type: 'TICK' });

      expect(newState.timeRemainingSec).toBe(0);
    });

    it('should not change state when timeRemainingSec is null', () => {
      const stateWithNullTime = { ...initialState, timeRemainingSec: null };

      const newState = quizReducer(stateWithNullTime, { type: 'TICK' });

      expect(newState.timeRemainingSec).toBeNull();
    });
  });

  describe('TIMEOUT', () => {
    it('should set isFinished to true and time to 0', () => {
      const newState = quizReducer(initialState, { type: 'TIMEOUT' });

      expect(newState.isFinished).toBe(true);
      expect(newState.timeRemainingSec).toBe(0);
    });
  });

  describe('FINISH', () => {
    it('should set isFinished to true', () => {
      const newState = quizReducer(initialState, { type: 'FINISH' });

      expect(newState.isFinished).toBe(true);
    });
  });

  describe('RESET', () => {
    it('should reset to initial state with new quiz', () => {
      const modifiedState = {
        ...initialState,
        currentIndex: 3,
        answers: { q1: 1, q2: 2 },
        isFinished: true,
      };

      const newState = quizReducer(modifiedState, {
        type: 'RESET',
        quizId: 'quiz-2',
        timeLimitSec: 240,
      });

      expect(newState.quizId).toBe('quiz-2');
      expect(newState.currentIndex).toBe(0);
      expect(newState.answers).toEqual({});
      expect(newState.isFinished).toBe(false);
      expect(newState.timeRemainingSec).toBe(240);
    });
  });

  describe('RESUME_FROM_SESSION', () => {
    it('should restore state from session', () => {
      const session = {
        quizId: 'quiz-1',
        currentIndex: 2,
        answers: { q1: 1, q2: 0 },
        skippedQuestionIds: ['q3'],
        hintUsedByQuestionId: { q1: true },
        startedAt: '2024-01-15T09:00:00.000Z',
        lastUpdatedAt: '2024-01-15T09:30:00.000Z',
        timeRemainingSec: 120,
        isFinished: false,
      };

      const newState = quizReducer(initialState, {
        type: 'RESUME_FROM_SESSION',
        session,
      });

      expect(newState.currentIndex).toBe(2);
      expect(newState.answers).toEqual({ q1: 1, q2: 0 });
      expect(newState.skippedQuestionIds).toEqual(['q3']);
      expect(newState.hintUsedByQuestionId).toEqual({ q1: true });
      expect(newState.timeRemainingSec).toBe(120);
      expect(newState.showExplanation).toBe(false);
    });
  });

  describe('stateToSession', () => {
    it('should convert state to session format', () => {
      const state: QuizState = {
        quizId: 'quiz-1',
        currentIndex: 1,
        answers: { q1: 2 },
        skippedQuestionIds: [],
        hintUsedByQuestionId: {},
        startedAt: '2024-01-15T10:00:00.000Z',
        lastUpdatedAt: '2024-01-15T10:05:00.000Z',
        timeRemainingSec: 150,
        isFinished: false,
        showExplanation: true,
      };

      const session = stateToSession(state);

      expect(session.quizId).toBe('quiz-1');
      expect(session.currentIndex).toBe(1);
      expect(session.answers).toEqual({ q1: 2 });
      expect(session.timeRemainingSec).toBe(150);
      expect(session.isFinished).toBe(false);
      expect(session).not.toHaveProperty('showExplanation');
    });
  });
});
