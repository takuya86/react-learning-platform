/**
 * Growth Insights Card
 *
 * 「やった → 効果が見える」を実現するUIカード
 *
 * ## 設計方針
 * - 5秒で読める
 * - "増えた"はポジティブに（+2日など）
 * - "減った"も責めない（「今週はスローペース」）
 * - 空状態対応（0件/1週未満）
 */

import { useEffect, useRef } from 'react';
import { Target } from 'lucide-react';
import { Card } from '@/components/ui';
import type { GrowthInsights } from '../services/growthInsightsService';
import styles from './GrowthInsightsCard.module.css';

interface GrowthInsightsCardProps {
  insights: GrowthInsights | null;
  isLoading: boolean;
  error: string | null;
  onViewed?: () => void;
  className?: string;
}

export function GrowthInsightsCard({
  insights,
  isLoading,
  error,
  onViewed,
  className = '',
}: GrowthInsightsCardProps) {
  const hasLoggedRef = useRef(false);

  // Log when card is viewed (once per mount)
  useEffect(() => {
    if (insights && !hasLoggedRef.current && onViewed) {
      onViewed();
      hasLoggedRef.current = true;
    }
  }, [insights, onViewed]);

  // Loading state
  if (isLoading) {
    return (
      <Card
        className={`${styles.card} ${styles.loading} ${className}`}
        data-testid="growth-insights-card"
      >
        <div className={styles.loadingContent} />
      </Card>
    );
  }

  // Error state (silent - don't show error to user)
  if (error || !insights) {
    return null;
  }

  // Empty state - no lifetime events
  if (insights.lifetimeActiveDays === 0) {
    return (
      <Card
        className={`${styles.card} ${styles.empty} ${className}`}
        data-testid="growth-insights-card"
        data-state="empty"
      >
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>🌟</div>
          <p className={styles.emptyMessage}>{insights.message}</p>
          <p className={styles.emptySubMessage}>{insights.subMessage}</p>
        </div>
      </Card>
    );
  }

  // Determine delta styling
  const getDeltaClass = () => {
    if (insights.deltaDays > 0) return styles.deltaPositive;
    if (insights.deltaDays < 0) return styles.deltaNegative;
    return styles.deltaZero;
  };

  const formatDelta = () => {
    if (insights.deltaDays > 0) return `+${insights.deltaDays}`;
    if (insights.deltaDays === 0) return '±0';
    return `${insights.deltaDays}`;
  };

  return (
    <Card
      className={`${styles.card} ${className}`}
      data-testid="growth-insights-card"
      data-state="active"
      data-delta={insights.deltaDays}
    >
      <div className={styles.content}>
        {/* Header with message */}
        <div className={styles.header}>
          <span className={styles.icon}>📈</span>
          <div className={styles.headerText}>
            <p className={styles.title}>今週の成長</p>
            <p className={styles.message}>{insights.message}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{insights.activeDaysThisWeek}</div>
            <div className={styles.statLabel}>今週の学習日数</div>
          </div>
          <div className={styles.stat}>
            <div className={`${styles.statValue} ${getDeltaClass()}`}>{formatDelta()}日</div>
            <div className={styles.statLabel}>先週比</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{insights.lifetimeActiveDays}</div>
            <div className={styles.statLabel}>累積学習日数</div>
          </div>
        </div>

        {/* Sub message */}
        <p className={styles.subMessage}>{insights.subMessage}</p>

        {/* Top focus (optional) */}
        {insights.topFocus && (
          <div className={styles.topFocus}>
            <Target size={16} />
            <span className={styles.topFocusLabel}>
              最も学習したトピック: {insights.topFocus.label} ({insights.topFocus.count}回)
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
