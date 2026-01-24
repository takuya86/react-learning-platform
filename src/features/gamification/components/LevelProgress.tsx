/**
 * レベル進捗表示コンポーネント
 */

import { memo } from 'react';
import { Flame } from 'lucide-react';
import styles from './LevelProgress.module.css';

interface LevelProgressProps {
  currentLevel: number;
  levelTitle: string;
  totalXP: number;
  levelProgress: number;
  xpToNextLevel: number | null;
  streakBonusDescription: string | null;
}

export const LevelProgress = memo(function LevelProgress({
  currentLevel,
  levelTitle,
  totalXP,
  levelProgress,
  xpToNextLevel,
  streakBonusDescription,
}: LevelProgressProps) {
  const isMaxLevel = xpToNextLevel === null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.levelBadge}>
          <span className={styles.levelNumber}>Lv.{currentLevel}</span>
          <span className={styles.levelTitle}>{levelTitle}</span>
        </div>
        <div className={styles.xpInfo}>
          <span className={styles.totalXP}>{totalXP.toLocaleString()} XP</span>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${levelProgress}%` }}
            role="progressbar"
            aria-valuenow={levelProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`レベル進捗 ${levelProgress}%`}
          />
        </div>
        <div className={styles.progressText}>
          {isMaxLevel ? (
            <span className={styles.maxLevel}>最高レベル達成!</span>
          ) : (
            <span>次のレベルまで {xpToNextLevel?.toLocaleString()} XP</span>
          )}
        </div>
      </div>

      {streakBonusDescription && (
        <div className={styles.bonusInfo}>
          <span className={styles.bonusIcon}>
            <Flame size={16} />
          </span>
          <span className={styles.bonusText}>{streakBonusDescription}</span>
        </div>
      )}
    </div>
  );
});
