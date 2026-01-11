import { describe, it, expect } from 'vitest';
import {
  getEventTypeDisplayTitle,
  getEventTypeIcon,
  getEventLinkPath,
  convertToDisplayEvent,
  buildDailyEventsResult,
  formatDateForDisplay,
  getDayOfWeekJapanese,
} from '@/features/actionable/services/dailyEventsService';
import type { LearningEvent } from '@/features/metrics/services/metricsService';

// Helper to create events
function createEvent(
  userId: string,
  eventDate: string,
  eventType: 'lesson_completed' | 'quiz_completed' | 'note_updated' = 'lesson_completed',
  referenceId = ''
): LearningEvent {
  return {
    id: `event-${Math.random()}`,
    user_id: userId,
    event_type: eventType,
    event_date: eventDate,
    reference_id: referenceId,
    created_at: `${eventDate}T12:00:00Z`,
  };
}

describe('dailyEventsService', () => {
  describe('getEventTypeDisplayTitle', () => {
    it('returns correct title for lesson_completed', () => {
      expect(getEventTypeDisplayTitle('lesson_completed')).toBe('レッスン完了');
    });

    it('returns correct title for quiz_completed', () => {
      expect(getEventTypeDisplayTitle('quiz_completed')).toBe('クイズ完了');
    });

    it('returns correct title for note_updated', () => {
      expect(getEventTypeDisplayTitle('note_updated')).toBe('ノート更新');
    });
  });

  describe('getEventTypeIcon', () => {
    it('returns correct icon for lesson_completed', () => {
      expect(getEventTypeIcon('lesson_completed')).toBe('📚');
    });

    it('returns correct icon for quiz_completed', () => {
      expect(getEventTypeIcon('quiz_completed')).toBe('📝');
    });

    it('returns correct icon for note_updated', () => {
      expect(getEventTypeIcon('note_updated')).toBe('📒');
    });
  });

  describe('getEventLinkPath', () => {
    it('returns lesson path for lesson_completed', () => {
      expect(getEventLinkPath('lesson_completed', 'react-basics')).toBe('/lessons/react-basics');
    });

    it('returns quiz path for quiz_completed', () => {
      expect(getEventLinkPath('quiz_completed', 'quiz-1')).toBe('/quiz/quiz-1');
    });

    it('returns lesson path for note_updated', () => {
      expect(getEventLinkPath('note_updated', 'react-hooks')).toBe('/lessons/react-hooks');
    });

    it('returns null for empty referenceId', () => {
      expect(getEventLinkPath('lesson_completed', '')).toBeNull();
    });
  });

  describe('convertToDisplayEvent', () => {
    it('converts event to display format', () => {
      const event = createEvent('user1', '2024-01-15', 'lesson_completed', 'react-basics');
      const display = convertToDisplayEvent(event, 0);

      expect(display.eventType).toBe('lesson_completed');
      expect(display.referenceId).toBe('react-basics');
      expect(display.displayTitle).toBe('レッスン完了');
      expect(display.displayIcon).toBe('📚');
      expect(display.linkPath).toBe('/lessons/react-basics');
    });

    it('uses index for id when event has no id', () => {
      const event: LearningEvent = {
        user_id: 'user1',
        event_type: 'lesson_completed',
        event_date: '2024-01-15',
      };
      const display = convertToDisplayEvent(event, 5);

      expect(display.id).toBe('event-5');
    });
  });

  describe('buildDailyEventsResult', () => {
    it('builds result with events', () => {
      const events = [
        createEvent('user1', '2024-01-15', 'lesson_completed', 'lesson-1'),
        createEvent('user1', '2024-01-15', 'quiz_completed', 'quiz-1'),
      ];

      const result = buildDailyEventsResult('2024-01-15', events);

      expect(result.date).toBe('2024-01-15');
      expect(result.totalCount).toBe(2);
      expect(result.isEmpty).toBe(false);
      expect(result.events).toHaveLength(2);
    });

    it('builds empty result when no events', () => {
      const result = buildDailyEventsResult('2024-01-15', []);

      expect(result.date).toBe('2024-01-15');
      expect(result.totalCount).toBe(0);
      expect(result.isEmpty).toBe(true);
      expect(result.events).toHaveLength(0);
    });
  });

  describe('formatDateForDisplay', () => {
    it('formats date as M月D日', () => {
      expect(formatDateForDisplay('2024-01-15')).toBe('1月15日');
      expect(formatDateForDisplay('2024-12-31')).toBe('12月31日');
    });
  });

  describe('getDayOfWeekJapanese', () => {
    it('returns correct day of week in Japanese', () => {
      // 2024-01-15 is a Monday
      expect(getDayOfWeekJapanese('2024-01-15')).toBe('月');
      // 2024-01-14 is a Sunday
      expect(getDayOfWeekJapanese('2024-01-14')).toBe('日');
      // 2024-01-16 is a Tuesday
      expect(getDayOfWeekJapanese('2024-01-16')).toBe('火');
    });
  });
});
