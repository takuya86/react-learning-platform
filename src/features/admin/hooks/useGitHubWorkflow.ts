import { useState, useCallback } from 'react';
import { triggerLessonWorkflow, checkExistingLessonPR } from '../services/githubService';

interface ExistingPR {
  exists: boolean;
  url?: string;
  number?: number;
  title?: string;
}

interface UseGitHubWorkflowReturn {
  trigger: (slugs: string[], maxLessons: number) => Promise<boolean>;
  checkExistingPR: () => Promise<void>;
  isTriggering: boolean;
  isChecking: boolean;
  existingPR: ExistingPR | null;
  error: string | null;
  success: boolean;
  clearError: () => void;
  clearSuccess: () => void;
}

export function useGitHubWorkflow(): UseGitHubWorkflowReturn {
  const [isTriggering, setIsTriggering] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [existingPR, setExistingPR] = useState<ExistingPR | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const checkExisting = useCallback(async () => {
    setIsChecking(true);
    setError(null);

    try {
      const result = await checkExistingLessonPR();

      if (result.error) {
        setError(result.error);
        setExistingPR(null);
      } else if (result.data) {
        setExistingPR(result.data);
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  const trigger = useCallback(async (slugs: string[], maxLessons: number): Promise<boolean> => {
    setIsTriggering(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await triggerLessonWorkflow(slugs, maxLessons);

      if (result.error) {
        setError(result.error);
        return false;
      }

      setSuccess(true);
      return true;
    } finally {
      setIsTriggering(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccess(false);
  }, []);

  return {
    trigger,
    checkExistingPR: checkExisting,
    isTriggering,
    isChecking,
    existingPR,
    error,
    success,
    clearError,
    clearSuccess,
  };
}
