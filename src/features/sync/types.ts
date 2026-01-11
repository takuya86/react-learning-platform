import type { Progress, Note, QuizAttempt, LessonProgress } from '@/domain/types';

/**
 * Sync status states
 */
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

/**
 * Sync state for a single data type
 */
export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
}

/**
 * Combined sync state for progress and notes
 */
export interface SyncContextState {
  progress: SyncState;
  notes: SyncState;
  isOnline: boolean;
}

/**
 * Supabase user_progress row type (matches DB schema)
 */
export interface UserProgressRow {
  id: string;
  user_id: string;
  lessons: Record<string, LessonProgress>;
  completed_quizzes: string[];
  completed_exercises: string[];
  streak: number;
  last_study_date: string | null;
  study_dates: string[];
  quiz_attempts: QuizAttempt[];
  updated_at: string;
  created_at: string;
}

/**
 * Supabase user_notes row type (matches DB schema)
 */
export interface UserNoteRow {
  id: string;
  user_id: string;
  lesson_id: string;
  markdown: string;
  created_at: string;
  updated_at: string;
}

/**
 * Map DB row to local Progress type
 */
export function mapRowToProgress(row: UserProgressRow): Progress {
  return {
    lessons: row.lessons,
    completedQuizzes: row.completed_quizzes,
    completedExercises: row.completed_exercises,
    streak: row.streak,
    lastStudyDate: row.last_study_date,
    studyDates: row.study_dates,
    quizAttempts: row.quiz_attempts,
  };
}

/**
 * Map local Progress type to DB row format (without id and timestamps)
 */
export function mapProgressToRow(
  userId: string,
  progress: Progress
): Omit<UserProgressRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    lessons: progress.lessons,
    completed_quizzes: progress.completedQuizzes,
    completed_exercises: progress.completedExercises,
    streak: progress.streak,
    last_study_date: progress.lastStudyDate,
    study_dates: progress.studyDates,
    quiz_attempts: progress.quizAttempts,
  };
}

/**
 * Map DB row to local Note type
 */
export function mapRowToNote(row: UserNoteRow): Note {
  return {
    lessonId: row.lesson_id,
    markdown: row.markdown,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map local Note type to DB row format (without id and created_at)
 */
export function mapNoteToRow(userId: string, note: Note): Omit<UserNoteRow, 'id' | 'created_at'> {
  return {
    user_id: userId,
    lesson_id: note.lessonId,
    markdown: note.markdown,
    updated_at: note.updatedAt,
  };
}

/**
 * Initial sync state
 */
export const initialSyncState: SyncState = {
  status: 'idle',
  lastSyncedAt: null,
  error: null,
};

/**
 * Initial combined sync context state
 */
export const initialSyncContextState: SyncContextState = {
  progress: initialSyncState,
  notes: initialSyncState,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
};
