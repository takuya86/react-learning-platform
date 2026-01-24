/**
 * リーダーボードページ
 * XPランキングを表示
 * Design: Soft (Apple style)
 */

import { useMemo } from 'react';
import { Trophy, Crown, Medal, Award, Star, Zap } from 'lucide-react';
import { useGamification } from '@/features/gamification';
import { getTopRankers } from '@/features/gamification/services/leaderboardService';
import styles from './LeaderboardPage.module.css';

// 順位アイコンコンポーネント
function RankIcon({ rank }: { rank: number }) {
  const iconProps = { size: 18, strokeWidth: 2 };

  if (rank === 1) return <Crown {...iconProps} style={{ color: 'var(--ld-rank1-accent)' }} />;
  if (rank === 2) return <Medal {...iconProps} style={{ color: 'var(--ld-rank2-accent)' }} />;
  if (rank === 3) return <Award {...iconProps} style={{ color: 'var(--ld-rank3-accent)' }} />;
  return <span className={styles.rankNumber}>{rank}</span>;
}

export function LeaderboardPage() {
  const { totalXP } = useGamification();

  const leaderboard = useMemo(() => {
    return getTopRankers(totalXP, 12);
  }, [totalXP]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <Trophy size={24} />
        </div>
        <h1 className={styles.title}>リーダーボード</h1>
        <p className={styles.subtitle}>学習者のXPランキング</p>
      </header>

      <div className={styles.leaderboardCard}>
        <div className={styles.cardHeader}>
          <Star size={16} />
          <span>トップランカー</span>
        </div>

        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span className={styles.colRank}>順位</span>
            <span className={styles.colName}>ユーザー</span>
            <span className={styles.colLevel}>レベル</span>
            <span className={styles.colXP}>XP</span>
          </div>
          <div className={styles.tableBody}>
            {leaderboard.map((entry) => (
              <div
                key={entry.name}
                className={`${styles.row} ${entry.isCurrentUser ? styles.currentUser : ''} ${entry.rank <= 3 ? styles[`rank${entry.rank}`] : ''}`}
              >
                <span className={styles.colRank}>
                  <RankIcon rank={entry.rank} />
                </span>
                <span className={styles.colName}>
                  {entry.name}
                  {entry.isCurrentUser && <span className={styles.youBadge}>YOU</span>}
                </span>
                <span className={styles.colLevel}>
                  <span className={styles.levelBadge}>Lv.{entry.level}</span>
                  <span className={styles.levelTitle}>{entry.levelTitle}</span>
                </span>
                <span className={styles.colXP}>
                  <Zap size={14} />
                  {entry.xp.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className={styles.note}>※ ランキングはデモ用のサンプルデータです</p>
    </div>
  );
}
