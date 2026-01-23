/**
 * デイリーチャレンジカード
 * 日替わりチャレンジと達成状況を表示
 */

import { memo } from 'react';
import { Check, Trophy } from 'lucide-react';
import type { ChallengeWithStatus } from '../hooks/useDailyChallenge';
import styles from './DailyChallengeCard.module.css';

interface DailyChallengeCardProps {
  challenges: ChallengeWithStatus[];
  progress: number;
  allCompleted: boolean;
  bonusXPAwarded: boolean;
  totalXP: number;
}

export const DailyChallengeCard = memo(function DailyChallengeCard({
  challenges,
  progress,
  allCompleted,
  bonusXPAwarded,
  totalXP,
}: DailyChallengeCardProps) {
  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>
            <span className={styles.titleIcon}>🎯</span>
            今日のチャレンジ
          </h3>
          <div className={styles.totalXP}>
            <Trophy size={14} />
            <span>{totalXP} XP</span>
          </div>
        </div>
        <p className={styles.subtitle}>
          {allCompleted
            ? '全達成！ボーナスXPを獲得しました！'
            : `${completedCount} / ${challenges.length} 達成`}
        </p>
      </div>

      <div
        className={styles.progressBar}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`チャレンジ進捗 ${progress}パーセント`}
      >
        <div
          className={`${styles.progressFill} ${allCompleted ? styles.progressComplete : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={styles.challengeList}>
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className={`${styles.challengeItem} ${challenge.completed ? styles.completed : ''}`}
          >
            <div className={styles.challengeIcon}>
              {challenge.completed ? (
                <div className={styles.checkmark}>
                  <Check size={16} />
                </div>
              ) : (
                <span className={styles.emoji}>{challenge.icon}</span>
              )}
            </div>
            <div className={styles.challengeContent}>
              <div className={styles.challengeTitle}>{challenge.title}</div>
              <div className={styles.challengeDescription}>{challenge.description}</div>
            </div>
            <div className={styles.challengeReward}>
              <span className={styles.xpBadge}>+{challenge.xpReward} XP</span>
            </div>
          </div>
        ))}
      </div>

      {allCompleted && (
        <div className={styles.bonusSection}>
          <div className={styles.bonusIcon}>🎉</div>
          <div className={styles.bonusText}>
            <strong>全達成ボーナス!</strong>
            <span>+50 XP 獲得{bonusXPAwarded ? '済' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
});
