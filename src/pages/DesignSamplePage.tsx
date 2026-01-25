/**
 * デザインサンプルページ（改善版）
 * モダンなデザイン原則に基づく3パターン
 */

import { useState } from 'react';
import { Trophy, Medal, Award, Crown, Star, Zap } from 'lucide-react';
import styles from './DesignSamplePage.module.css';

type DesignPattern = 'A' | 'B' | 'C';

const PATTERN_NAMES: Record<DesignPattern, string> = {
  A: 'Minimal (Linear風)',
  B: 'Clean (Vercel風)',
  C: 'Soft (Apple風)',
};

// サンプルデータ
const SAMPLE_DATA = [
  { rank: 1, name: '田中太郎', level: 9, levelTitle: '達人', xp: 12500 },
  { rank: 2, name: '佐藤花子', level: 8, levelTitle: 'マスター', xp: 9800 },
  { rank: 3, name: '鈴木一郎', level: 8, levelTitle: 'マスター', xp: 8200 },
  { rank: 4, name: '高橋美咲', level: 7, levelTitle: 'エキスパート', xp: 6500 },
  { rank: 5, name: '伊藤健太', level: 6, levelTitle: '熟練者', xp: 5100 },
];

// 順位アイコンコンポーネント
function RankIcon({ rank, pattern }: { rank: number; pattern: DesignPattern }) {
  const iconProps = { size: 18, strokeWidth: 2 };

  if (rank === 1) return <Crown {...iconProps} className={styles[`icon1${pattern}`]} />;
  if (rank === 2) return <Medal {...iconProps} className={styles[`icon2${pattern}`]} />;
  if (rank === 3) return <Award {...iconProps} className={styles[`icon3${pattern}`]} />;
  return <span className={styles.rankNumber}>{rank}</span>;
}

export function DesignSamplePage() {
  const [pattern, setPattern] = useState<DesignPattern>('A');

  return (
    <div className={`${styles.container} ${styles[`pattern${pattern}`]}`}>
      {/* パターン切り替え */}
      <div className={styles.patternSwitch}>
        {(['A', 'B', 'C'] as DesignPattern[]).map((p) => (
          <button
            key={p}
            className={`${styles.switchBtn} ${pattern === p ? styles.active : ''}`}
            onClick={() => setPattern(p)}
          >
            {PATTERN_NAMES[p]}
          </button>
        ))}
      </div>

      {/* ヘッダー */}
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <Trophy size={24} />
        </div>
        <h1 className={styles.title}>リーダーボード</h1>
        <p className={styles.subtitle}>学習者のXPランキング</p>
      </header>

      {/* メインカード */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Star size={16} />
          <span>トップランカー</span>
        </div>

        {/* テーブル */}
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span className={styles.colRank}>順位</span>
            <span className={styles.colName}>ユーザー</span>
            <span className={styles.colLevel}>レベル</span>
            <span className={styles.colXP}>XP</span>
          </div>

          <div className={styles.tableBody}>
            {SAMPLE_DATA.map((entry) => (
              <div
                key={entry.rank}
                className={`${styles.row} ${entry.rank <= 3 ? styles[`rank${entry.rank}`] : ''}`}
              >
                <span className={styles.colRank}>
                  <RankIcon rank={entry.rank} pattern={pattern} />
                </span>
                <span className={styles.colName}>{entry.name}</span>
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

      {/* デザイン情報 */}
      <p className={styles.fontInfo}>
        Font: Inter + Noto Sans JP / Pattern: {PATTERN_NAMES[pattern]}
      </p>
    </div>
  );
}
