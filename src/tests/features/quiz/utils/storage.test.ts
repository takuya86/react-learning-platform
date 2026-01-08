import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveQuizSession,
  loadQuizSession,
  deleteQuizSession,
  hasQuizSession,
  getSessionKey,
} from '@/features/quiz/utils/storage';
import { QUIZ_SESSION_VERSION, type QuizSession } from '@/domain/types';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const createValidSession = (overrides: Partial<QuizSession> = {}): QuizSession => ({
    version: QUIZ_SESSION_VERSION,
    quizId: 'quiz-1',
    currentIndex: 0,
    answers: {},
    skippedQuestionIds: [],
    hintUsedByQuestionId: {},
    startedAt: '2024-01-15T10:00:00.000Z',
    lastUpdatedAt: '2024-01-15T10:00:00.000Z',
    timeRemainingSec: 180,
    isFinished: false,
    ...overrides,
  });

  describe('getSessionKey', () => {
    it('should return correct key format', () => {
      expect(getSessionKey('quiz-1')).toBe('quiz_session:quiz-1');
    });
  });

  describe('saveQuizSession', () => {
    it('should save session to localStorage', () => {
      const session = createValidSession();
      saveQuizSession(session);

      const stored = localStorage.getItem('quiz_session:quiz-1');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(session);
    });
  });

  describe('loadQuizSession', () => {
    it('should return null when no session exists', () => {
      const session = loadQuizSession('quiz-1');
      expect(session).toBeNull();
    });

    it('should load valid session', () => {
      const session = createValidSession();
      localStorage.setItem('quiz_session:quiz-1', JSON.stringify(session));

      const loaded = loadQuizSession('quiz-1');
      expect(loaded).toEqual(session);
    });

    it('should return null and delete finished session', () => {
      const session = createValidSession({ isFinished: true });
      localStorage.setItem('quiz_session:quiz-1', JSON.stringify(session));

      const loaded = loadQuizSession('quiz-1');
      expect(loaded).toBeNull();
      expect(localStorage.getItem('quiz_session:quiz-1')).toBeNull();
    });

    it('should handle corrupted JSON', () => {
      localStorage.setItem('quiz_session:quiz-1', 'not valid json');

      const loaded = loadQuizSession('quiz-1');
      expect(loaded).toBeNull();
      expect(localStorage.getItem('quiz_session:quiz-1')).toBeNull();
    });

    it('should handle session with wrong quizId', () => {
      const session = createValidSession({ quizId: 'different-quiz' });
      localStorage.setItem('quiz_session:quiz-1', JSON.stringify(session));

      const loaded = loadQuizSession('quiz-1');
      expect(loaded).toBeNull();
    });

    it('should handle session without version (backward compatibility)', () => {
      const sessionWithoutVersion = {
        quizId: 'quiz-1',
        currentIndex: 1,
        answers: { q1: 0 },
        skippedQuestionIds: [],
        hintUsedByQuestionId: {},
        startedAt: '2024-01-15T10:00:00.000Z',
        lastUpdatedAt: '2024-01-15T10:00:00.000Z',
        timeRemainingSec: 120,
        isFinished: false,
      };
      localStorage.setItem('quiz_session:quiz-1', JSON.stringify(sessionWithoutVersion));

      const loaded = loadQuizSession('quiz-1');
      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(QUIZ_SESSION_VERSION);
      expect(loaded!.currentIndex).toBe(1);
    });

    it('should normalize invalid currentIndex to 0', () => {
      const session = createValidSession({ currentIndex: -1 as unknown as number });
      localStorage.setItem('quiz_session:quiz-1', JSON.stringify(session));

      const loaded = loadQuizSession('quiz-1');
      expect(loaded!.currentIndex).toBe(0);
    });

    it('should normalize invalid answers to empty object', () => {
      const sessionRaw = {
        ...createValidSession(),
        answers: 'invalid',
      };
      localStorage.setItem('quiz_session:quiz-1', JSON.stringify(sessionRaw));

      const loaded = loadQuizSession('quiz-1');
      expect(loaded!.answers).toEqual({});
    });

    it('should filter invalid items from skippedQuestionIds', () => {
      const sessionRaw = {
        ...createValidSession(),
        skippedQuestionIds: ['valid', 123, null, 'also-valid'],
      };
      localStorage.setItem('quiz_session:quiz-1', JSON.stringify(sessionRaw));

      const loaded = loadQuizSession('quiz-1');
      expect(loaded!.skippedQuestionIds).toEqual(['valid', 'also-valid']);
    });

    it('should clamp negative timeRemainingSec to 0', () => {
      const session = createValidSession({ timeRemainingSec: -10 });
      localStorage.setItem('quiz_session:quiz-1', JSON.stringify(session));

      const loaded = loadQuizSession('quiz-1');
      expect(loaded!.timeRemainingSec).toBe(0);
    });
  });

  describe('deleteQuizSession', () => {
    it('should remove session from localStorage', () => {
      const session = createValidSession();
      localStorage.setItem('quiz_session:quiz-1', JSON.stringify(session));

      deleteQuizSession('quiz-1');

      expect(localStorage.getItem('quiz_session:quiz-1')).toBeNull();
    });
  });

  describe('hasQuizSession', () => {
    it('should return false when no session exists', () => {
      expect(hasQuizSession('quiz-1')).toBe(false);
    });

    it('should return true when valid session exists', () => {
      const session = createValidSession();
      localStorage.setItem('quiz_session:quiz-1', JSON.stringify(session));

      expect(hasQuizSession('quiz-1')).toBe(true);
    });

    it('should return false when session is finished', () => {
      const session = createValidSession({ isFinished: true });
      localStorage.setItem('quiz_session:quiz-1', JSON.stringify(session));

      expect(hasQuizSession('quiz-1')).toBe(false);
    });
  });
});
