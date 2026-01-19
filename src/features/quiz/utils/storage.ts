import type { QuizSession } from '@/domain/types';
import { QUIZ_SESSION_VERSION } from '@/domain/types';
import { logger } from '@/lib/logger';
import { getQuizSessionKey } from '@/lib/constants/storageKeys';

export function getSessionKey(quizId: string): string {
  return getQuizSessionKey(quizId);
}

/**
 * Validate and normalize a session object.
 * Handles backward compatibility with older sessions (no version field).
 * Returns null if session is invalid or corrupted.
 */
function parseSession(data: unknown, quizId: string): QuizSession | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const raw = data as Record<string, unknown>;

  // Required fields validation
  if (typeof raw.quizId !== 'string' || raw.quizId !== quizId) {
    return null;
  }

  // Normalize with defaults for backward compatibility
  const session: QuizSession = {
    version: typeof raw.version === 'number' ? raw.version : QUIZ_SESSION_VERSION,
    quizId: raw.quizId,
    currentIndex:
      typeof raw.currentIndex === 'number' && raw.currentIndex >= 0 ? raw.currentIndex : 0,
    answers: isValidAnswers(raw.answers) ? raw.answers : {},
    skippedQuestionIds: Array.isArray(raw.skippedQuestionIds)
      ? raw.skippedQuestionIds.filter((id): id is string => typeof id === 'string')
      : [],
    hintUsedByQuestionId: isValidHintMap(raw.hintUsedByQuestionId) ? raw.hintUsedByQuestionId : {},
    startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : new Date().toISOString(),
    lastUpdatedAt:
      typeof raw.lastUpdatedAt === 'string' ? raw.lastUpdatedAt : new Date().toISOString(),
    timeRemainingSec:
      typeof raw.timeRemainingSec === 'number' ? Math.max(0, raw.timeRemainingSec) : null,
    isFinished: typeof raw.isFinished === 'boolean' ? raw.isFinished : false,
  };

  return session;
}

function isValidAnswers(value: unknown): value is Record<string, number | null> {
  if (!value || typeof value !== 'object') return false;
  const entries = Object.entries(value as Record<string, unknown>);
  return entries.every(([, v]) => v === null || typeof v === 'number');
}

function isValidHintMap(value: unknown): value is Record<string, boolean> {
  if (!value || typeof value !== 'object') return false;
  const entries = Object.entries(value as Record<string, unknown>);
  return entries.every(([, v]) => typeof v === 'boolean');
}

export function saveQuizSession(session: QuizSession): void {
  try {
    const key = getSessionKey(session.quizId);
    localStorage.setItem(key, JSON.stringify(session));
  } catch (error) {
    logger.error('Failed to save quiz session', {
      category: 'storage',
      context: { quizId: session.quizId, error },
    });
  }
}

export function loadQuizSession(quizId: string): QuizSession | null {
  try {
    const key = getSessionKey(quizId);
    const data = localStorage.getItem(key);
    if (!data) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      // JSON parse failed - delete corrupted data
      logger.warn('Corrupted quiz session data, deleting', {
        category: 'storage',
        context: { quizId },
      });
      deleteQuizSession(quizId);
      return null;
    }

    const session = parseSession(parsed, quizId);
    if (!session) {
      logger.warn('Invalid quiz session schema, deleting', {
        category: 'storage',
        context: { quizId },
      });
      deleteQuizSession(quizId);
      return null;
    }

    // Don't return finished sessions
    if (session.isFinished) {
      deleteQuizSession(quizId);
      return null;
    }

    return session;
  } catch (error) {
    logger.error('Failed to load quiz session', {
      category: 'storage',
      context: { quizId, error },
    });
    return null;
  }
}

export function deleteQuizSession(quizId: string): void {
  try {
    const key = getSessionKey(quizId);
    localStorage.removeItem(key);
  } catch (error) {
    logger.error('Failed to delete quiz session', {
      category: 'storage',
      context: { quizId, error },
    });
  }
}

export function hasQuizSession(quizId: string): boolean {
  const session = loadQuizSession(quizId);
  return session !== null && !session.isFinished;
}
