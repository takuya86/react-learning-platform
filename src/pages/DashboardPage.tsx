import { useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { useProgress } from '@/features/progress';
import { useRecommendations, NextLessonsCard } from '@/features/insights';
import {
  useLearningMetrics,
  LearningMetricsCard,
  useLearningHeatmap,
  useLearningTrend,
  LearningTrendChart,
  HabitInterventionCard,
  useGrowthInsights,
  GrowthInsightsCard,
  INSIGHTS_REFERENCE_ID,
} from '@/features/metrics';
import {
  ClickableHeatmap,
  StreakAlert,
  WeeklyCountdown,
  TodayActionCard,
} from '@/features/actionable';
import { getAllLessons } from '@/lib/lessons';
import { quizzes } from '@/data';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { user } = useAuth();
  const { progress, getCompletedLessonsCount } = useProgress();
  const { recommendations, hasRecommendations } = useRecommendations({ limit: 3 });
  const {
    metrics,
    streakExplain,
    weeklyExplain,
    isLoading: metricsLoading,
    recordEvent,
  } = useLearningMetrics();
  const { heatmapData, isLoading: heatmapLoading } = useLearningHeatmap();
  const {
    data: trendData,
    mode: trendMode,
    setMode: setTrendMode,
    isLoading: trendLoading,
    error: trendError,
  } = useLearningTrend();
  const {
    insights: growthInsights,
    isLoading: insightsLoading,
    error: insightsError,
  } = useGrowthInsights();
  const lessons = useMemo(() => getAllLessons(), []);

  // Callback to log insights_shown event (once per day, idempotent)
  const handleInsightsViewed = useCallback(() => {
    recordEvent('insights_shown', INSIGHTS_REFERENCE_ID);
  }, [recordEvent]);
  const completedCount = getCompletedLessonsCount();
  const totalCount = lessons.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  // Calculate recent active days (last 7 days) from heatmap data
  const recentActiveDays = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) return 0;
    // Get last 7 days from heatmap data
    const last7Days = heatmapData.slice(-7);
    return last7Days.filter((day) => day.count > 0).length;
  }, [heatmapData]);

  const nextLesson = lessons.find((lesson) => !progress.lessons[lesson.id]?.completedAt);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>React学習プラットフォーム</h1>
        <p className={styles.subtitle}>Reactの基礎から実践までを体系的に学びましょう</p>
      </header>

      {user && (
        <>
          {/* Habit Intervention Card - Top priority intervention */}
          {!metricsLoading && !heatmapLoading && (
            <HabitInterventionCard recentActiveDays={recentActiveDays} />
          )}

          {/* Streak/Weekly Alerts */}
          {!metricsLoading && (
            <div className={styles.alertsRow}>
              <StreakAlert streakExplain={streakExplain} />
              <WeeklyCountdown weeklyExplain={weeklyExplain} />
            </div>
          )}

          {/* Today's Action CTA */}
          {!metricsLoading && hasRecommendations && (
            <TodayActionCard
              recommendations={recommendations}
              streakExplain={streakExplain}
              weeklyExplain={weeklyExplain}
              className={styles.actionCard}
            />
          )}

          <LearningMetricsCard
            metrics={metrics}
            streakExplain={streakExplain}
            weeklyExplain={weeklyExplain}
            isLoading={metricsLoading}
          />

          {/* Growth Insights Card - 成長実感 */}
          <GrowthInsightsCard
            insights={growthInsights}
            isLoading={insightsLoading}
            error={insightsError}
            onViewed={handleInsightsViewed}
          />

          {!heatmapLoading && (
            <Card className={styles.heatmapCard}>
              <CardContent>
                <ClickableHeatmap data={heatmapData} title="学習アクティビティ" />
              </CardContent>
            </Card>
          )}
          <Card className={styles.trendCard}>
            <CardContent>
              <LearningTrendChart
                data={trendData}
                mode={trendMode}
                onModeChange={setTrendMode}
                isLoading={trendLoading}
                error={trendError}
              />
            </CardContent>
          </Card>
        </>
      )}

      <div className={styles.statsRow}>
        <Card className={styles.progressCard}>
          <CardContent>
            <div className={styles.progressInfo}>
              <div>
                <span className={styles.progressLabel}>学習進捗</span>
                <div className={styles.progressValue}>{progressPercentage}%</div>
              </div>
              <div className={styles.progressDetails}>
                <span>
                  {completedCount} / {totalCount} レッスン完了
                </span>
              </div>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPercentage}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {hasRecommendations && (
        <section className={styles.section}>
          <NextLessonsCard recommendations={recommendations} />
        </section>
      )}

      {nextLesson && !hasRecommendations && (
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
