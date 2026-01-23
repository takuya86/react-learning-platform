/**
 * リーダーボードページ
 * XPランキングを表示
 */

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useGamification } from '@/features/gamification';
import { getTopRankers } from '@/features/gamification/services/leaderboardService';
import styles from './LeaderboardPage.module.css';

// 順位ごとのトロフィーアイコン
const RANK_ICONS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export function LeaderboardPage() {
  const { totalXP } = useGamification();

  const leaderboard = useMemo(() => {
    return getTopRankers(totalXP, 12);
  }, [totalXP]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>リーダーボード</h1>
        <p className={styles.subtitle}>学習者のXPランキング</p>
      </header>

      <Card className={styles.leaderboardCard}>
        <CardHeader>
          <CardTitle>トップランカー</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <span className={styles.colRank}>{RANK_ICONS[entry.rank] || entry.rank}</span>
                  <span className={styles.colName}>
                    {entry.name}
                    {entry.isCurrentUser && <span className={styles.youBadge}>YOU</span>}
                  </span>
                  <span className={styles.colLevel}>
                    <span className={styles.levelNumber}>Lv.{entry.level}</span>
                    <span className={styles.levelTitle}>{entry.levelTitle}</span>
                  </span>
                  <span className={styles.colXP}>{entry.xp.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <p className={styles.note}>※ ランキングはデモ用のサンプルデータです</p>
    </div>
  );
}
