import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { useGitHubWorkflow } from '../hooks/useGitHubWorkflow';
import styles from './GeneratePRButton.module.css';

interface GeneratePRButtonProps {
  slugs: string[];
  maxLessons?: number;
  pendingCount: number;
}

export function GeneratePRButton({ slugs, maxLessons = 3, pendingCount }: GeneratePRButtonProps) {
  const {
    trigger,
    checkExistingPR,
    isTriggering,
    isChecking,
    existingPR,
    error,
    success,
    clearError,
    clearSuccess,
  } = useGitHubWorkflow();

  const [showConfirm, setShowConfirm] = useState(false);

  // Check for existing PR on mount
  useEffect(() => {
    checkExistingPR();
  }, [checkExistingPR]);

  const handleClick = async () => {
    // If there's an existing PR, show confirmation dialog
    if (existingPR?.exists) {
      setShowConfirm(true);
      return;
    }

    await trigger(slugs, maxLessons);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    await trigger(slugs, maxLessons);
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  const isDisabled = pendingCount === 0 || isTriggering || isChecking;

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        clearSuccess();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, clearSuccess]);

  return (
    <div className={styles.container}>
      <Button onClick={handleClick} disabled={isDisabled} variant={success ? 'outline' : 'primary'}>
        {isTriggering
          ? 'トリガー中...'
          : isChecking
            ? '確認中...'
            : success
              ? 'ワークフロー開始済み'
              : 'Generate Lessons PR'}
      </Button>

      {pendingCount === 0 && <p className={styles.hint}>未生成のレッスンがありません</p>}

      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={clearError} className={styles.dismissButton}>
            ×
          </button>
        </div>
      )}

      {success && (
        <p className={styles.success}>
          GitHub Actions ワークフローを開始しました。PRが作成されるまで数分お待ちください。
        </p>
      )}

      {existingPR?.exists && !showConfirm && !success && (
        <p className={styles.warning}>
          既存のレッスンPRがあります:{' '}
          <a href={existingPR.url} target="_blank" rel="noopener noreferrer">
            #{existingPR.number} {existingPR.title}
          </a>
        </p>
      )}

      {showConfirm && (
        <div className={styles.confirmDialog}>
          <p>
            既存のレッスンPR (
            <a href={existingPR?.url} target="_blank" rel="noopener noreferrer">
              #{existingPR?.number}
            </a>
            ) が存在します。新しいワークフローを実行しますか？
          </p>
          <div className={styles.confirmButtons}>
            <Button variant="primary" onClick={handleConfirm}>
              実行する
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              キャンセル
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
