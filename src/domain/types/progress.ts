import type { QuizAttempt } from './quiz';

export interface LessonProgress {
  lessonId: string;
  openedAt: string;
  completedAt?: string;
}

export interface Progress {
  lessons: Record<string, LessonProgress>;
  completedQuizzes: string[];
  completedExercises: string[];
  streak: number;
  lastStudyDate: string | null;
  studyDates: string[];
  quizAttempts: QuizAttempt[];
}

export const initialProgress: Progress = {
  lessons: {},
  completedQuizzes: [],
  completedExercises: [],
  streak: 0,
  lastStudyDate: null,
  studyDates: [],
  quizAttempts: [],
};
