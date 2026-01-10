import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { useProgress } from '@/features/progress';
import { getAllLessons } from '@/lib/lessons';
import styles from './ProgressPage.module.css';

export function ProgressPage() {
  const { progress, getCompletedLessonsCount, getTotalLessonsOpened, resetProgress } =
    useProgress();

  const lessons = useMemo(() => getAllLessons(), []);
  const completedCount = getCompletedLessonsCount();
  const openedCount = getTotalLessonsOpened();
  const totalCount = lessons.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  const recentLessons = useMemo(() => {
    const lessonProgress = Object.values(progress.lessons);
    return lessonProgress
      .filter((lp) => lp.openedAt)
      .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime())
      .slice(0, 5)
      .map((lp) => {
        const lesson = lessons.find((l) => l.id === lp.lessonId);
        return { ...lp, lesson };
      });
  }, [progress.lessons, lessons]);

  const handleReset = () => {
    if (window.confirm('進捗をリセットしますか？この操作は取り消せません。')) {
      resetProgress();
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>学習の進捗</h1>
        <p className={styles.subtitle}>あなたの学習状況を確認しましょう</p>
      </header>

      <div className={styles.statsGrid}>
        <Card>
          <CardContent>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>完了したレッスン</span>
              <span className={styles.statValue}>
                {completedCount} / {totalCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>進捗率</span>
              <span className={styles.statValue}>{progressPercentage}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>連続学習日数</span>
              <span className={styles.statValue}>{progress.streak} 日</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>学習中のレッスン</span>
              <span className={styles.statValue}>{openedCount - completedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressLabel}>
          <span>全体の進捗</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>

      <Card className={styles.recentCard}>
        <CardHeader>
          <CardTitle>最近の学習履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLessons.length === 0 ? (
            <p className={styles.emptyMessage}>
              まだ学習履歴がありません。
              <Link to="/lessons">レッスンを始めましょう！</Link>
            </p>
          ) : (
            <ul className={styles.recentList}>
              {recentLessons.map((item) => (
                <li key={item.lessonId} className={styles.recentItem}>
                  <div className={styles.recentInfo}>
                    <Link to={`/lessons/${item.lessonId}`} className={styles.recentTitle}>
                      {item.lesson?.title || item.lessonId}
                    </Link>
                    <span className={styles.recentDate}>
                      {new Date(item.openedAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <div>
                    {item.completedAt ? (
                      <Badge variant="success">完了</Badge>
                    ) : (
                      <Badge variant="primary">学習中</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className={styles.resetSection}>
        <Button variant="outline" onClick={handleReset}>
          進捗をリセット
        </Button>
      </div>
    </div>
  );
}
