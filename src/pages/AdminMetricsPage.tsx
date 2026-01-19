import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import {
  useAdminMetrics,
  useImprovementRoi,
  LifecycleStatsCard,
  type AdminPeriod,
  type RoiStatus,
} from '@/features/metrics';
import { CreateIssueButton } from '@/features/admin';
import {
  AdminMetricsSummary,
  AdminMetricsTrend,
  AdminMetricsHeatmap,
  AdminMetricsLeaderboard,
} from './admin';
import styles from './AdminMetricsPage.module.css';

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
    effectivenessBreakdown,
    lessonRanking,
    lessonRankingByOrigin,
    improvementTracker,
    priorityRanking,
    nextBestImprovement,
    isLoading,
    error,
  } = useAdminMetrics();

  const { roiList, isLoading: roiLoading, error: roiError } = useImprovementRoi();

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
          {/* Summary Cards & Streak Distribution */}
          <AdminMetricsSummary summary={summary} period={period} />

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

            {/* P3-1: Origin別内訳テーブル - review_started起点の効果を測る */}
            {effectivenessBreakdown && (
              <div className={styles.originBreakdown} data-testid="effectiveness-breakdown">
                <h3 className={styles.breakdownTitle}>起点別 Follow-up率</h3>
                <table className={styles.breakdownTable}>
                  <thead>
                    <tr>
                      <th>起点</th>
                      <th>件数</th>
                      <th>Follow-up率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {effectivenessBreakdown.byOrigin.map((row) => (
                      <tr key={row.originType} data-testid={`breakdown-${row.originType}`}>
                        <td>{formatActionLabel(row.originType)}</td>
                        <td>{row.originCount}</td>
                        <td>{row.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Charts */}
          <section className={styles.chartsSection}>
            <AdminMetricsTrend data={trendData} />
            <AdminMetricsHeatmap data={heatmapData} />
          </section>

          {/* Leaderboards */}
          <AdminMetricsLeaderboard
            leaderboards={leaderboards}
            lessonRanking={lessonRanking}
            lessonRankingByOrigin={lessonRankingByOrigin}
          />

          {/* Next Best Improvement */}
          <section className={styles.nextBestSection} data-testid="next-best-improvement">
            <h2 className={styles.sectionTitle}>Next Best Improvement</h2>
            {nextBestImprovement ? (
              <Card className={styles.priorityCard}>
                <CardContent className={styles.priorityCardContent}>
                  <div className={styles.priorityHeader}>
                    <div className={styles.lessonInfo}>
                      <h3 className={styles.lessonTitle}>{nextBestImprovement.lessonTitle}</h3>
                      <span className={styles.lessonSlug}>{nextBestImprovement.lessonSlug}</span>
                    </div>
                    <div className={styles.priorityScoreDisplay}>
                      <span className={styles.priorityScoreLabel}>Priority Score</span>
                      <span className={styles.priorityScoreValue}>
                        {nextBestImprovement.priority.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.breakdown}>
                    <div className={styles.breakdownItem}>
                      <span className={styles.breakdownLabel}>ROI</span>
                      <span className={styles.breakdownValue}>
                        {nextBestImprovement.priority.breakdown.roiScore.toFixed(1)}%
                      </span>
                    </div>
                    <div className={styles.breakdownItem}>
                      <span className={styles.breakdownLabel}>Origin Count</span>
                      <span className={styles.breakdownValue}>
                        {nextBestImprovement.originCount}
                      </span>
                    </div>
                    <div className={styles.breakdownItem}>
                      <span className={styles.breakdownLabel}>Strategy Weight</span>
                      <span className={styles.breakdownValue}>
                        {nextBestImprovement.priority.breakdown.strategyWeight.toFixed(1)}x
                      </span>
                    </div>
                    <div className={styles.breakdownItem}>
                      <span className={styles.breakdownLabel}>Hint Type</span>
                      <span className={styles.breakdownValue}>
                        {nextBestImprovement.hintType ?? '-'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.issueAction}>
                    <CreateIssueButton
                      row={{
                        slug: nextBestImprovement.lessonSlug,
                        title: nextBestImprovement.lessonTitle,
                        difficulty: 'beginner',
                        originCount: nextBestImprovement.originCount,
                        followUpCount: Math.round(
                          (nextBestImprovement.followUpRate / 100) * nextBestImprovement.originCount
                        ),
                        followUpRate: Math.round(nextBestImprovement.followUpRate),
                        followUpCounts: {},
                        isLowSample: false,
                      }}
                      hint={
                        nextBestImprovement.hintType
                          ? {
                              type: nextBestImprovement.hintType,
                              message: `Improve ${nextBestImprovement.lessonTitle}`,
                            }
                          : null
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className={styles.emptyState}>
                  <span className={styles.emptyText}>改善すべきレッスンはありません</span>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Priority Queue */}
          <section className={styles.priorityQueueSection} data-testid="priority-queue">
            <h2 className={styles.sectionTitle}>Improvement Priority Queue</h2>
            <Card className={styles.priorityQueueCard}>
              <table className={styles.priorityQueueTable}>
                <thead>
                  <tr>
                    <th className={styles.rankCell}>Rank</th>
                    <th>Lesson</th>
                    <th className={styles.numericCell}>Priority Score</th>
                    <th className={styles.numericCell}>ROI</th>
                    <th className={styles.numericCell}>Origin Count</th>
                    <th>Hint Type</th>
                    <th>Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {priorityRanking.slice(0, 10).map((item, index) => {
                    const isTopPriority = index === 0 && !item.isLowSample;
                    return (
                      <tr
                        key={item.lessonSlug}
                        className={item.isLowSample ? styles.lowSampleRow : ''}
                      >
                        <td className={styles.rankCell}>
                          <span className={`${styles.rank} ${isTopPriority ? styles.top : ''}`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className={styles.lessonCell} title={item.lessonSlug}>
                          {item.lessonTitle}
                          {item.isLowSample && (
                            <span className={styles.lowSampleBadge}>low sample</span>
                          )}
                        </td>
                        <td className={styles.numericCell}>{item.priority.score.toFixed(1)}</td>
                        <td className={styles.numericCell}>
                          {item.priority.breakdown.roiScore.toFixed(1)}%
                        </td>
                        <td className={styles.numericCell}>{item.originCount}</td>
                        <td className={styles.hintTypeCell}>{item.hintType ?? '-'}</td>
                        <td className={styles.issueCell}>
                          {!item.isLowSample && item.hintType && (
                            <CreateIssueButton
                              row={{
                                slug: item.lessonSlug,
                                title: item.lessonTitle,
                                difficulty: 'beginner',
                                originCount: item.originCount,
                                followUpCount: Math.round(
                                  (item.followUpRate / 100) * item.originCount
                                ),
                                followUpRate: Math.round(item.followUpRate),
                                followUpCounts: {},
                                isLowSample: false,
                              }}
                              hint={
                                item.hintType
                                  ? {
                                      type: item.hintType,
                                      message: `Improve ${item.lessonTitle}`,
                                    }
                                  : null
                              }
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {priorityRanking.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#6b7280' }}>
                        優先順位データがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
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

          {/* Improvement ROI */}
          <section className={styles.roiSection} data-testid="admin-metrics-improvement-roi">
            <h2 className={styles.sectionTitle}>Improvement ROI</h2>
            {roiError && (
              <div className={styles.errorBanner}>ROIデータの取得に失敗しました: {roiError}</div>
            )}
            {roiLoading ? (
              <div className={styles.loadingState}>ROIデータを読み込み中...</div>
            ) : (
              <Card className={styles.roiCard}>
                <table className={styles.roiTable}>
                  <thead>
                    <tr>
                      <th>Lesson</th>
                      <th>Issue</th>
                      <th className={styles.numericCell}>Δ Follow-up Rate</th>
                      <th className={styles.numericCell}>Δ Completion Rate</th>
                      <th>Status</th>
                      <th>Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roiList.map((roi) => {
                      const followUpDisplay =
                        roi.deltaFollowUpRate !== null
                          ? `${roi.deltaFollowUpRate > 0 ? '+' : ''}${roi.deltaFollowUpRate.toFixed(1)}%`
                          : '-';
                      const followUpClass =
                        roi.deltaFollowUpRate !== null
                          ? roi.deltaFollowUpRate > 0
                            ? styles.deltaPositive
                            : roi.deltaFollowUpRate < 0
                              ? styles.deltaNegative
                              : styles.deltaNeutral
                          : '';

                      const completionDisplay =
                        roi.deltaCompletionRate !== null
                          ? `${roi.deltaCompletionRate > 0 ? '+' : ''}${roi.deltaCompletionRate.toFixed(1)}%`
                          : '-';

                      const statusClass = getStatusClass(roi.status);

                      return (
                        <tr key={`${roi.lessonSlug}-${roi.issueNumber}`}>
                          <td className={styles.lessonCell} title={roi.lessonSlug}>
                            {roi.lessonTitle}
                          </td>
                          <td className={styles.issueCell}>
                            <a
                              href={roi.issueUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.issueLink}
                            >
                              #{roi.issueNumber}
                            </a>
                          </td>
                          <td className={`${styles.numericCell} ${followUpClass}`}>
                            {followUpDisplay}
                          </td>
                          <td className={styles.numericCell}>{completionDisplay}</td>
                          <td className={styles.statusCell}>
                            <span className={`${styles.statusBadge} ${statusClass}`}>
                              {roi.status}
                            </span>
                          </td>
                          <td className={styles.periodCell}>
                            <div className={styles.periodInfo}>
                              <span className={styles.periodLabel}>Before:</span> {roi.beforePeriod}
                              <br />
                              <span className={styles.periodLabel}>After:</span> {roi.afterPeriod}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {roiList.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: '#6b7280' }}>
                          完了した改善Issueはありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            )}
          </section>

          {/* Lifecycle Decisions */}
          <section className={styles.lifecycleSection} data-testid="admin-metrics-lifecycle">
            <LifecycleStatsCard />
          </section>
        </>
      )}
    </div>
  );
}

/**
 * Get CSS class for ROI status badge
 */
function getStatusClass(status: RoiStatus): string {
  switch (status) {
    case 'IMPROVED':
      return 'statusImproved';
    case 'REGRESSED':
      return 'statusRegressed';
    case 'NO_CHANGE':
      return 'statusNoChange';
    case 'INSUFFICIENT_DATA':
      return 'statusInsufficient';
    default:
      return '';
  }
}
