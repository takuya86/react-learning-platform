/**
 * Admin Metrics Service
 *
 * 管理者向けメトリクス集計ロジック
 * 全ユーザーの学習データを俯瞰するための純粋関数群
 *
 * ## 仕様
 * - アクティブユーザー: 期間内に learning_events が1件以上あるユーザー
 * - 週次目標達成率: weekly_progress >= weekly_goal のユーザー割合
 * - streak分布バケット: 0, 1-2, 3-6, 7-13, 14+
 * - 日付基準: UTC
 */

import { getUTCDateString, type LearningEvent } from './metricsService';
import { getHeatmapLevel, type HeatmapDay } from './heatmapService';

export type AdminPeriod = 'today' | '7d' | '30d';

export interface UserLearningMetric {
  user_id: string;
  streak: number;
  last_event_date: string | null;
  weekly_goal: number;
  weekly_progress: number;
  updated_at?: string;
}

export interface AdminSummary {
  period: AdminPeriod;
  activeUsers: number;
  totalEvents: number;
  avgEventsPerUser: number;
  streakDistribution: StreakDistribution;
  weeklyGoalAchievementRate: number;
}

export interface StreakDistribution {
  bucket0: number; // streak = 0
  bucket1to2: number; // streak 1-2
  bucket3to6: number; // streak 3-6
  bucket7to13: number; // streak 7-13
  bucket14plus: number; // streak 14+
}

export interface LeaderboardEntry {
  userId: string;
  lastEventDate: string | null;
  streak: number;
  weeklyEvents: number;
  thirtyDayEvents: number;
}

export interface Leaderboards {
  byThirtyDayEvents: LeaderboardEntry[];
  byStreak: LeaderboardEntry[];
}

/**
 * Calculate date range for a given period
 */
export function getDateRangeForPeriod(
  period: AdminPeriod,
  today: string = getUTCDateString()
): { startDate: string; endDate: string } {
  const todayDate = new Date(today + 'T00:00:00Z');
  let daysBack = 0;

  switch (period) {
    case 'today':
      daysBack = 0;
      break;
    case '7d':
      daysBack = 6; // today + 6 days back = 7 days total
      break;
    case '30d':
      daysBack = 29; // today + 29 days back = 30 days total
      break;
  }

  const startDate = new Date(todayDate);
  startDate.setUTCDate(startDate.getUTCDate() - daysBack);

  return {
    startDate: getUTCDateString(startDate),
    endDate: today,
  };
}

/**
 * Filter events within a date range
 */
export function filterEventsByDateRange(
  events: LearningEvent[],
  startDate: string,
  endDate: string
): LearningEvent[] {
  return events.filter((event) => event.event_date >= startDate && event.event_date <= endDate);
}

/**
 * Get unique active user IDs from events
 */
export function getActiveUserIds(events: LearningEvent[]): Set<string> {
  return new Set(events.map((e) => e.user_id));
}

/**
 * Calculate streak distribution from user metrics
 */
export function calculateStreakDistribution(userMetrics: UserLearningMetric[]): StreakDistribution {
  const distribution: StreakDistribution = {
    bucket0: 0,
    bucket1to2: 0,
    bucket3to6: 0,
    bucket7to13: 0,
    bucket14plus: 0,
  };

  for (const metric of userMetrics) {
    const streak = metric.streak;
    if (streak === 0) {
      distribution.bucket0++;
    } else if (streak <= 2) {
      distribution.bucket1to2++;
    } else if (streak <= 6) {
      distribution.bucket3to6++;
    } else if (streak <= 13) {
      distribution.bucket7to13++;
    } else {
      distribution.bucket14plus++;
    }
  }

  return distribution;
}

/**
 * Calculate weekly goal achievement rate
 * Returns percentage (0-100) of users who achieved their weekly goal
 */
export function calculateWeeklyGoalAchievementRate(userMetrics: UserLearningMetric[]): number {
  if (userMetrics.length === 0) return 0;

  const achievedCount = userMetrics.filter((m) => m.weekly_progress >= m.weekly_goal).length;

  return Math.round((achievedCount / userMetrics.length) * 100);
}

/**
 * Build admin summary for a given period
 */
export function buildAdminSummary(
  events: LearningEvent[],
  userMetrics: UserLearningMetric[],
  period: AdminPeriod,
  today: string = getUTCDateString()
): AdminSummary {
  const { startDate, endDate } = getDateRangeForPeriod(period, today);
  const filteredEvents = filterEventsByDateRange(events, startDate, endDate);
  const activeUserIds = getActiveUserIds(filteredEvents);
  const activeUsers = activeUserIds.size;
  const totalEvents = filteredEvents.length;
  const avgEventsPerUser = activeUsers > 0 ? Math.round((totalEvents / activeUsers) * 10) / 10 : 0;

  return {
    period,
    activeUsers,
    totalEvents,
    avgEventsPerUser,
    streakDistribution: calculateStreakDistribution(userMetrics),
    weeklyGoalAchievementRate: calculateWeeklyGoalAchievementRate(userMetrics),
  };
}

/**
 * Build events trend data (daily event counts)
 * Returns array from oldest to newest, with 0 for days with no events
 */
export function buildEventsTrend(
  events: LearningEvent[],
  startDate: string,
  endDate: string
): { x: string; y: number }[] {
  // Generate all dates in range
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  const current = new Date(start);

  while (current <= end) {
    dates.push(getUTCDateString(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Count events per date
  const eventCounts = new Map<string, number>();
  for (const event of events) {
    if (event.event_date >= startDate && event.event_date <= endDate) {
      eventCounts.set(event.event_date, (eventCounts.get(event.event_date) || 0) + 1);
    }
  }

  // Build trend data with 0 for missing days
  return dates.map((date) => ({
    x: date,
    y: eventCounts.get(date) || 0,
  }));
}

/**
 * Build events heatmap data (all users aggregated)
 */
export function buildEventsHeatmap(
  events: LearningEvent[],
  days: number = 84,
  today: string = getUTCDateString()
): HeatmapDay[] {
  const todayDate = new Date(today + 'T00:00:00Z');
  const startDate = new Date(todayDate);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  const startDateStr = getUTCDateString(startDate);

  // Generate all dates in range
  const dates: string[] = [];
  const current = new Date(startDate);
  while (current <= todayDate) {
    dates.push(getUTCDateString(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Count events per date (all users)
  const eventCounts = new Map<string, number>();
  for (const event of events) {
    if (event.event_date >= startDateStr && event.event_date <= today) {
      eventCounts.set(event.event_date, (eventCounts.get(event.event_date) || 0) + 1);
    }
  }

  // Build heatmap data
  return dates.map((date) => {
    const count = eventCounts.get(date) || 0;
    return {
      date,
      count,
      level: getHeatmapLevel(count),
    };
  });
}

/**
 * Count events per user for a date range
 */
function countEventsPerUser(
  events: LearningEvent[],
  startDate: string,
  endDate: string
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (event.event_date >= startDate && event.event_date <= endDate) {
      counts.set(event.user_id, (counts.get(event.user_id) || 0) + 1);
    }
  }
  return counts;
}

/**
 * Build leaderboards (top N users by events and streak)
 */
export function buildLeaderboards(
  events: LearningEvent[],
  userMetrics: UserLearningMetric[],
  today: string = getUTCDateString(),
  limit: number = 10
): Leaderboards {
  // Calculate date ranges
  const { startDate: weekStart } = getDateRangeForPeriod('7d', today);
  const { startDate: thirtyDayStart } = getDateRangeForPeriod('30d', today);

  // Count events per user for each period
  const weeklyEventCounts = countEventsPerUser(events, weekStart, today);
  const thirtyDayEventCounts = countEventsPerUser(events, thirtyDayStart, today);

  // Build user map from metrics
  const userMetricsMap = new Map<string, UserLearningMetric>();
  for (const metric of userMetrics) {
    userMetricsMap.set(metric.user_id, metric);
  }

  // Get all unique user IDs
  const allUserIds = new Set<string>([
    ...userMetrics.map((m) => m.user_id),
    ...events.map((e) => e.user_id),
  ]);

  // Build entries for all users
  const entries: LeaderboardEntry[] = Array.from(allUserIds).map((userId) => {
    const metric = userMetricsMap.get(userId);
    return {
      userId,
      lastEventDate: metric?.last_event_date ?? null,
      streak: metric?.streak ?? 0,
      weeklyEvents: weeklyEventCounts.get(userId) || 0,
      thirtyDayEvents: thirtyDayEventCounts.get(userId) || 0,
    };
  });

  // Sort by 30-day events (descending)
  const byThirtyDayEvents = [...entries]
    .sort((a, b) => b.thirtyDayEvents - a.thirtyDayEvents)
    .slice(0, limit);

  // Sort by streak (descending)
  const byStreak = [...entries].sort((a, b) => b.streak - a.streak).slice(0, limit);

  return {
    byThirtyDayEvents,
    byStreak,
  };
}
