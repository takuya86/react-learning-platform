/**
 * ダッシュボード用ゲーミフィケーションカード
 * レベル進捗とバッジを1つのカードにまとめて表示
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import { LevelProgress } from './LevelProgress';
import { BadgeRow } from './BadgeGrid';
import type { UseGamificationReturn } from '../hooks/useGamification';
import styles from './GamificationCard.module.css';

interface GamificationCardProps {
  gamification: UseGamificationReturn;
}

export const GamificationCard = memo(function GamificationCard({
  gamification,
}: GamificationCardProps) {
  const {
    currentLevel,
    levelTitle,
    totalXP,
    levelProgress,
    xpToNextLevel,
    streakBonusDescription,
    earnedBadgesWithDefinitions,
    nextAchievableBadges,
  } = gamification;

  return (
    <div className={styles.container}>
      <LevelProgress
        currentLevel={currentLevel}
        levelTitle={levelTitle}
        totalXP={totalXP}
        levelProgress={levelProgress}
        xpToNextLevel={xpToNextLevel}
        streakBonusDescription={streakBonusDescription}
      />

      <div className={styles.badgeSection}>
        <div className={styles.badgeHeader}>
          <h3 className={styles.badgeTitle}>獲得バッジ</h3>
          <Link to="/progress" className={styles.viewAll}>
            すべて見る
          </Link>
        </div>
        <BadgeRow earnedBadges={earnedBadgesWithDefinitions} maxDisplay={5} />

        {nextAchievableBadges.length > 0 && (
          <div className={styles.nextBadge}>
            <span className={styles.nextLabel}>次のバッジ:</span>
            <span className={styles.nextIcon}>{nextAchievableBadges[0].badge.icon}</span>
            <span className={styles.nextName}>{nextAchievableBadges[0].badge.name}</span>
            <span className={styles.nextProgress}>
              ({nextAchievableBadges[0].progress}/{nextAchievableBadges[0].target})
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
