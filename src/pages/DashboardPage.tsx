import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui';
import { useProgress } from '@/features/progress';
import { lessons, quizzes } from '@/data';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { progress, getCompletedLessonsCount } = useProgress();
  const completedCount = getCompletedLessonsCount();
  const totalCount = lessons.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  const nextLesson = lessons.find((lesson) => !progress.lessons[lesson.id]?.completedAt);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>React学習プラットフォーム</h1>
        <p className={styles.subtitle}>
          Reactの基礎から実践までを体系的に学びましょう
        </p>
      </header>

      <div className={styles.statsRow}>
        <Card className={styles.progressCard}>
          <CardContent>
            <div className={styles.progressInfo}>
              <div>
                <span className={styles.progressLabel}>学習進捗</span>
                <div className={styles.progressValue}>{progressPercentage}%</div>
              </div>
              <div className={styles.progressDetails}>
                <span>{completedCount} / {totalCount} レッスン完了</span>
                <span>連続 {progress.streak} 日</span>
              </div>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {nextLesson && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>次のレッスン</h2>
          <Card>
            <CardHeader>
              <CardTitle>{nextLesson.title}</CardTitle>
              <CardDescription>{nextLesson.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.lessonMeta}>
                <Badge variant="primary">{nextLesson.difficulty}</Badge>
                <span>約 {nextLesson.estimatedMinutes} 分</span>
              </div>
              <Link to={`/lessons/${nextLesson.id}`} className={styles.startButton}>
                学習を始める
              </Link>
            </CardContent>
          </Card>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>クイックアクセス</h2>
        <div className={styles.quickLinks}>
          <Link to="/lessons" className={styles.quickLink}>
            <Card className={styles.quickCard}>
              <CardContent>
                <div className={styles.quickIcon}>📚</div>
                <div className={styles.quickLabel}>レッスン一覧</div>
                <div className={styles.quickCount}>{lessons.length} レッスン</div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/quiz" className={styles.quickLink}>
            <Card className={styles.quickCard}>
              <CardContent>
                <div className={styles.quickIcon}>📝</div>
                <div className={styles.quickLabel}>クイズ</div>
                <div className={styles.quickCount}>{quizzes.length} クイズ</div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/progress" className={styles.quickLink}>
            <Card className={styles.quickCard}>
              <CardContent>
                <div className={styles.quickIcon}>📊</div>
                <div className={styles.quickLabel}>進捗確認</div>
                <div className={styles.quickCount}>{progressPercentage}% 完了</div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
