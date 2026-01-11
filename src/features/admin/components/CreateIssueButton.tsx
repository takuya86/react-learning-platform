/**
 * CreateIssueButton Component
 *
 * Button to create a GitHub Issue for lesson improvement.
 * Handles loading state, duplicate detection, and error display.
 */

import { useLessonImprovementIssue } from '../hooks/useLessonImprovementIssue';
import type { LessonRankingRow, LessonImprovementHint } from '@/features/metrics';
import styles from './CreateIssueButton.module.css';

interface CreateIssueButtonProps {
  row: LessonRankingRow;
  hint: LessonImprovementHint | null;
}

export function CreateIssueButton({ row, hint }: CreateIssueButtonProps) {
  const { create, isLoading, error, createdIssue, canCreate, isDuplicate, isCheckingDuplicate } =
    useLessonImprovementIssue(row, hint);

  // If hint is null or LOW_SAMPLE, don't show button
  if (!hint || hint.type === 'LOW_SAMPLE') {
    return <span className={styles.noAction}>-</span>;
  }

  // If issue already exists
  if (createdIssue) {
    return (
      <a
        href={createdIssue.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.issueLink}
        data-testid="issue-link"
      >
        Issue #{createdIssue.number}
      </a>
    );
  }

  // If duplicate detected
  if (isDuplicate) {
    return (
      <span className={styles.issueDone} data-testid="issue-exists">
        Issue済み
      </span>
    );
  }

  // If checking for duplicates
  if (isCheckingDuplicate) {
    return <span className={styles.checking}>確認中...</span>;
  }

  // If cannot create (originCount < 5)
  if (!canCreate) {
    return <span className={styles.noAction}>-</span>;
  }

  // Show create button
  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.createButton}
        onClick={create}
        disabled={isLoading}
        data-testid="create-issue-button"
      >
        {isLoading ? '作成中...' : 'Issueを作成'}
      </button>
      {error && (
        <span className={styles.error} title={error}>
          エラー
        </span>
      )}
    </div>
  );
}
