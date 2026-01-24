/**
 * バッジ一覧表示コンポーネント
 */

import { memo } from 'react';
import { Lock } from 'lucide-react';
import type { BadgeDefinition } from '../types';
import { BadgeIcon } from './BadgeIcon';
import styles from './BadgeGrid.module.css';

interface BadgeWithStatus {
  badge: BadgeDefinition;
  earned: boolean;
  earnedAt?: string;
}

interface BadgeGridProps {
  badges: BadgeWithStatus[];
  title?: string;
  showProgress?: boolean;
  nextAchievable?: Array<{
    badge: BadgeDefinition;
    progress: number;
    target: number;
  }>;
}

export const BadgeGrid = memo(function BadgeGrid({
  badges,
  title = 'バッジコレクション',
  showProgress = false,
  nextAchievable = [],
}: BadgeGridProps) {
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.count}>
          {earnedCount} / {badges.length} 獲得
        </span>
      </div>

      {showProgress && nextAchievable.length > 0 && (
        <div className={styles.nextSection}>
          <h4 className={styles.nextTitle}>もうすぐ獲得</h4>
          <div className={styles.nextBadges}>
            {nextAchievable.map(({ badge, progress, target }) => (
              <div key={badge.id} className={styles.nextBadge}>
                <span className={styles.nextIcon}>
                  <BadgeIcon icon={badge.icon} size={24} />
                </span>
                <div className={styles.nextInfo}>
                  <span className={styles.nextName}>{badge.name}</span>
                  <div className={styles.nextProgress}>
                    <div
                      className={styles.nextProgressBar}
                      style={{ width: `${(progress / target) * 100}%` }}
                    />
                  </div>
                  <span className={styles.nextText}>
                    {progress} / {target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {badges.map(({ badge, earned }) => (
          <div
            key={badge.id}
            className={`${styles.badge} ${earned ? styles.earned : styles.locked}`}
            title={earned ? badge.description : `未獲得: ${badge.description}`}
          >
            <span className={styles.icon}>
              {earned ? <BadgeIcon icon={badge.icon} size={24} /> : <Lock size={24} />}
            </span>
            <span className={styles.name}>{badge.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * コンパクト版バッジ表示（獲得済みのみ）
 */
interface BadgeRowProps {
  earnedBadges: Array<{ badge: BadgeDefinition; earnedAt: string }>;
  maxDisplay?: number;
}

export const BadgeRow = memo(function BadgeRow({ earnedBadges, maxDisplay = 5 }: BadgeRowProps) {
  const displayBadges = earnedBadges.slice(0, maxDisplay);
  const remainingCount = earnedBadges.length - maxDisplay;

  if (earnedBadges.length === 0) {
    return (
      <div className={styles.emptyRow}>
        <span className={styles.emptyText}>まだバッジを獲得していません</span>
      </div>
    );
  }

  return (
    <div className={styles.row}>
      {displayBadges.map(({ badge }) => (
        <span
          key={badge.id}
          className={styles.rowBadge}
          title={`${badge.name}: ${badge.description}`}
        >
          <BadgeIcon icon={badge.icon} size={20} />
        </span>
      ))}
      {remainingCount > 0 && <span className={styles.moreCount}>+{remainingCount}</span>}
    </div>
  );
});
