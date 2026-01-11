import type { Progress, Note, LessonProgress, QuizAttempt } from '@/domain/types';

/**
 * Merge two Progress objects, preferring more complete data
 * Strategy:
 * - lessons: union, prefer completedAt over just openedAt
 * - completedQuizzes/completedExercises: union of arrays
 * - streak: take the higher value
 * - lastStudyDate: take the more recent date
 * - studyDates: union of arrays
 * - quizAttempts: union, dedupe by quizId+attemptedAt
 */
export function mergeProgress(local: Progress, remote: Progress): Progress {
  // Merge lessons (union, prefer completed status)
  const mergedLessons: Record<string, LessonProgress> = { ...local.lessons };
  for (const [lessonId, remoteLesson] of Object.entries(remote.lessons)) {
    const localLesson = mergedLessons[lessonId];

    if (!localLesson) {
      // Remote has lesson that local doesn't - use remote
      mergedLessons[lessonId] = remoteLesson;
    } else if (!localLesson.completedAt && remoteLesson.completedAt) {
      // Remote is completed, local isn't - use remote
      mergedLessons[lessonId] = remoteLesson;
    } else if (localLesson.completedAt && remoteLesson.completedAt) {
      // Both completed - use the one completed first (more accurate)
      if (new Date(remoteLesson.completedAt) < new Date(localLesson.completedAt)) {
        mergedLessons[lessonId] = remoteLesson;
      }
    }
    // If local is completed and remote isn't, keep local (already in mergedLessons)
  }

  // Merge string arrays (union)
  const mergedCompletedQuizzes = [
    ...new Set([...local.completedQuizzes, ...remote.completedQuizzes]),
  ];
  const mergedCompletedExercises = [
    ...new Set([...local.completedExercises, ...remote.completedExercises]),
  ];
  const mergedStudyDates = [...new Set([...local.studyDates, ...remote.studyDates])].sort();

  // Merge streak - take higher value
  const mergedStreak = Math.max(local.streak, remote.streak);

  // Merge lastStudyDate - take more recent
  let mergedLastStudyDate: string | null = null;
  if (local.lastStudyDate && remote.lastStudyDate) {
    mergedLastStudyDate =
      new Date(local.lastStudyDate) > new Date(remote.lastStudyDate)
        ? local.lastStudyDate
        : remote.lastStudyDate;
  } else {
    mergedLastStudyDate = local.lastStudyDate || remote.lastStudyDate;
  }

  // Merge quiz attempts (union, dedupe by quizId+attemptedAt)
  const mergedQuizAttempts = mergeQuizAttempts(local.quizAttempts, remote.quizAttempts);

  return {
    lessons: mergedLessons,
    completedQuizzes: mergedCompletedQuizzes,
    completedExercises: mergedCompletedExercises,
    streak: mergedStreak,
    lastStudyDate: mergedLastStudyDate,
    studyDates: mergedStudyDates,
    quizAttempts: mergedQuizAttempts,
  };
}

/**
 * Merge quiz attempts, deduplicating by quizId + attemptedAt
 */
function mergeQuizAttempts(local: QuizAttempt[], remote: QuizAttempt[]): QuizAttempt[] {
  const attemptMap = new Map<string, QuizAttempt>();

  // Add local attempts
  for (const attempt of local) {
    const key = `${attempt.quizId}:${attempt.attemptedAt}`;
    attemptMap.set(key, attempt);
  }

  // Add remote attempts (won't overwrite if key exists)
  for (const attempt of remote) {
    const key = `${attempt.quizId}:${attempt.attemptedAt}`;
    if (!attemptMap.has(key)) {
      attemptMap.set(key, attempt);
    }
  }

  // Sort by attemptedAt
  return Array.from(attemptMap.values()).sort(
    (a, b) => new Date(a.attemptedAt).getTime() - new Date(b.attemptedAt).getTime()
  );
}

/**
 * Merge notes from local and remote sources
 * Strategy: last-write-wins per lessonId based on updatedAt
 */
export function mergeNotes(
  local: Record<string, Note>,
  remote: Record<string, Note>
): Record<string, Note> {
  const merged: Record<string, Note> = {};

  // Get all unique lesson IDs
  const allLessonIds = new Set([...Object.keys(local), ...Object.keys(remote)]);

  for (const lessonId of allLessonIds) {
    const localNote = local[lessonId];
    const remoteNote = remote[lessonId];

    if (localNote && remoteNote) {
      // Both exist - pick the more recent one
      const localTime = new Date(localNote.updatedAt).getTime();
      const remoteTime = new Date(remoteNote.updatedAt).getTime();
      merged[lessonId] = localTime >= remoteTime ? localNote : remoteNote;
    } else if (localNote) {
      // Only local exists
      merged[lessonId] = localNote;
    } else if (remoteNote) {
      // Only remote exists
      merged[lessonId] = remoteNote;
    }
  }

  return merged;
}

/**
 * Check if local progress has meaningful changes compared to remote
 * Used to decide whether to push to server
 */
export function hasProgressChanges(local: Progress, remote: Progress | null): boolean {
  if (!remote) return true;

  // Quick checks for obvious changes
  if (
    local.completedQuizzes.length !== remote.completedQuizzes.length ||
    local.completedExercises.length !== remote.completedExercises.length ||
    Object.keys(local.lessons).length !== Object.keys(remote.lessons).length ||
    local.quizAttempts.length !== remote.quizAttempts.length
  ) {
    return true;
  }

  // Check for new completed lessons
  for (const [lessonId, lesson] of Object.entries(local.lessons)) {
    const remoteLesson = remote.lessons[lessonId];
    if (!remoteLesson) return true;
    if (lesson.completedAt && !remoteLesson.completedAt) return true;
  }

  return false;
}

/**
 * Check if local notes have meaningful changes compared to remote
 */
export function hasNotesChanges(
  local: Record<string, Note>,
  remote: Record<string, Note> | null
): boolean {
  if (!remote) return Object.keys(local).length > 0;

  // Check for different number of notes
  if (Object.keys(local).length !== Object.keys(remote).length) {
    return true;
  }

  // Check for changes in individual notes
  for (const [lessonId, localNote] of Object.entries(local)) {
    const remoteNote = remote[lessonId];
    if (!remoteNote) return true;

    if (localNote.markdown !== remoteNote.markdown) {
      return true;
    }
  }

  return false;
}
