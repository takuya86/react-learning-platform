/**
 * Daily Events Service
 *
 * 日別の学習イベント取得・表示用ロジック
 *
 * ## 仕様
 * - UTC基準の日付
 * - イベント一覧と関連リンク生成
 */

import type { LearningEvent, LearningEventType } from '@/features/metrics/services/metricsService';

export type EventIconName = 'book-open' | 'file-text' | 'notebook' | 'pin';

export interface DailyEventDisplay {
  id: string;
  eventType: LearningEventType;
  referenceId: string;
  displayTitle: string;
  displayIconName: EventIconName;
  linkPath: string | null;
  createdAt: string | null;
}

export interface DailyEventsResult {
  date: string;
  events: DailyEventDisplay[];
  totalCount: number;
  isEmpty: boolean;
}

/**
 * Get display title for event type
 */
export function getEventTypeDisplayTitle(eventType: LearningEventType): string {
  switch (eventType) {
    case 'lesson_completed':
      return 'レッスン完了';
    case 'quiz_completed':
      return 'クイズ完了';
    case 'note_updated':
      return 'ノート更新';
    default:
      return '学習活動';
  }
}

/**
 * Get icon name for event type
 */
export function getEventTypeIconName(eventType: LearningEventType): EventIconName {
  switch (eventType) {
    case 'lesson_completed':
      return 'book-open';
    case 'quiz_completed':
      return 'file-text';
    case 'note_updated':
      return 'notebook';
    default:
      return 'pin';
  }
}

/**
 * Get link path for event
 */
export function getEventLinkPath(eventType: LearningEventType, referenceId: string): string | null {
  if (!referenceId) return null;

  switch (eventType) {
    case 'lesson_completed':
      return `/lessons/${referenceId}`;
    case 'quiz_completed':
      return `/quiz/${referenceId}`;
    case 'note_updated':
      return `/lessons/${referenceId}`;
    default:
      return null;
  }
}

/**
 * Convert raw learning event to display format
 */
export function convertToDisplayEvent(event: LearningEvent, index: number): DailyEventDisplay {
  return {
    id: event.id || `event-${index}`,
    eventType: event.event_type,
    referenceId: event.reference_id || '',
    displayTitle: getEventTypeDisplayTitle(event.event_type),
    displayIconName: getEventTypeIconName(event.event_type),
    linkPath: getEventLinkPath(event.event_type, event.reference_id || ''),
    createdAt: event.created_at || null,
  };
}

/**
 * Build daily events result from raw events
 */
export function buildDailyEventsResult(date: string, events: LearningEvent[]): DailyEventsResult {
  const displayEvents = events.map((event, i) => convertToDisplayEvent(event, i));

  return {
    date,
    events: displayEvents,
    totalCount: displayEvents.length,
    isEmpty: displayEvents.length === 0,
  };
}

/**
 * Format date for display (YYYY-MM-DD -> M月D日)
 */
export function formatDateForDisplay(dateStr: string): string {
  const [, month, day] = dateStr.split('-').map(Number);
  return `${month}月${day}日`;
}

/**
 * Get day of week in Japanese
 */
export function getDayOfWeekJapanese(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getUTCDay()];
}
