import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks';
import type { Progress, QuizAttempt } from '@/domain/types';
import { initialProgress } from '@/domain/types';

interface ProgressContextType {
  progress: Progress;
  markLessonOpened: (lessonId: string) => void;
  completeLesson: (lessonId: string) => void;
  completeQuiz: (quizId: string) => void;
  completeExercise: (exerciseId: string) => void;
  recordQuizAttempt: (attempt: QuizAttempt) => void;
  isLessonCompleted: (lessonId: string) => boolean;
  isLessonOpened: (lessonId: string) => boolean;
  getCompletedLessonsCount: () => number;
  getTotalLessonsOpened: () => number;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function calculateStreak(studyDates: string[], lastStudyDate: string | null): number {
  if (!lastStudyDate || studyDates.length === 0) return 0;

  const today = getTodayDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];

  if (lastStudyDate !== today && lastStudyDate !== yesterdayString) {
    return 0;
  }

  const sortedDates = [...studyDates].sort().reverse();
  let streak = 0;
  let expectedDate = new Date(today);

  if (sortedDates[0] !== today) {
    expectedDate.setDate(expectedDate.getDate() - 1);
  }

  for (const dateStr of sortedDates) {
    const expectedDateStr = expectedDate.toISOString().split('T')[0];
    if (dateStr === expectedDateStr) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (dateStr < expectedDateStr) {
      break;
    }
  }

  return streak;
}

interface ProgressProviderProps {
  children: ReactNode;
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  const [progress, setProgress] = useLocalStorage<Progress>(
    'react-learning-progress',
    initialProgress
  );

  const recordStudyActivity = useCallback(
    (currentProgress: Progress): Progress => {
      const today = getTodayDateString();
      const newStudyDates = currentProgress.studyDates.includes(today)
        ? currentProgress.studyDates
        : [...currentProgress.studyDates, today];

      const newStreak = calculateStreak(newStudyDates, today);

      return {
        ...currentProgress,
        lastStudyDate: today,
        studyDates: newStudyDates,
        streak: newStreak,
      };
    },
    []
  );

  const markLessonOpened = useCallback(
    (lessonId: string) => {
      setProgress((prev) => {
        if (prev.lessons[lessonId]?.openedAt) {
          return recordStudyActivity(prev);
        }

        const updated = {
          ...prev,
          lessons: {
            ...prev.lessons,
            [lessonId]: {
              lessonId,
              openedAt: new Date().toISOString(),
            },
          },
        };

        return recordStudyActivity(updated);
      });
    },
    [setProgress, recordStudyActivity]
  );

  const completeLesson = useCallback(
    (lessonId: string) => {
      setProgress((prev) => {
        const existingLesson = prev.lessons[lessonId];
        const updated = {
          ...prev,
          lessons: {
            ...prev.lessons,
            [lessonId]: {
              lessonId,
              openedAt: existingLesson?.openedAt || new Date().toISOString(),
              completedAt: new Date().toISOString(),
            },
          },
        };

        return recordStudyActivity(updated);
      });
    },
    [setProgress, recordStudyActivity]
  );

  const completeQuiz = useCallback(
    (quizId: string) => {
      setProgress((prev) => {
        if (prev.completedQuizzes.includes(quizId)) {
          return recordStudyActivity(prev);
        }

        const updated = {
          ...prev,
          completedQuizzes: [...prev.completedQuizzes, quizId],
        };

        return recordStudyActivity(updated);
      });
    },
    [setProgress, recordStudyActivity]
  );

  const completeExercise = useCallback(
    (exerciseId: string) => {
      setProgress((prev) => {
        if (prev.completedExercises.includes(exerciseId)) {
          return recordStudyActivity(prev);
        }

        const updated = {
          ...prev,
          completedExercises: [...prev.completedExercises, exerciseId],
        };

        return recordStudyActivity(updated);
      });
    },
    [setProgress, recordStudyActivity]
  );

  const recordQuizAttempt = useCallback(
    (attempt: QuizAttempt) => {
      setProgress((prev) => {
        const updated = {
          ...prev,
          quizAttempts: [...prev.quizAttempts, attempt],
        };

        return recordStudyActivity(updated);
      });
    },
    [setProgress, recordStudyActivity]
  );

  const isLessonCompleted = useCallback(
    (lessonId: string): boolean => {
      return !!progress.lessons[lessonId]?.completedAt;
    },
    [progress]
  );

  const isLessonOpened = useCallback(
    (lessonId: string): boolean => {
      return !!progress.lessons[lessonId]?.openedAt;
    },
    [progress]
  );

  const getCompletedLessonsCount = useCallback((): number => {
    return Object.values(progress.lessons).filter((l) => l.completedAt).length;
  }, [progress]);

  const getTotalLessonsOpened = useCallback((): number => {
    return Object.keys(progress.lessons).length;
  }, [progress]);

  const resetProgress = useCallback(() => {
    setProgress(initialProgress);
  }, [setProgress]);

  return (
    <ProgressContext.Provider
      value={{
        progress,
        markLessonOpened,
        completeLesson,
        completeQuiz,
        completeExercise,
        recordQuizAttempt,
        isLessonCompleted,
        isLessonOpened,
        getCompletedLessonsCount,
        getTotalLessonsOpened,
        resetProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextType {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
