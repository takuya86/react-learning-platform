/**
 * バッジ一覧ページ
 * 全バッジの獲得状況を確認できる
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, Flame, Brain, Dumbbell, Lock, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useGamification, BADGES, BadgeIcon } from '@/features/gamification';
import type { BadgeCategory } from '@/features/gamification';
import styles from './BadgesPage.module.css';

// カテゴリアイコンコンポーネント
const CATEGORY_ICONS: Record<BadgeCategory, React.ReactNode> = {
  lesson: <BookOpen size={20} />,
  streak: <Flame size={20} />,
  quiz: <Brain size={20} />,
  exercise: <Dumbbell size={20} />,
};

// カテゴリ表示名
const CATEGORY_LABELS: Record<BadgeCategory, { name: string; description: string }> = {
  lesson: { name: 'レッスン', description: 'レッスンを完了して獲得' },
  streak: { name: '連続学習', description: '毎日学習を続けて獲得' },
  quiz: { name: 'クイズ', description: 'クイズに挑戦して獲得' },
  exercise: { name: '演習', description: '演習を完了して獲得' },
};

// カテゴリ順序
const CATEGORY_ORDER: BadgeCategory[] = ['lesson', 'streak', 'quiz', 'exercise'];

export function BadgesPage() {
  const {
    totalXP,
    currentLevel,
    levelTitle,
    levelProgress,
    xpToNextLevel,
    allBadgesWithStatus,
    nextAchievableBadges,
  } = useGamification();

  // バッジをカテゴリごとにグループ化
  const badgesByCategory = useMemo(() => {
    const grouped: Record<BadgeCategory, typeof allBadgesWithStatus> = {
      lesson: [],
      streak: [],
      quiz: [],
      exercise: [],
    };

    allBadgesWithStatus.forEach((item) => {
      grouped[item.badge.category].push(item);
    });

    return grouped;
  }, [allBadgesWithStatus]);

  // 統計計算
  const totalBadges = BADGES.length;
  const earnedCount = allBadgesWithStatus.filter((b) => b.earned).length;
  const progressPercentage = Math.round((earnedCount / totalBadges) * 100);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <Award size={24} />
        </div>
        <h1 className={styles.title}>バッジコレクション</h1>
        <p className={styles.subtitle}>学習を続けてバッジを集めよう</p>
      </header>

      {/* レベル＆XP表示 */}
      <section className={styles.statsSection} aria-label="レベル情報">
        <Card className={styles.levelCard}>
          <CardContent>
            <div className={styles.levelInfo}>
              <div className={styles.levelBadge}>
                <span className={styles.levelNumber}>Lv.{currentLevel}</span>
                <span className={styles.levelTitle}>{levelTitle}</span>
              </div>
              <div className={styles.xpInfo}>
                <span className={styles.xpLabel}>総獲得XP</span>
                <span className={styles.xpValue}>{totalXP.toLocaleString()} XP</span>
              </div>
            </div>
            <div className={styles.levelProgressSection}>
              <div className={styles.levelProgressBar}>
                <div className={styles.levelProgressFill} style={{ width: `${levelProgress}%` }} />
              </div>
              <span className={styles.levelProgressText}>
                {xpToNextLevel !== null
                  ? `次のレベルまで ${xpToNextLevel.toLocaleString()} XP`
                  : '最高レベル達成!'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.collectionCard}>
          <CardContent>
            <div className={styles.collectionInfo}>
              <span className={styles.collectionLabel}>コレクション進捗</span>
              <span className={styles.collectionValue}>
                {earnedCount} / {totalBadges}
              </span>
            </div>
            <div className={styles.collectionBar}>
              <div className={styles.collectionFill} style={{ width: `${progressPercentage}%` }} />
            </div>
            <span className={styles.collectionPercent}>{progressPercentage}% 達成</span>
          </CardContent>
        </Card>
      </section>

      {/* もうすぐ獲得 */}
      {nextAchievableBadges.length > 0 && (
        <section className={styles.nextSection} aria-label="もうすぐ獲得できるバッジ">
          <h2 className={styles.sectionTitle}>
            <Target size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            もうすぐ獲得
          </h2>
          <div className={styles.nextGrid}>
            {nextAchievableBadges.map(({ badge, progress, target }) => (
              <Card key={badge.id} className={styles.nextCard}>
                <CardContent>
                  <div className={styles.nextBadge}>
                    <span className={styles.nextIcon}>
                      <BadgeIcon icon={badge.icon} size={24} />
                    </span>
                    <div className={styles.nextInfo}>
                      <span className={styles.nextName}>{badge.name}</span>
                      <span className={styles.nextDescription}>{badge.description}</span>
                      <div className={styles.nextProgress}>
                        <div
                          className={styles.nextProgressBar}
                          style={{ width: `${(progress / target) * 100}%` }}
                        />
                      </div>
                      <span className={styles.nextProgressText}>
                        {progress} / {target}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* カテゴリ別バッジ */}
      {CATEGORY_ORDER.map((category) => {
        const badges = badgesByCategory[category];
        const categoryInfo = CATEGORY_LABELS[category];
        const categoryEarned = badges.filter((b) => b.earned).length;

        return (
          <section
            key={category}
            className={styles.categorySection}
            aria-label={`${categoryInfo.name}バッジ`}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className={styles.categoryHeader}>
                    <span className={styles.categoryIcon}>{CATEGORY_ICONS[category]}</span>
                    <span>{categoryInfo.name}</span>
                    <span className={styles.categoryCount}>
                      {categoryEarned} / {badges.length}
                    </span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={styles.categoryDescription}>{categoryInfo.description}</p>
                <div className={styles.badgeGrid}>
                  {badges.map(({ badge, earned, earnedAt }) => (
                    <div
                      key={badge.id}
                      className={`${styles.badgeItem} ${earned ? styles.earned : styles.locked}`}
                    >
                      <span className={styles.badgeIcon}>
                        {earned ? <BadgeIcon icon={badge.icon} size={20} /> : <Lock size={20} />}
                      </span>
                      <div className={styles.badgeInfo}>
                        <span className={styles.badgeName}>{badge.name}</span>
                        <span className={styles.badgeDescription}>
                          {earned ? badge.description : '???'}
                        </span>
                        {earned && earnedAt && (
                          <time className={styles.badgeDate} dateTime={earnedAt}>
                            {new Date(earnedAt).toLocaleDateString('ja-JP')} 獲得
                          </time>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        );
      })}

      {/* 空の場合のCTA */}
      {earnedCount === 0 && (
        <section className={styles.emptySection}>
          <p className={styles.emptyMessage}>
            まだバッジを獲得していません。
            <Link to="/lessons">レッスンを始めて</Link>
            最初のバッジを獲得しましょう！
          </p>
        </section>
      )}
    </div>
  );
}
