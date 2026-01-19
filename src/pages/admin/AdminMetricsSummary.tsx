import { Card, CardContent } from '@/components/ui';
import type { AdminSummary, AdminPeriod } from '@/features/metrics';
import styles from '../AdminMetricsPage.module.css';

const PERIOD_LABELS: Record<AdminPeriod, string> = {
  today: '今日',
  '7d': '7日間',
  '30d': '30日間',
};

interface AdminMetricsSummaryProps {
  summary: AdminSummary | null;
  period: AdminPeriod;
}

export function AdminMetricsSummary({ summary, period }: AdminMetricsSummaryProps) {
  return (
    <>
      {/* Summary Cards */}
      <section className={styles.summarySection} data-testid="admin-metrics-summary">
        <div className={styles.summaryGrid}>
          <Card className={styles.summaryCard}>
            <CardContent>
              <span className={styles.summaryLabel}>アクティブユーザー</span>
              <span className={styles.summaryValue}>{summary?.activeUsers ?? 0}</span>
            </CardContent>
          </Card>
          <Card className={styles.summaryCard}>
            <CardContent>
              <span className={styles.summaryLabel}>総イベント数</span>
              <span className={styles.summaryValue}>{summary?.totalEvents ?? 0}</span>
            </CardContent>
          </Card>
          <Card className={styles.summaryCard}>
            <CardContent>
              <span className={styles.summaryLabel}>平均イベント/人</span>
              <span className={styles.summaryValue}>{summary?.avgEventsPerUser ?? 0}</span>
            </CardContent>
          </Card>
          <Card className={styles.summaryCard}>
            <CardContent>
              <span className={styles.summaryLabel}>週次目標達成率</span>
              <span className={styles.summaryValue}>
                {summary?.weeklyGoalAchievementRate ?? 0}%
              </span>
            </CardContent>
          </Card>
          <Card className={styles.summaryCard}>
            <CardContent>
              <span className={styles.summaryLabel}>期間</span>
              <span className={styles.summaryValue}>{PERIOD_LABELS[period]}</span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Streak Distribution */}
      <section className={styles.distributionSection}>
        <h2 className={styles.sectionTitle}>Streak 分布</h2>
        <div className={styles.distributionGrid}>
          <div className={styles.distributionItem}>
            <span className={styles.distributionLabel}>0日</span>
            <span className={styles.distributionValue}>
              {summary?.streakDistribution.bucket0 ?? 0}
            </span>
          </div>
          <div className={styles.distributionItem}>
            <span className={styles.distributionLabel}>1-2日</span>
            <span className={styles.distributionValue}>
              {summary?.streakDistribution.bucket1to2 ?? 0}
            </span>
          </div>
          <div className={styles.distributionItem}>
            <span className={styles.distributionLabel}>3-6日</span>
            <span className={styles.distributionValue}>
              {summary?.streakDistribution.bucket3to6 ?? 0}
            </span>
          </div>
          <div className={styles.distributionItem}>
            <span className={styles.distributionLabel}>7-13日</span>
            <span className={styles.distributionValue}>
              {summary?.streakDistribution.bucket7to13 ?? 0}
            </span>
          </div>
          <div className={styles.distributionItem}>
            <span className={styles.distributionLabel}>14日+</span>
            <span className={styles.distributionValue}>
              {summary?.streakDistribution.bucket14plus ?? 0}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
