/**
 * useLessonImprovementIssue Hook
 *
 * Manages GitHub Issue creation for lesson improvements.
 *
 * ## Usage
 * const { create, isLoading, error, createdIssue, canCreate } = useLessonImprovementIssue(row, hint);
 */

import { useState, useCallback, useEffect } from 'react';
import type { LessonRankingRow, LessonImprovementHint } from '@/features/metrics';
import {
  createIssue,
  isDuplicateIssue,
  canCreateIssue,
  type CreatedIssue,
} from '../services/githubIssueService';

interface UseLessonImprovementIssueResult {
  /** Create the issue */
  create: () => Promise<void>;
  /** Whether creation is in progress */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Created issue info (after successful creation) */
  createdIssue: CreatedIssue | null;
  /** Whether issue creation is allowed (meets conditions) */
  canCreate: boolean;
  /** Whether a duplicate issue already exists */
  isDuplicate: boolean;
  /** Whether duplicate check is in progress */
  isCheckingDuplicate: boolean;
  /** Clear error state */
  clearError: () => void;
}

export function useLessonImprovementIssue(
  row: LessonRankingRow,
  hint: LessonImprovementHint | null
): UseLessonImprovementIssueResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdIssue, setCreatedIssue] = useState<CreatedIssue | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Check if issue creation is allowed based on conditions
  const canCreate = canCreateIssue(row.originCount, hint?.type ?? null);

  // Check for duplicate issues on mount and when hint changes
  useEffect(() => {
    if (!canCreate || !hint) {
      setIsDuplicate(false);
      return;
    }

    let cancelled = false;
    const hintType = hint.type; // Capture hint type for async use

    async function checkDuplicate() {
      setIsCheckingDuplicate(true);
      const result = await isDuplicateIssue(row.slug, hintType);
      if (!cancelled) {
        setIsDuplicate(result.data ?? false);
        setIsCheckingDuplicate(false);
      }
    }

    checkDuplicate();

    return () => {
      cancelled = true;
    };
  }, [row.slug, hint, canCreate]);

  const create = useCallback(async () => {
    if (!hint || !canCreate) {
      setError('Issue creation not allowed for this lesson');
      return;
    }

    if (isDuplicate) {
      setError('An issue already exists for this lesson and hint type');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Double-check for duplicates before creating
    const duplicateCheck = await isDuplicateIssue(row.slug, hint.type);
    if (duplicateCheck.error) {
      setError(duplicateCheck.error);
      setIsLoading(false);
      return;
    }

    if (duplicateCheck.data) {
      setIsDuplicate(true);
      setError('An issue already exists for this lesson and hint type');
      setIsLoading(false);
      return;
    }

    // Create the issue
    const result = await createIssue({
      lessonSlug: row.slug,
      lessonTitle: row.title,
      hintType: hint.type,
      hintMessage: hint.message,
      followUpRate: row.followUpRate,
      originCount: row.originCount,
    });

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setCreatedIssue(result.data);
      setIsDuplicate(true); // Mark as duplicate after creation
    }

    setIsLoading(false);
  }, [row, hint, canCreate, isDuplicate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    create,
    isLoading,
    error,
    createdIssue,
    canCreate,
    isDuplicate,
    isCheckingDuplicate,
    clearError,
  };
}
