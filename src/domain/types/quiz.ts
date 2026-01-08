export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
  tags?: string[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  relatedLessonIds: string[];
  timeLimitSec?: number;
}

export interface QuizAnswer {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
}

export interface QuizResult {
  quizId: string;
  answers: QuizAnswer[];
  score: number;
  totalQuestions: number;
  completedAt: string;
}

// Session schema version for backward compatibility
export const QUIZ_SESSION_VERSION = 1;

export interface QuizSession {
  version: number;
  quizId: string;
  currentIndex: number;
  answers: Record<string, number | null>;
  skippedQuestionIds: string[];
  hintUsedByQuestionId: Record<string, boolean>;
  startedAt: string;
  lastUpdatedAt: string;
  timeRemainingSec: number | null;
  isFinished: boolean;
}

export interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  isSkipped: boolean;
  hintUsed: boolean;
  selectedChoiceIndex: number | null;
}

export interface QuizAttempt {
  quizId: string;
  attemptedAt: string;
  score: number;
  totalQuestions: number;
  perQuestion: QuestionResult[];
  timeTakenSec?: number;
}
