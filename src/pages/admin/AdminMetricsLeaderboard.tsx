import { useState } from 'react';
import { Card } from '@/components/ui';
import {
  type Leaderboards,
  type LeaderboardEntry,
  type LessonRanking,
  type LessonRankingByOrigin,
  type LessonRankingRow,
  type LessonImprovementHint,
  generateLessonHint,
} from '@/features/metrics';
import type { OriginEventType } from '@/features/metrics/constants';
import { CreateIssueButton } from '@/features/admin';
import styles from '../AdminMetricsPage.module.css';

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

/**
 * P3-2.4: Origin type labels for tab display
 */
const ORIGIN_LABELS: Record<OriginEventType, string> = {
  lesson_viewed: 'レッスン閲覧',
  lesson_completed: 'レッスン完了',
  review_started: '復習',
};

interface AdminMetricsLeaderboardProps {
  leaderboards: Leaderboards | null;
  lessonRanking: LessonRanking | null;
  lessonRankingByOrigin: LessonRankingByOrigin | null;
}

export function AdminMetricsLeaderboard({
  leaderboards,
  lessonRanking,
  lessonRankingByOrigin,
}: AdminMetricsLeaderboardProps) {
  // P3-2.4: Origin tab selection state
  const [selectedOrigin, setSelectedOrigin] = useState<OriginEventType>('lesson_viewed');

  return (
    <>
      {/* User Leaderboards */}
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
                {leaderboards?.byThirtyDayEvents.map((entry: LeaderboardEntry, index: number) => (
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
                {leaderboards?.byStreak.map((entry: LeaderboardEntry, index: number) => (
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
                    <td className={styles.numericCell}>{entry.lastEventDate?.slice(5) ?? '-'}</td>
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
      <section className={styles.leaderboardsSection} data-testid="admin-metrics-lesson-ranking">
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

      {/* P3-2.4: Origin-based Lesson Ranking */}
      <section className={styles.leaderboardsSection} data-testid="admin-metrics-origin-ranking">
        <h2 className={styles.sectionTitle}>Origin別 Lesson Ranking</h2>

        {/* Origin Tab Selector */}
        <div className={styles.originTabs} data-testid="origin-ranking-tabs">
          {(['lesson_viewed', 'lesson_completed', 'review_started'] as OriginEventType[]).map(
            (origin) => (
              <button
                key={origin}
                type="button"
                className={`${styles.originTab} ${selectedOrigin === origin ? styles.active : ''}`}
                onClick={() => setSelectedOrigin(origin)}
                data-testid={`origin-tab-${origin}`}
              >
                {ORIGIN_LABELS[origin]}
              </button>
            )
          )}
        </div>

        {/* Origin Ranking Tables */}
        <div className={styles.leaderboardsGrid}>
          {/* Best by Origin */}
          <Card className={styles.leaderboardCard}>
            <h3 className={styles.leaderboardTitle}>
              Best Top5（{ORIGIN_LABELS[selectedOrigin]}起点）
            </h3>
            <table className={styles.leaderboardTable}>
              <thead>
                <tr>
                  <th className={styles.rankCell}>#</th>
                  <th>レッスン</th>
                  <th className={styles.numericCell}>母数</th>
                  <th className={styles.numericCell}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {lessonRankingByOrigin?.[selectedOrigin]?.best.map((row, index) => (
                  <tr key={row.slug} data-testid={`origin-best-${row.slug}`}>
                    <td className={styles.rankCell}>
                      <span className={`${styles.rank} ${index < 3 ? styles.top : ''}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className={styles.userIdCell} title={row.slug}>
                      {row.title}
                      {row.isLowSample && <span className={styles.lowSampleBadge}>low sample</span>}
                    </td>
                    <td className={styles.numericCell}>{row.originCount}</td>
                    <td className={styles.numericCell}>{row.followUpRate}%</td>
                  </tr>
                ))}
                {(!lessonRankingByOrigin ||
                  !lessonRankingByOrigin[selectedOrigin]?.best.length) && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280' }}>
                      データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          {/* Worst by Origin */}
          <Card className={styles.leaderboardCard}>
            <h3 className={styles.leaderboardTitle}>
              Worst Top5（{ORIGIN_LABELS[selectedOrigin]}起点）
            </h3>
            <table className={styles.leaderboardTable}>
              <thead>
                <tr>
                  <th className={styles.rankCell}>#</th>
                  <th>レッスン</th>
                  <th className={styles.numericCell}>母数</th>
                  <th className={styles.numericCell}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {lessonRankingByOrigin?.[selectedOrigin]?.worst.map((row, index) => (
                  <tr key={row.slug} data-testid={`origin-worst-${row.slug}`}>
                    <td className={styles.rankCell}>
                      <span className={`${styles.rank} ${index < 3 ? styles.top : ''}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className={styles.userIdCell} title={row.slug}>
                      {row.title}
                      {row.isLowSample && <span className={styles.lowSampleBadge}>low sample</span>}
                    </td>
                    <td className={styles.numericCell}>{row.originCount}</td>
                    <td className={styles.numericCell}>{row.followUpRate}%</td>
                  </tr>
                ))}
                {(!lessonRankingByOrigin ||
                  !lessonRankingByOrigin[selectedOrigin]?.worst.length) && (
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
    </>
  );
}
