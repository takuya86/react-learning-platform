import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  SyncStatusIndicator,
} from '@/components/ui';
import { useAuth } from '@/features/auth';
import { useProgress } from '@/features/progress';
import { getAllLessons } from '@/lib/lessons';
import styles from './ProgressPage.module.css';

export function ProgressPage() {
  const { user } = useAuth();
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
      <header className={styles.header} role="banner">
        <div className={styles.headerIcon}>
          <BarChart3 size={24} />
        </div>
        <div className={styles.headerTop}>
          <h1 className={styles.title} id="progress-page-title">
            学習の進捗
          </h1>
          {user && <SyncStatusIndicator />}
        </div>
        <p className={styles.subtitle}>あなたの学習状況を確認しましょう</p>
      </header>

      <section className={styles.statsGrid} aria-label="学習統計">
        <Card>
          <CardContent>
            <div className={styles.statCard}>
              <span className={styles.statLabel} id="completed-lessons-label">
                完了したレッスン
              </span>
              <span
                className={styles.statValue}
                aria-labelledby="completed-lessons-label"
                aria-label={`${completedCount}レッスン完了、全${totalCount}レッスン中`}
                data-testid="completed-lessons-value"
              >
                {completedCount} / {totalCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className={styles.statCard}>
              <span className={styles.statLabel} id="progress-percentage-label">
                進捗率
              </span>
              <span
                className={styles.statValue}
                aria-labelledby="progress-percentage-label"
                aria-label={`進捗率 ${progressPercentage}パーセント`}
              >
                {progressPercentage}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className={styles.statCard}>
              <span className={styles.statLabel} id="streak-label">
                連続学習日数
              </span>
              <span
                className={styles.statValue}
                aria-labelledby="streak-label"
                aria-label={`連続${progress.streak}日間`}
              >
                {progress.streak} 日
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className={styles.statCard}>
              <span className={styles.statLabel} id="in-progress-label">
                学習中のレッスン
              </span>
              <span
                className={styles.statValue}
                aria-labelledby="in-progress-label"
                aria-label={`${openedCount - completedCount}レッスン学習中`}
              >
                {openedCount - completedCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className={styles.progressBar} aria-labelledby="overall-progress-label">
        <div className={styles.progressLabel}>
          <span id="overall-progress-label">全体の進捗</span>
          <span aria-label={`${progressPercentage}パーセント`}>{progressPercentage}%</span>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-labelledby="overall-progress-label"
        >
          <div className={styles.progressFill} style={{ width: `${progressPercentage}%` }} />
        </div>
      </section>

      <Card className={styles.recentCard}>
        <CardHeader>
          <CardTitle id="recent-history-heading">最近の学習履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLessons.length === 0 ? (
            <p className={styles.emptyMessage}>
              まだ学習履歴がありません。
              <Link to="/lessons" aria-label="レッスン一覧ページへ移動してレッスンを開始">
                レッスンを始めましょう！
              </Link>
            </p>
          ) : (
            <ul
              className={styles.recentList}
              aria-labelledby="recent-history-heading"
              data-testid="recent-history-list"
            >
              {recentLessons.map((item) => (
                <li key={item.lessonId} className={styles.recentItem}>
                  <div className={styles.recentInfo}>
                    <Link
                      to={`/lessons/${item.lessonId}`}
                      className={styles.recentTitle}
                      aria-label={`${item.lesson?.title || item.lessonId}のレッスンへ移動`}
                    >
                      {item.lesson?.title || item.lessonId}
                    </Link>
                    <time className={styles.recentDate} dateTime={item.openedAt}>
                      {new Date(item.openedAt).toLocaleDateString('ja-JP')}
                    </time>
                  </div>
                  <div>
                    {item.completedAt ? (
                      <Badge variant="success" role="status" aria-label="完了済み">
                        完了
                      </Badge>
                    ) : (
                      <Badge variant="primary" role="status" aria-label="学習中">
                        学習中
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <section className={styles.resetSection} aria-label="進捗リセット操作">
        <Button
          variant="outline"
          onClick={handleReset}
          aria-label="すべての学習進捗をリセットします。この操作は取り消せません"
        >
          進捗をリセット
        </Button>
      </section>
    </div>
  );
}
