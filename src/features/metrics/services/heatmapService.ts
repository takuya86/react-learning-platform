/**
 * Heatmap Service
 *
 * GitHub Contributions 風の学習ヒートマップ用集計ロジック
 *
 * ## 仕様
 * - 表示期間: 直近12週間（84日）
 * - 日付基準: UTC
 * - 色段階（4段階）:
 *   - level 0: 0件
 *   - level 1: 1-2件
 *   - level 2: 3-4件
 *   - level 3: 5件以上
 */

import { getUTCDateString, type LearningEvent } from './metricsService';

export type HeatmapLevel = 0 | 1 | 2 | 3;

export interface HeatmapDay {
  date: string; // YYYY-MM-DD (UTC)
  count: number;
  level: HeatmapLevel;
}

/**
 * Calculate heatmap level from event count
 *
 * - 0件: level 0
 * - 1-2件: level 1
 * - 3-4件: level 2
 * - 5件以上: level 3
 */
export function getHeatmapLevel(count: number): HeatmapLevel {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  return 3;
}

/**
 * Generate array of dates from startDate to endDate (inclusive)
 * Returns dates in ascending order (oldest first)
 */
export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');

  const current = new Date(start);
  while (current <= end) {
    dates.push(getUTCDateString(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

/**
 * Get heatmap data for the specified number of days
 *
 * @param events - Learning events to aggregate
 * @param days - Number of days to include (default: 84 = 12 weeks)
 * @param today - Reference date for "today" (default: current UTC date)
 * @returns Array of HeatmapDay objects, oldest first
 */
export function getHeatmapData(
  events: LearningEvent[],
  days: number = 84,
  today: string = getUTCDateString()
): HeatmapDay[] {
  // Calculate start date (days - 1 days before today)
  const todayDate = new Date(today + 'T00:00:00Z');
  const startDate = new Date(todayDate);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

  // Generate all dates in range
  const dateRange = generateDateRange(getUTCDateString(startDate), today);

  // Count events per date
  const eventCounts = new Map<string, number>();
  for (const event of events) {
    const date = event.event_date;
    // Only count events within our date range
    if (date >= getUTCDateString(startDate) && date <= today) {
      eventCounts.set(date, (eventCounts.get(date) || 0) + 1);
    }
  }

  // Build heatmap data
  return dateRange.map((date) => {
    const count = eventCounts.get(date) || 0;
    return {
      date,
      count,
      level: getHeatmapLevel(count),
    };
  });
}

/**
 * Group heatmap days by week (for grid display)
 * Returns array of weeks, each containing 7 days (or fewer for partial weeks)
 */
export function groupByWeek(heatmapData: HeatmapDay[]): HeatmapDay[][] {
  if (heatmapData.length === 0) return [];

  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  for (const day of heatmapData) {
    const date = new Date(day.date + 'T00:00:00Z');
    const dayOfWeek = date.getUTCDay(); // 0 = Sunday

    // If Sunday and we have days in current week, start new week
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentWeek.push(day);
  }

  // Don't forget the last week
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}
