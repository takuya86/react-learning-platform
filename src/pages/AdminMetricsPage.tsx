import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import {
  useAdminMetrics,
  LearningHeatmap,
  type AdminPeriod,
  type LessonRankingRow,
  type LessonImprovementHint,
  generateLessonHint,
} from '@/features/metrics';
import { CreateIssueButton } from '@/features/admin';
import styles from './AdminMetricsPage.module.css';

/**
 * Generate improvement hint for a ranking row
 */
function getHintForRow(row: LessonRankingRow): LessonImprovementHint | null {
  return generateLessonHint({
    lessonSlug: row.slug,
    originCount: row.originCount,
    followUpRate: row.followUpRate,
    followUpCounts: row.followUpCounts,
  });
}

const PERIOD_LABELS: Record<AdminPeriod, string> = {
  today: '今日',
  '7d': '7日間',
  '30d': '30日間',
};

const ACTION_LABELS: Record<string, string> = {
  next_lesson_opened: '次のレッスン',
  review_started: '復習',
  quiz_started: 'クイズ',
  note_created: 'ノート',
};

function formatActionLabel(actionType: string): string {
  return ACTION_LABELS[actionType] || actionType;
}

export function AdminMetricsPage() {
  const {
    period,
    setPeriod,
    summary,
    trendData,
    heatmapData,
    leaderboards,
    effectiveness,
    lessonRanking,
    improvementTracker,
    isLoading,
    error,
  } = useAdminMetrics();

  if (error) {
    return (
      <div className={styles.container} data-testid="admin-metrics-page">
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Metrics 管理</h1>
            <Link to="/admin" className={styles.backLink}>
              &larr; 管理者ページに戻る
            </Link>
          </div>
        </header>
        <div className={styles.errorState}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container} data-testid="admin-metrics-page">
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Metrics 管理</h1>
          <p className={styles.subtitle}>全ユーザーの学習状況を俯瞰</p>
          <Link to="/admin" className={styles.backLink}>
            &larr; 管理者ページに戻る
          </Link>
        </div>

        <div className={styles.periodSelector} data-testid="admin-metrics-period-select">
          {(['today', '7d', '30d'] as AdminPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.periodButton} ${period === p ? styles.active : ''}`}
              onClick={() => setPeriod(p)}
              aria-label={`${PERIOD_LABELS[p]}を表示`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className={styles.loadingState}>読み込み中...</div>
      ) : (
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

          {/* Learning Effectiveness */}
          <section className={styles.distributionSection} data-testid="admin-metrics-effectiveness">
            <h2 className={styles.sectionTitle}>学習効果</h2>
            <div className={styles.distributionGrid}>
              <div className={styles.distributionItem}>
                <span className={styles.distributionLabel}>Follow-up率</span>
                <span className={styles.distributionValue}>
                  {effectiveness?.followUpRate.rate ?? 0}%
                </span>
              </div>
              <div className={styles.distributionItem}>
                <span className={styles.distributionLabel}>完了率</span>
                <span className={styles.distributionValue}>
                  {effectiveness?.completionRate.rate ?? 0}%
                </span>
              </div>
              <div className={styles.distributionItem}>
                <span className={styles.distributionLabel}>起点イベント</span>
                <span className={styles.distributionValue}>
                  {effectiveness?.followUpRate.originCount ?? 0}
                </span>
              </div>
              <div className={styles.distributionItem}>
                <span className={styles.distributionLabel}>Follow-up数</span>
                <span className={styles.distributionValue}>
                  {effectiveness?.followUpRate.followedUpCount ?? 0}
                </span>
              </div>
              <div className={styles.distributionItem}>
                <span className={styles.distributionLabel}>Top Action</span>
                <span className={styles.distributionValue}>
                  {effectiveness?.topFollowUpAction.type
                    ? formatActionLabel(effectiveness.topFollowUpAction.type)
                    : '-'}
                </span>
              </div>
            </div>
          </section>

          {/* Charts */}
          <section className={styles.chartsSection}>
            {/* Trend Chart */}
            <Card className={styles.chartCard} data-testid="admin-metrics-trend">
              <CardContent className={styles.chartCardContent}>
                <AdminTrendChart data={trendData} />
              </CardContent>
            </Card>

            {/* Heatmap */}
            <Card className={styles.chartCard} data-testid="admin-metrics-heatmap">
              <CardContent className={styles.chartCardContent}>
                <LearningHeatmap data={heatmapData} title="全ユーザー学習アクティビティ" />
              </CardContent>
            </Card>
          </section>

          {/* Leaderboards */}
          <section className={styles.leaderboardsSection} data-testid="admin-metrics-leaderboards">
            <h2 className={styles.sectionTitle}>ランキング</h2>
            <div className={styles.leaderboardsGrid}>
              {/* By 30-day Events */}
              <Card className={styles.leaderboardCard}>
                <h3 className={styles.leaderboardTitle}>30日間イベント数 Top10</h3>
                <table className={styles.leaderboardTable}>
                  <thead>
                    <tr>
                      <th className={styles.rankCell}>#</th>
                      <th>ユーザーID</th>
                      <th className={styles.numericCell}>30日</th>
                      <th className={styles.numericCell}>7日</th>
                      <th className={styles.numericCell}>Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboards?.byThirtyDayEvents.map((entry, index) => (
                      <tr key={entry.userId}>
                        <td className={styles.rankCell}>
                          <span className={`${styles.rank} ${index < 3 ? styles.top : ''}`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className={styles.userIdCell} title={entry.userId}>
                          {entry.userId.slice(0, 8)}...
                        </td>
                        <td className={styles.numericCell}>{entry.thirtyDayEvents}</td>
                        <td className={styles.numericCell}>{entry.weeklyEvents}</td>
                        <td className={styles.numericCell}>{entry.streak}</td>
                      </tr>
                    ))}
                    {(!leaderboards || leaderboards.byThirtyDayEvents.length === 0) && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#6b7280' }}>
                          データがありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>

              {/* By Streak */}
              <Card className={styles.leaderboardCard}>
                <h3 className={styles.leaderboardTitle}>Streak Top10</h3>
                <table className={styles.leaderboardTable}>
                  <thead>
                    <tr>
                      <th className={styles.rankCell}>#</th>
                      <th>ユーザーID</th>
                      <th className={styles.numericCell}>Streak</th>
                      <th className={styles.numericCell}>最終学習</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboards?.byStreak.map((entry, index) => (
                      <tr key={entry.userId}>
                        <td className={styles.rankCell}>
                          <span className={`${styles.rank} ${index < 3 ? styles.top : ''}`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className={styles.userIdCell} title={entry.userId}>
                          {entry.userId.slice(0, 8)}...
                        </td>
                        <td className={styles.numericCell}>{entry.streak}</td>
                        <td className={styles.numericCell}>
                          {entry.lastEventDate?.slice(5) ?? '-'}
                        </td>
                      </tr>
                    ))}
                    {(!leaderboards || leaderboards.byStreak.length === 0) && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280' }}>
                          データがありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </div>
          </section>

          {/* Lesson Effectiveness Ranking */}
          <section
            className={styles.leaderboardsSection}
            data-testid="admin-metrics-lesson-ranking"
          >
            <h2 className={styles.sectionTitle}>Lesson Effectiveness Ranking</h2>
            <div className={styles.leaderboardsGrid}>
              {/* Best Lessons */}
              <Card className={styles.leaderboardCard}>
                <h3 className={styles.leaderboardTitle}>Best（Follow-up率が高い）</h3>
                <table className={styles.leaderboardTable}>
                  <thead>
                    <tr>
                      <th className={styles.rankCell}>#</th>
                      <th>レッスン</th>
                      <th className={styles.numericCell}>母数</th>
                      <th className={styles.numericCell}>Rate</th>
                      <th>Hint</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessonRanking?.best.map((row, index) => {
                      const hint = getHintForRow(row);
                      return (
                        <tr key={row.slug}>
                          <td className={styles.rankCell}>
                            <span className={`${styles.rank} ${index < 3 ? styles.top : ''}`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className={styles.userIdCell} title={row.slug}>
                            {row.title}
                            {row.isLowSample && (
                              <span className={styles.lowSampleBadge}>low sample</span>
                            )}
                          </td>
                          <td className={styles.numericCell}>{row.originCount}</td>
                          <td className={styles.numericCell}>{row.followUpRate}%</td>
                          <td className={styles.hintCell}>{hint?.message ?? '-'}</td>
                        </tr>
                      );
                    })}
                    {(!lessonRanking || lessonRanking.best.length === 0) && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#6b7280' }}>
                          データがありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>

              {/* Worst Lessons */}
              <Card className={styles.leaderboardCard}>
                <h3 className={styles.leaderboardTitle}>Worst（Follow-up率が低い）</h3>
                <table className={styles.leaderboardTable}>
                  <thead>
                    <tr>
                      <th className={styles.rankCell}>#</th>
                      <th>レッスン</th>
                      <th className={styles.numericCell}>母数</th>
                      <th className={styles.numericCell}>Rate</th>
                      <th>Hint</th>
                      <th>Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessonRanking?.worst.map((row, index) => {
                      const hint = getHintForRow(row);
                      return (
                        <tr key={row.slug}>
                          <td className={styles.rankCell}>
                            <span className={`${styles.rank} ${index < 3 ? styles.top : ''}`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className={styles.userIdCell} title={row.slug}>
                            {row.title}
                            {row.isLowSample && (
                              <span className={styles.lowSampleBadge}>low sample</span>
                            )}
                          </td>
                          <td className={styles.numericCell}>{row.originCount}</td>
                          <td className={styles.numericCell}>{row.followUpRate}%</td>
                          <td className={styles.hintCell}>{hint?.message ?? '-'}</td>
                          <td className={styles.issueCell}>
                            <CreateIssueButton row={row} hint={hint} />
                          </td>
                        </tr>
                      );
                    })}
                    {(!lessonRanking || lessonRanking.worst.length === 0) && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: '#6b7280' }}>
                          データがありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </div>
          </section>

          {/* Improvement Tracker */}
          <section
            className={styles.trackerSection}
            data-testid="admin-metrics-improvement-tracker"
          >
            <h2 className={styles.sectionTitle}>Improvement Tracker</h2>
            <Card className={styles.trackerCard}>
              <table className={styles.trackerTable}>
                <thead>
                  <tr>
                    <th>Lesson</th>
                    <th>Hint Type</th>
                    <th className={styles.numericCell}>Baseline</th>
                    <th className={styles.numericCell}>Current</th>
                    <th className={styles.numericCell}>Delta</th>
                    <th>Status</th>
                    <th>Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {improvementTracker.map((row) => {
                    const deltaDisplay =
                      row.delta !== null
                        ? `${row.delta > 0 ? '+' : ''}${row.delta.toFixed(1)}%`
                        : '-';
                    const deltaClass =
                      row.delta !== null
                        ? row.delta > 0
                          ? styles.deltaPositive
                          : row.delta < 0
                            ? styles.deltaNegative
                            : styles.deltaNeutral
                        : '';

                    return (
                      <tr key={`${row.lessonSlug}-${row.hintType}`}>
                        <td className={styles.lessonCell} title={row.lessonSlug}>
                          {row.lessonTitle}
                        </td>
                        <td className={styles.hintTypeCell}>{row.hintType}</td>
                        <td className={styles.numericCell}>{row.baselineRate}%</td>
                        <td className={styles.numericCell}>
                          {row.currentRate !== null ? `${row.currentRate}%` : '-'}
                        </td>
                        <td className={`${styles.numericCell} ${deltaClass}`}>{deltaDisplay}</td>
                        <td className={styles.statusCell}>
                          {row.isLowSample && (
                            <span className={styles.lowSampleBadge}>low sample</span>
                          )}
                        </td>
                        <td className={styles.issueCell}>
                          <a
                            href={row.issueUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.issueLink}
                          >
                            #{row.issueNumber}
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                  {improvementTracker.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#6b7280' }}>
                        改善中のレッスンはありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

// Simple trend chart for admin (using SVG like LearningTrendChart)
interface AdminTrendChartProps {
  data: { x: string; y: number }[];
}

function AdminTrendChart({ data }: AdminTrendChartProps) {
  const hasData = data.some((d) => d.y > 0);
  const maxValue = Math.max(...data.map((d) => d.y), 1);

  if (!hasData) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>📊</span>
        <span className={styles.emptyText}>まだ学習データがありません</span>
      </div>
    );
  }

  const chartWidth = 560;
  const chartHeight = 145;
  const padding = { top: 10, right: 10, bottom: 25, left: 30 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const barWidth = innerWidth / data.length;
  const barPadding = 1;

  const yTicks = [0, maxValue * 0.5, maxValue];

  return (
    <div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 0.75rem' }}>
        日次イベント数（30日）
      </h3>
      <svg
        width="100%"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Y-axis grid lines */}
          {yTicks.map((tick, i) => {
            const y = innerHeight - (tick / maxValue) * innerHeight;
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={innerWidth} y2={y} stroke="#e5e7eb" strokeWidth={1} />
                <text x={-5} y={y + 3} textAnchor="end" fontSize={10} fill="#6b7280">
                  {Math.round(tick)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((point, i) => {
            const barHeight = (point.y / maxValue) * innerHeight;
            const x = i * barWidth + barPadding;
            const y = innerHeight - barHeight;
            const width = barWidth - barPadding * 2;

            return (
              <rect
                key={point.x}
                x={x}
                y={y}
                width={Math.max(width, 1)}
                height={Math.max(barHeight, 0)}
                fill="#3b82f6"
                rx={1}
              />
            );
          })}

          {/* X-axis labels (every 5 days) */}
          {data.map((point, i) => {
            if (i % 5 !== 0) return null;
            const x = i * barWidth + barWidth / 2;
            return (
              <text
                key={`label-${point.x}`}
                x={x}
                y={innerHeight + 15}
                textAnchor="middle"
                fontSize={9}
                fill="#6b7280"
              >
                {point.x.slice(5)}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
