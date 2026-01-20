import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchProgress,
  saveProgress,
  deleteProgress,
} from '@/features/sync/services/progressService';
import type { Progress } from '@/domain/types';
import * as supabaseModule from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
  isMockMode: false,
}));

describe('progressService', () => {
  const mockUserId = 'user-123';
  const mockProgress: Progress = {
    lessons: {
      'lesson-1': {
        lessonId: 'lesson-1',
        openedAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-02T00:00:00Z',
      },
    },
    completedQuizzes: ['quiz-1'],
    completedExercises: ['exercise-1'],
    streak: 5,
    lastStudyDate: '2024-01-05',
    studyDates: ['2024-01-01', '2024-01-02', '2024-01-03'],
    quizAttempts: [
      {
        quizId: 'quiz-1',
        attemptedAt: '2024-01-01T00:00:00Z',
        score: 80,
        totalQuestions: 10,
        perQuestion: [],
      },
    ],
  };

  const mockProgressRow = {
    id: 'progress-id',
    user_id: mockUserId,
    lessons: mockProgress.lessons,
    completed_quizzes: ['quiz-1'],
    completed_exercises: ['exercise-1'],
    streak: 5,
    last_study_date: '2024-01-05',
    study_dates: ['2024-01-01', '2024-01-02', '2024-01-03'],
    quiz_attempts: mockProgress.quizAttempts,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
  };

  let mockFrom: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockUpsert: ReturnType<typeof vi.fn>;
  let mockDelete: ReturnType<typeof vi.fn>;
  let mockMaybeSingle: ReturnType<typeof vi.fn>;
  let mockSingle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockMaybeSingle = vi.fn();
    mockSingle = vi.fn();
    mockDelete = vi.fn();
    mockUpsert = vi.fn();
    mockEq = vi.fn();
    mockSelect = vi.fn();
    mockFrom = vi.fn();

    (supabaseModule.supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
  });

  describe('fetchProgress', () => {
    it('should fetch and map user progress', async () => {
      mockMaybeSingle.mockResolvedValue({ data: mockProgressRow, error: null });
      mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await fetchProgress(mockUserId);

      expect(mockFrom).toHaveBeenCalledWith('user_progress');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockProgress);
    });

    it('should return null when progress does not exist', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
      mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await fetchProgress(mockUserId);

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('should handle database error', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'Query failed' } });
      mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await fetchProgress(mockUserId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Query failed');
    });

    it('should handle exception', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await fetchProgress(mockUserId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Network error');
    });

    it('should handle unknown error type', async () => {
      mockFrom.mockImplementation(() => {
        throw 'String error';
      });

      const result = await fetchProgress(mockUserId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Unknown error occurred');
    });
  });

  describe('saveProgress', () => {
    it('should save and return progress', async () => {
      mockSingle.mockResolvedValue({ data: mockProgressRow, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockUpsert.mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const result = await saveProgress(mockUserId, mockProgress);

      expect(mockFrom).toHaveBeenCalledWith('user_progress');
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          user_id: mockUserId,
          lessons: mockProgress.lessons,
          completed_quizzes: ['quiz-1'],
          completed_exercises: ['exercise-1'],
          streak: 5,
          last_study_date: '2024-01-05',
          study_dates: ['2024-01-01', '2024-01-02', '2024-01-03'],
          quiz_attempts: mockProgress.quizAttempts,
        },
        { onConflict: 'user_id' }
      );
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockProgress);
    });

    it('should handle upsert error', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Upsert failed' } });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockUpsert.mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const result = await saveProgress(mockUserId, mockProgress);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Upsert failed');
    });

    it('should handle exception during save', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Connection timeout');
      });

      const result = await saveProgress(mockUserId, mockProgress);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Connection timeout');
    });

    it('should correctly map progress with empty arrays', async () => {
      const emptyProgress: Progress = {
        lessons: {},
        completedQuizzes: [],
        completedExercises: [],
        streak: 0,
        lastStudyDate: null,
        studyDates: [],
        quizAttempts: [],
      };

      const emptyRow = {
        id: 'progress-id',
        user_id: mockUserId,
        lessons: {},
        completed_quizzes: [],
        completed_exercises: [],
        streak: 0,
        last_study_date: null,
        study_dates: [],
        quiz_attempts: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({ data: emptyRow, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockUpsert.mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const result = await saveProgress(mockUserId, emptyProgress);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(emptyProgress);
    });

    it('should correctly map progress with multiple lessons', async () => {
      const multiProgress: Progress = {
        lessons: {
          'lesson-1': {
            lessonId: 'lesson-1',
            openedAt: '2024-01-01T00:00:00Z',
            completedAt: '2024-01-02T00:00:00Z',
          },
          'lesson-2': {
            lessonId: 'lesson-2',
            openedAt: '2024-01-03T00:00:00Z',
          },
          'lesson-3': {
            lessonId: 'lesson-3',
            openedAt: '2024-01-04T00:00:00Z',
            completedAt: '2024-01-05T00:00:00Z',
          },
        },
        completedQuizzes: ['quiz-1', 'quiz-2'],
        completedExercises: ['exercise-1', 'exercise-2', 'exercise-3'],
        streak: 10,
        lastStudyDate: '2024-01-10',
        studyDates: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'],
        quizAttempts: [],
      };

      const multiRow = {
        id: 'progress-id',
        user_id: mockUserId,
        lessons: multiProgress.lessons,
        completed_quizzes: multiProgress.completedQuizzes,
        completed_exercises: multiProgress.completedExercises,
        streak: 10,
        last_study_date: '2024-01-10',
        study_dates: multiProgress.studyDates,
        quiz_attempts: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
      };

      mockSingle.mockResolvedValue({ data: multiRow, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockUpsert.mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const result = await saveProgress(mockUserId, multiProgress);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(multiProgress);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          lessons: multiProgress.lessons,
          completed_quizzes: ['quiz-1', 'quiz-2'],
          completed_exercises: ['exercise-1', 'exercise-2', 'exercise-3'],
        }),
        { onConflict: 'user_id' }
      );
    });
  });

  describe('deleteProgress', () => {
    it('should delete user progress', async () => {
      mockEq.mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await deleteProgress(mockUserId);

      expect(mockFrom).toHaveBeenCalledWith('user_progress');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(result.error).toBeNull();
    });

    it('should handle delete error', async () => {
      mockEq.mockResolvedValue({ error: { message: 'Delete failed' } });
      mockDelete.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await deleteProgress(mockUserId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Delete failed');
    });

    it('should handle exception during delete', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await deleteProgress(mockUserId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('mock mode behavior', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('should return null in mock mode for fetchProgress', async () => {
      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: vi.fn() },
        isMockMode: true,
      }));

      const { fetchProgress: mockFetchProgress } =
        await import('@/features/sync/services/progressService');

      const result = await mockFetchProgress(mockUserId);

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('should return success in mock mode for saveProgress', async () => {
      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: vi.fn() },
        isMockMode: true,
      }));

      const { saveProgress: mockSaveProgress } =
        await import('@/features/sync/services/progressService');

      const result = await mockSaveProgress(mockUserId, mockProgress);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockProgress);
    });

    it('should return success in mock mode for deleteProgress', async () => {
      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: vi.fn() },
        isMockMode: true,
      }));

      const { deleteProgress: mockDeleteProgress } =
        await import('@/features/sync/services/progressService');

      const result = await mockDeleteProgress(mockUserId);

      expect(result.error).toBeNull();
    });
  });
});
