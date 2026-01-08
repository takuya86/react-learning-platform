import styles from './QuizProgress.module.css';

interface QuizProgressProps {
  current: number;
  total: number;
  skippedCount: number;
  answeredCount: number;
}

export function QuizProgress({
  current,
  total,
  skippedCount,
  answeredCount,
}: QuizProgressProps) {
  const percentage = ((current + 1) / total) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.info}>
        <span className={styles.current}>
          問題 {current + 1} / {total}
        </span>
        <div className={styles.stats}>
          <span className={styles.answered}>回答済み: {answeredCount}</span>
          {skippedCount > 0 && (
            <span className={styles.skipped}>スキップ: {skippedCount}</span>
          )}
        </div>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
