import type { QuizSession } from '@/domain/types';

const SESSION_KEY_PREFIX = 'quiz_session:';

export function getSessionKey(quizId: string): string {
  return `${SESSION_KEY_PREFIX}${quizId}`;
}

export function saveQuizSession(session: QuizSession): void {
  try {
    const key = getSessionKey(session.quizId);
    localStorage.setItem(key, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save quiz session:', error);
  }
}

export function loadQuizSession(quizId: string): QuizSession | null {
  try {
    const key = getSessionKey(quizId);
    const data = localStorage.getItem(key);
    if (!data) return null;

    const session = JSON.parse(data) as QuizSession;

    if (session.isFinished) {
      deleteQuizSession(quizId);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to load quiz session:', error);
    return null;
  }
}

export function deleteQuizSession(quizId: string): void {
  try {
    const key = getSessionKey(quizId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to delete quiz session:', error);
  }
}

export function hasQuizSession(quizId: string): boolean {
  const session = loadQuizSession(quizId);
  return session !== null && !session.isFinished;
}
