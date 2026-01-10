import { describe, it, expect } from 'vitest';
import {
  mergeProgress,
  mergeNotes,
  hasProgressChanges,
  hasNotesChanges,
} from '@/features/sync/services/mergeStrategy';
import type { Progress, Note } from '@/domain/types';

describe('mergeStrategy', () => {
  describe('mergeProgress', () => {
    const baseProgress: Progress = {
      lessons: {},
      completedQuizzes: [],
      completedExercises: [],
      streak: 0,
      lastStudyDate: null,
      studyDates: [],
      quizAttempts: [],
    };

    it('should return local progress when remote is empty', () => {
      const local: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
        },
        completedQuizzes: ['quiz-1'],
      };
      const remote: Progress = { ...baseProgress };

      const result = mergeProgress(local, remote);

      expect(result.lessons['lesson-1']).toBeDefined();
      expect(result.completedQuizzes).toContain('quiz-1');
    });

    it('should union completed quizzes', () => {
      const local: Progress = {
        ...baseProgress,
        completedQuizzes: ['quiz-1', 'quiz-2'],
      };
      const remote: Progress = {
        ...baseProgress,
        completedQuizzes: ['quiz-2', 'quiz-3'],
      };

      const result = mergeProgress(local, remote);

      expect(result.completedQuizzes).toHaveLength(3);
      expect(result.completedQuizzes).toContain('quiz-1');
      expect(result.completedQuizzes).toContain('quiz-2');
      expect(result.completedQuizzes).toContain('quiz-3');
    });

    it('should prefer completed lesson over opened-only', () => {
      const local: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
        },
      };
      const remote: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': {
            lessonId: 'lesson-1',
            openedAt: '2025-01-01T00:00:00Z',
            completedAt: '2025-01-02T00:00:00Z',
          },
        },
      };

      const result = mergeProgress(local, remote);

      expect(result.lessons['lesson-1'].completedAt).toBe('2025-01-02T00:00:00Z');
    });

    it('should take higher streak value', () => {
      const local: Progress = { ...baseProgress, streak: 5 };
      const remote: Progress = { ...baseProgress, streak: 3 };

      const result = mergeProgress(local, remote);

      expect(result.streak).toBe(5);
    });

    it('should take more recent lastStudyDate', () => {
      const local: Progress = { ...baseProgress, lastStudyDate: '2025-01-05' };
      const remote: Progress = { ...baseProgress, lastStudyDate: '2025-01-03' };

      const result = mergeProgress(local, remote);

      expect(result.lastStudyDate).toBe('2025-01-05');
    });

    it('should union study dates', () => {
      const local: Progress = {
        ...baseProgress,
        studyDates: ['2025-01-01', '2025-01-02'],
      };
      const remote: Progress = {
        ...baseProgress,
        studyDates: ['2025-01-02', '2025-01-03'],
      };

      const result = mergeProgress(local, remote);

      expect(result.studyDates).toHaveLength(3);
      expect(result.studyDates).toEqual(['2025-01-01', '2025-01-02', '2025-01-03']);
    });

    it('should dedupe quiz attempts by quizId and attemptedAt', () => {
      const local: Progress = {
        ...baseProgress,
        quizAttempts: [
          {
            quizId: 'quiz-1',
            attemptedAt: '2025-01-01T00:00:00Z',
            score: 80,
            totalQuestions: 10,
            perQuestion: [],
          },
        ],
      };
      const remote: Progress = {
        ...baseProgress,
        quizAttempts: [
          {
            quizId: 'quiz-1',
            attemptedAt: '2025-01-01T00:00:00Z',
            score: 80,
            totalQuestions: 10,
            perQuestion: [],
          },
          {
            quizId: 'quiz-1',
            attemptedAt: '2025-01-02T00:00:00Z',
            score: 90,
            totalQuestions: 10,
            perQuestion: [],
          },
        ],
      };

      const result = mergeProgress(local, remote);

      expect(result.quizAttempts).toHaveLength(2);
    });
  });

  describe('mergeNotes', () => {
    const createNote = (lessonId: string, markdown: string, updatedAt: string): Note => ({
      lessonId,
      markdown,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt,
    });

    it('should return local notes when remote is empty', () => {
      const local: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'local content', '2025-01-01T00:00:00Z'),
      };
      const remote: Record<string, Note> = {};

      const result = mergeNotes(local, remote);

      expect(result['lesson-1'].markdown).toBe('local content');
    });

    it('should prefer more recent note based on updatedAt', () => {
      const local: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'old content', '2025-01-01T00:00:00Z'),
      };
      const remote: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'new content', '2025-01-02T00:00:00Z'),
      };

      const result = mergeNotes(local, remote);

      expect(result['lesson-1'].markdown).toBe('new content');
    });

    it('should keep local note when local is more recent', () => {
      const local: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'new content', '2025-01-02T00:00:00Z'),
      };
      const remote: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'old content', '2025-01-01T00:00:00Z'),
      };

      const result = mergeNotes(local, remote);

      expect(result['lesson-1'].markdown).toBe('new content');
    });

    it('should include notes from both local and remote', () => {
      const local: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'local note', '2025-01-01T00:00:00Z'),
      };
      const remote: Record<string, Note> = {
        'lesson-2': createNote('lesson-2', 'remote note', '2025-01-01T00:00:00Z'),
      };

      const result = mergeNotes(local, remote);

      expect(result['lesson-1']).toBeDefined();
      expect(result['lesson-2']).toBeDefined();
    });
  });

  describe('hasProgressChanges', () => {
    const baseProgress: Progress = {
      lessons: {},
      completedQuizzes: [],
      completedExercises: [],
      streak: 0,
      lastStudyDate: null,
      studyDates: [],
      quizAttempts: [],
    };

    it('should return true when remote is null', () => {
      expect(hasProgressChanges(baseProgress, null)).toBe(true);
    });

    it('should return true when lesson count differs', () => {
      const local: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
        },
      };

      expect(hasProgressChanges(local, baseProgress)).toBe(true);
    });

    it('should return true when local has new completed lesson', () => {
      const local: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': {
            lessonId: 'lesson-1',
            openedAt: '2025-01-01T00:00:00Z',
            completedAt: '2025-01-02T00:00:00Z',
          },
        },
      };
      const remote: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
        },
      };

      expect(hasProgressChanges(local, remote)).toBe(true);
    });

    it('should return false when progress is identical', () => {
      const local: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
        },
      };
      const remote: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
        },
      };

      expect(hasProgressChanges(local, remote)).toBe(false);
    });
  });

  describe('hasNotesChanges', () => {
    const createNote = (lessonId: string, markdown: string): Note => ({
      lessonId,
      markdown,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    });

    it('should return false when both are empty', () => {
      expect(hasNotesChanges({}, {})).toBe(false);
    });

    it('should return true when local has notes and remote is null', () => {
      const local: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'content'),
      };

      expect(hasNotesChanges(local, null)).toBe(true);
    });

    it('should return true when note counts differ', () => {
      const local: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'content'),
        'lesson-2': createNote('lesson-2', 'content'),
      };
      const remote: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'content'),
      };

      expect(hasNotesChanges(local, remote)).toBe(true);
    });

    it('should return true when markdown content differs', () => {
      const local: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'new content'),
      };
      const remote: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'old content'),
      };

      expect(hasNotesChanges(local, remote)).toBe(true);
    });

    it('should return false when notes are identical', () => {
      const local: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'content'),
      };
      const remote: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'content'),
      };

      expect(hasNotesChanges(local, remote)).toBe(false);
    });
  });
});
