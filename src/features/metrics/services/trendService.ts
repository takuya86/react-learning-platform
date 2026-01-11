/**
 * Trend Service
 *
 * 学習量推移グラフ用の集計ロジック
 *
 * ## 仕様
 * - 30日モード: 日単位（UTC）、今日を含む過去30日
 * - 12週モード: 週単位（月曜開始, UTC）、今週を含む過去12週
 * - 歯抜け禁止: レンジを先に生成し、0で初期化してからイベントを加算
 */

import { getUTCDateString, getWeekStartUTC, type LearningEvent } from './metricsService';

export interface DailyTrendPoint {
  date: string; // YYYY-MM-DD (UTC)
  count: number;
}

export interface WeeklyTrendPoint {
  weekStart: string; // YYYY-MM-DD (Monday, UTC)
  count: number;
}

export type TrendMode = 'daily' | 'weekly';

/**
 * Generate an array of daily dates (UTC)
 * Returns dates in ascending order (oldest first)
 *
 * @param days - Number of days to include
 * @param todayUtc - Reference date for "today" (default: current UTC date)
 */
export function generateDailyRangeUTC(days: number = 30, todayUtc?: string): string[] {
  const today = todayUtc || getUTCDateString();
  const todayDate = new Date(today + 'T00:00:00Z');

  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(todayDate);
    date.setUTCDate(date.getUTCDate() - i);
    dates.push(getUTCDateString(date));
  }

  return dates;
}

/**
 * Generate an array of week start dates (Monday, UTC)
 * Returns week starts in ascending order (oldest first)
 *
 * @param weeks - Number of weeks to include
 * @param todayUtc - Reference date for "today" (default: current UTC date)
 */
export function generateWeeklyRangeUTC(weeks: number = 12, todayUtc?: string): string[] {
  const today = todayUtc || getUTCDateString();
  const todayDate = new Date(today + 'T00:00:00Z');
  const currentWeekStart = getWeekStartUTC(todayDate);

  const weekStarts: string[] = [];
  const currentWeekDate = new Date(currentWeekStart + 'T00:00:00Z');

  for (let i = weeks - 1; i >= 0; i--) {
    const weekDate = new Date(currentWeekDate);
    weekDate.setUTCDate(weekDate.getUTCDate() - i * 7);
    weekStarts.push(getUTCDateString(weekDate));
  }

  return weekStarts;
}

/**
 * Get the week start (Monday) for a given date
 */
function getWeekStartForDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  return getWeekStartUTC(date);
}

/**
 * Aggregate events by day
 *
 * @param events - Learning events to aggregate
 * @param dailyRange - Array of dates to include (pre-generated)
 */
export function aggregateByDay(events: LearningEvent[], dailyRange: string[]): DailyTrendPoint[] {
  // Initialize all days with 0
  const countMap = new Map<string, number>();
  for (const date of dailyRange) {
    countMap.set(date, 0);
  }

  // Count events
  const rangeSet = new Set(dailyRange);
  for (const event of events) {
    const date = event.event_date;
    if (rangeSet.has(date)) {
      countMap.set(date, (countMap.get(date) || 0) + 1);
    }
  }

  // Convert to array
  return dailyRange.map((date) => ({
    date,
    count: countMap.get(date) || 0,
  }));
}

/**
 * Aggregate events by week
 *
 * @param events - Learning events to aggregate
 * @param weeklyRange - Array of week start dates to include (pre-generated)
 */
export function aggregateByWeek(
  events: LearningEvent[],
  weeklyRange: string[]
): WeeklyTrendPoint[] {
  // Initialize all weeks with 0
  const countMap = new Map<string, number>();
  for (const weekStart of weeklyRange) {
    countMap.set(weekStart, 0);
  }

  // Count events by their week
  const rangeSet = new Set(weeklyRange);
  for (const event of events) {
    const weekStart = getWeekStartForDate(event.event_date);
    if (rangeSet.has(weekStart)) {
      countMap.set(weekStart, (countMap.get(weekStart) || 0) + 1);
    }
  }

  // Convert to array
  return weeklyRange.map((weekStart) => ({
    weekStart,
    count: countMap.get(weekStart) || 0,
  }));
}

/**
 * Get trend data for the specified mode
 *
 * @param events - Learning events to aggregate
 * @param mode - 'daily' (30 days) or 'weekly' (12 weeks)
 * @param todayUtc - Reference date for "today" (default: current UTC date)
 */
export function getTrendData(
  events: LearningEvent[],
  mode: TrendMode,
  todayUtc?: string
): { x: string; y: number }[] {
  if (mode === 'daily') {
    const range = generateDailyRangeUTC(30, todayUtc);
    const data = aggregateByDay(events, range);
    return data.map((d) => ({ x: d.date, y: d.count }));
  } else {
    const range = generateWeeklyRangeUTC(12, todayUtc);
    const data = aggregateByWeek(events, range);
    return data.map((d) => ({ x: d.weekStart, y: d.count }));
  }
}

/**
 * Format date for display in chart
 *
 * @param dateStr - YYYY-MM-DD date string
 * @param mode - 'daily' or 'weekly'
 */
export function formatDateLabel(dateStr: string, mode: TrendMode): string {
  if (mode === 'daily') {
    // Show as MM/DD
    const [, month, day] = dateStr.split('-');
    return `${parseInt(month)}/${parseInt(day)}`;
  } else {
    // Show as week number or short format
    const date = new Date(dateStr + 'T00:00:00Z');
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return `${month}/${day}~`;
  }
}
