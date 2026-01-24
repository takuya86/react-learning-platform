import { useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, BarChart3, GraduationCap } from 'lucide-react';
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
import {
  useGamification,
  GamificationCard,
  BadgeNotificationContainer,
  BadgeCelebrationContainer,
  useDailyChallenge,
  DailyChallengeCard,
} from '@/features/gamification';
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
  const gamification = useGamification();
  const lessons = useMemo(() => getAllLessons(), []);

  // デイリーチャレンジ
  const dailyChallenge = useDailyChallenge(() => {
    gamification.addXP('streak_bonus');
  });

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
      {/* Badge Celebration - 画面中央の派手な演出 */}
      <BadgeCelebrationContainer
        notifications={gamification.pendingNotifications}
        onClear={gamification.clearNotification}
      />

      {/* Badge Notifications - 右上の通知（併用可能） */}
      <BadgeNotificationContainer
        notifications={gamification.pendingNotifications}
        onClear={gamification.clearNotification}
      />

      <header className={styles.header} role="banner">
        <div className={styles.headerIcon}>
          <GraduationCap size={24} />
        </div>
        <h1 className={styles.title} id="dashboard-title">
          React学習プラットフォーム
        </h1>
        <p className={styles.subtitle}>Reactの基礎から実践までを体系的に学びましょう</p>
      </header>

      {user && (
        <>
          {/* Gamification Card - Level & Badges */}
          <GamificationCard gamification={gamification} />

          {/* Daily Challenge Card */}
          <DailyChallengeCard
            challenges={dailyChallenge.challenges}
            progress={dailyChallenge.progress}
            allCompleted={dailyChallenge.allCompleted}
            bonusXPAwarded={dailyChallenge.bonusXPAwarded}
            totalXP={dailyChallenge.totalXP}
          />

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

      <section className={styles.statsRow} aria-labelledby="progress-heading">
        <Card className={styles.progressCard}>
          <CardContent>
            <div className={styles.progressInfo}>
              <div>
                <span className={styles.progressLabel} id="progress-heading">
                  学習進捗
                </span>
                <div
                  className={styles.progressValue}
                  aria-label={`学習進捗 ${progressPercentage}パーセント`}
                >
                  {progressPercentage}%
                </div>
              </div>
              <div className={styles.progressDetails}>
                <span aria-label={`${completedCount}レッスン完了、全${totalCount}レッスン中`}>
                  {completedCount} / {totalCount} レッスン完了
                </span>
              </div>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="学習進捗バー"
            >
              <div className={styles.progressFill} style={{ width: `${progressPercentage}%` }} />
            </div>
          </CardContent>
        </Card>
      </section>

      {hasRecommendations && (
        <section className={styles.section} aria-labelledby="recommendations-heading">
          <NextLessonsCard recommendations={recommendations} />
        </section>
      )}

      {nextLesson && !hasRecommendations && (
        <section className={styles.section} aria-labelledby="next-lesson-heading">
          <h2 className={styles.sectionTitle} id="next-lesson-heading">
            次のレッスン
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>{nextLesson.title}</CardTitle>
              <CardDescription>{nextLesson.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.lessonMeta} role="list" aria-label="レッスン情報">
                <Badge variant="primary" role="listitem">
                  {nextLesson.difficulty}
                </Badge>
                <span role="listitem" aria-label={`推定所要時間 ${nextLesson.estimatedMinutes}分`}>
                  約 {nextLesson.estimatedMinutes} 分
                </span>
              </div>
              <Link
                to={`/lessons/${nextLesson.id}`}
                className={styles.startButton}
                aria-label={`${nextLesson.title}のレッスンを始める`}
              >
                学習を始める
              </Link>
            </CardContent>
          </Card>
        </section>
      )}

      <section className={styles.section} aria-labelledby="quick-access-heading">
        <h2 className={styles.sectionTitle} id="quick-access-heading">
          クイックアクセス
        </h2>
        <nav className={styles.quickLinks} aria-label="クイックアクセスメニュー">
          <Link
            to="/lessons"
            className={styles.quickLink}
            aria-label={`レッスン一覧へ移動。全${lessons.length}レッスン`}
          >
            <Card className={styles.quickCard}>
              <CardContent>
                <div className={styles.quickIcon} aria-hidden="true">
                  <BookOpen size={32} />
                </div>
                <div className={styles.quickLabel}>レッスン一覧</div>
                <div className={styles.quickCount}>{lessons.length} レッスン</div>
              </CardContent>
            </Card>
          </Link>
          <Link
            to="/quiz"
            className={styles.quickLink}
            aria-label={`クイズへ移動。全${quizzes.length}クイズ`}
          >
            <Card className={styles.quickCard}>
              <CardContent>
                <div className={styles.quickIcon} aria-hidden="true">
                  <FileText size={32} />
                </div>
                <div className={styles.quickLabel}>クイズ</div>
                <div className={styles.quickCount}>{quizzes.length} クイズ</div>
              </CardContent>
            </Card>
          </Link>
          <Link
            to="/progress"
            className={styles.quickLink}
            aria-label={`進捗確認へ移動。現在${progressPercentage}パーセント完了`}
          >
            <Card className={styles.quickCard}>
              <CardContent>
                <div className={styles.quickIcon} aria-hidden="true">
                  <BarChart3 size={32} />
                </div>
                <div className={styles.quickLabel}>進捗確認</div>
                <div className={styles.quickCount}>{progressPercentage}% 完了</div>
              </CardContent>
            </Card>
          </Link>
        </nav>
      </section>
    </div>
  );
}
