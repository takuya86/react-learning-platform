import { describe, it, expect } from 'vitest';
import {
  mapRowToProgress,
  mapProgressToRow,
  mapRowToNote,
  mapNoteToRow,
  type UserProgressRow,
  type UserNoteRow,
} from '@/features/sync/types';
import type { Progress, Note } from '@/domain/types';

describe('sync types', () => {
  describe('mapRowToProgress', () => {
    it('should map database row to Progress type', () => {
      const row: UserProgressRow = {
        id: 'row-id',
        user_id: 'user-id',
        lessons: {
          'lesson-1': {
            lessonId: 'lesson-1',
            openedAt: '2025-01-01T00:00:00Z',
            completedAt: '2025-01-02T00:00:00Z',
          },
        },
        completed_quizzes: ['quiz-1', 'quiz-2'],
        completed_exercises: ['exercise-1'],
        streak: 5,
        last_study_date: '2025-01-05',
        study_dates: ['2025-01-01', '2025-01-02'],
        quiz_attempts: [
          {
            quizId: 'quiz-1',
            attemptedAt: '2025-01-01T00:00:00Z',
            score: 80,
            totalQuestions: 10,
            perQuestion: [],
          },
        ],
        updated_at: '2025-01-05T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = mapRowToProgress(row);

      expect(result.lessons['lesson-1'].lessonId).toBe('lesson-1');
      expect(result.completedQuizzes).toEqual(['quiz-1', 'quiz-2']);
      expect(result.completedExercises).toEqual(['exercise-1']);
      expect(result.streak).toBe(5);
      expect(result.lastStudyDate).toBe('2025-01-05');
      expect(result.studyDates).toEqual(['2025-01-01', '2025-01-02']);
      expect(result.quizAttempts).toHaveLength(1);
    });
  });

  describe('mapProgressToRow', () => {
    it('should map Progress type to database row format', () => {
      const progress: Progress = {
        lessons: {
          'lesson-1': {
            lessonId: 'lesson-1',
            openedAt: '2025-01-01T00:00:00Z',
          },
        },
        completedQuizzes: ['quiz-1'],
        completedExercises: ['exercise-1'],
        streak: 3,
        lastStudyDate: '2025-01-03',
        studyDates: ['2025-01-01', '2025-01-02', '2025-01-03'],
        quizAttempts: [],
      };

      const result = mapProgressToRow('user-123', progress);

      expect(result.user_id).toBe('user-123');
      expect(result.lessons).toEqual(progress.lessons);
      expect(result.completed_quizzes).toEqual(['quiz-1']);
      expect(result.completed_exercises).toEqual(['exercise-1']);
      expect(result.streak).toBe(3);
      expect(result.last_study_date).toBe('2025-01-03');
      expect(result.study_dates).toEqual(['2025-01-01', '2025-01-02', '2025-01-03']);
    });

    it('should not include id, created_at, or updated_at', () => {
      const progress: Progress = {
        lessons: {},
        completedQuizzes: [],
        completedExercises: [],
        streak: 0,
        lastStudyDate: null,
        studyDates: [],
        quizAttempts: [],
      };

      const result = mapProgressToRow('user-123', progress);

      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('created_at');
      expect(result).not.toHaveProperty('updated_at');
    });
  });

  describe('mapRowToNote', () => {
    it('should map database row to Note type', () => {
      const row: UserNoteRow = {
        id: 'note-id',
        user_id: 'user-id',
        lesson_id: 'lesson-1',
        markdown: '# My Note\n\nSome content',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };

      const result = mapRowToNote(row);

      expect(result.lessonId).toBe('lesson-1');
      expect(result.markdown).toBe('# My Note\n\nSome content');
      expect(result.createdAt).toBe('2025-01-01T00:00:00Z');
      expect(result.updatedAt).toBe('2025-01-02T00:00:00Z');
    });
  });

  describe('mapNoteToRow', () => {
    it('should map Note type to database row format', () => {
      const note: Note = {
        lessonId: 'lesson-1',
        markdown: '# My Note',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      };

      const result = mapNoteToRow('user-123', note);

      expect(result.user_id).toBe('user-123');
      expect(result.lesson_id).toBe('lesson-1');
      expect(result.markdown).toBe('# My Note');
      expect(result.updated_at).toBe('2025-01-02T00:00:00Z');
    });

    it('should not include id or created_at', () => {
      const note: Note = {
        lessonId: 'lesson-1',
        markdown: '',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      const result = mapNoteToRow('user-123', note);

      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('created_at');
    });
  });
});
