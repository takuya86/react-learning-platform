/**
 * LifecycleStatsCard Component
 *
 * Displays lifecycle decision statistics for Admin Metrics.
 */

import { useLifecycleStats, type LifecycleStats } from '../hooks/useLifecycleStats';
import styles from './LifecycleStatsCard.module.css';

function formatDate(isoString: string | null): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatsTable({ stats, title }: { stats: LifecycleStats; title: string }) {
  return (
    <div className={styles.statsSection}>
      <h4 className={styles.sectionTitle}>{title}</h4>
      <table className={styles.statsTable}>
        <thead>
          <tr>
            <th>Decision</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CLOSE_NO_EFFECT</td>
            <td>{stats.closeNoEffect}</td>
          </tr>
          <tr>
            <td>REDESIGN_REQUIRED</td>
            <td>{stats.redesignRequired}</td>
          </tr>
          <tr>
            <td>CONTINUE</td>
            <td>{stats.continue}</td>
          </tr>
          <tr className={styles.totalRow}>
            <td>Total</td>
            <td>{stats.total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function LifecycleStatsCard() {
  const { stats7Days, stats30Days, isLoading, error } = useLifecycleStats();

  if (isLoading) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Lifecycle Decisions</h3>
        <p className={styles.loading}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Lifecycle Decisions</h3>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Lifecycle Decisions</h3>
      <p className={styles.lastRun}>Last run: {formatDate(stats7Days.lastAppliedAt)}</p>
      <div className={styles.statsContainer}>
        <StatsTable stats={stats7Days} title="Last 7 Days" />
        <StatsTable stats={stats30Days} title="Last 30 Days" />
      </div>
    </div>
  );
}
