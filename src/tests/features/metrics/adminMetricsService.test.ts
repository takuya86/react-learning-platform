import { describe, it, expect } from 'vitest';
import {
  getDateRangeForPeriod,
  filterEventsByDateRange,
  getActiveUserIds,
  calculateStreakDistribution,
  calculateWeeklyGoalAchievementRate,
  buildAdminSummary,
  buildEventsTrend,
  buildEventsHeatmap,
  buildLeaderboards,
  type UserLearningMetric,
} from '@/features/metrics/services/adminMetricsService';
import type { LearningEvent } from '@/features/metrics/services/metricsService';

// Helper to create events
function createEvent(
  userId: string,
  eventDate: string,
  eventType: 'lesson_completed' | 'quiz_completed' | 'note_updated' = 'lesson_completed'
): LearningEvent {
  return {
    user_id: userId,
    event_type: eventType,
    event_date: eventDate,
  };
}

// Helper to create user metrics
function createUserMetric(
  userId: string,
  streak: number,
  weeklyProgress: number,
  weeklyGoal: number = 5,
  lastEventDate: string | null = null
): UserLearningMetric {
  return {
    user_id: userId,
    streak,
    last_event_date: lastEventDate,
    weekly_goal: weeklyGoal,
    weekly_progress: weeklyProgress,
  };
}

describe('adminMetricsService', () => {
  describe('getDateRangeForPeriod', () => {
    const today = '2024-01-15';

    it('returns today only for "today" period', () => {
      const result = getDateRangeForPeriod('today', today);
      expect(result.startDate).toBe('2024-01-15');
      expect(result.endDate).toBe('2024-01-15');
    });

    it('returns 7 days for "7d" period', () => {
      const result = getDateRangeForPeriod('7d', today);
      expect(result.startDate).toBe('2024-01-09');
      expect(result.endDate).toBe('2024-01-15');
    });

    it('returns 30 days for "30d" period', () => {
      const result = getDateRangeForPeriod('30d', today);
      expect(result.startDate).toBe('2023-12-17');
      expect(result.endDate).toBe('2024-01-15');
    });

    it('handles year boundary correctly', () => {
      const result = getDateRangeForPeriod('30d', '2024-01-10');
      expect(result.startDate).toBe('2023-12-12');
    });
  });

  describe('filterEventsByDateRange', () => {
    const events: LearningEvent[] = [
      createEvent('user1', '2024-01-10'),
      createEvent('user1', '2024-01-15'),
      createEvent('user2', '2024-01-12'),
      createEvent('user2', '2024-01-20'),
    ];

    it('filters events within date range', () => {
      const result = filterEventsByDateRange(events, '2024-01-11', '2024-01-16');
      expect(result).toHaveLength(2);
      expect(result.map((e) => e.event_date)).toEqual(['2024-01-15', '2024-01-12']);
    });

    it('includes boundary dates', () => {
      const result = filterEventsByDateRange(events, '2024-01-10', '2024-01-12');
      expect(result).toHaveLength(2);
    });

    it('returns empty array for range with no events', () => {
      const result = filterEventsByDateRange(events, '2024-02-01', '2024-02-28');
      expect(result).toHaveLength(0);
    });
  });

  describe('getActiveUserIds', () => {
    it('returns unique user IDs', () => {
      const events: LearningEvent[] = [
        createEvent('user1', '2024-01-10'),
        createEvent('user1', '2024-01-11'),
        createEvent('user2', '2024-01-10'),
        createEvent('user3', '2024-01-12'),
      ];
      const result = getActiveUserIds(events);
      expect(result.size).toBe(3);
      expect(result.has('user1')).toBe(true);
      expect(result.has('user2')).toBe(true);
      expect(result.has('user3')).toBe(true);
    });

    it('returns empty set for no events', () => {
      const result = getActiveUserIds([]);
      expect(result.size).toBe(0);
    });
  });

  describe('calculateStreakDistribution', () => {
    it('counts streak 0 correctly', () => {
      const metrics = [createUserMetric('u1', 0, 0), createUserMetric('u2', 0, 0)];
      const result = calculateStreakDistribution(metrics);
      expect(result.bucket0).toBe(2);
      expect(result.bucket1to2).toBe(0);
    });

    it('counts streak 1-2 correctly', () => {
      const metrics = [createUserMetric('u1', 1, 0), createUserMetric('u2', 2, 0)];
      const result = calculateStreakDistribution(metrics);
      expect(result.bucket1to2).toBe(2);
    });

    it('counts streak 3-6 correctly', () => {
      const metrics = [createUserMetric('u1', 3, 0), createUserMetric('u2', 6, 0)];
      const result = calculateStreakDistribution(metrics);
      expect(result.bucket3to6).toBe(2);
    });

    it('counts streak 7-13 correctly', () => {
      const metrics = [createUserMetric('u1', 7, 0), createUserMetric('u2', 13, 0)];
      const result = calculateStreakDistribution(metrics);
      expect(result.bucket7to13).toBe(2);
    });

    it('counts streak 14+ correctly', () => {
      const metrics = [createUserMetric('u1', 14, 0), createUserMetric('u2', 100, 0)];
      const result = calculateStreakDistribution(metrics);
      expect(result.bucket14plus).toBe(2);
    });

    it('handles mixed streaks correctly', () => {
      const metrics = [
        createUserMetric('u1', 0, 0),
        createUserMetric('u2', 1, 0),
        createUserMetric('u3', 5, 0),
        createUserMetric('u4', 10, 0),
        createUserMetric('u5', 20, 0),
      ];
      const result = calculateStreakDistribution(metrics);
      expect(result.bucket0).toBe(1);
      expect(result.bucket1to2).toBe(1);
      expect(result.bucket3to6).toBe(1);
      expect(result.bucket7to13).toBe(1);
      expect(result.bucket14plus).toBe(1);
    });

    // Spec-locking: bucket boundaries
    it('[spec-lock] streak=2 is in bucket1to2', () => {
      const metrics = [createUserMetric('u1', 2, 0)];
      const result = calculateStreakDistribution(metrics);
      expect(result.bucket1to2).toBe(1);
      expect(result.bucket3to6).toBe(0);
    });

    it('[spec-lock] streak=3 is in bucket3to6', () => {
      const metrics = [createUserMetric('u1', 3, 0)];
      const result = calculateStreakDistribution(metrics);
      expect(result.bucket1to2).toBe(0);
      expect(result.bucket3to6).toBe(1);
    });

    it('[spec-lock] streak=6 is in bucket3to6', () => {
      const metrics = [createUserMetric('u1', 6, 0)];
      const result = calculateStreakDistribution(metrics);
      expect(result.bucket3to6).toBe(1);
      expect(result.bucket7to13).toBe(0);
    });

    it('[spec-lock] streak=7 is in bucket7to13', () => {
      const metrics = [createUserMetric('u1', 7, 0)];
      const result = calculateStreakDistribution(metrics);
      expect(result.bucket3to6).toBe(0);
      expect(result.bucket7to13).toBe(1);
    });

    it('[spec-lock] streak=13 is in bucket7to13', () => {
      const metrics = [createUserMetric('u1', 13, 0)];
      const result = calculateStreakDistribution(metrics);
      expect(result.bucket7to13).toBe(1);
      expect(result.bucket14plus).toBe(0);
    });

    it('[spec-lock] streak=14 is in bucket14plus', () => {
      const metrics = [createUserMetric('u1', 14, 0)];
      const result = calculateStreakDistribution(metrics);
      expect(result.bucket7to13).toBe(0);
      expect(result.bucket14plus).toBe(1);
    });
  });

  describe('calculateWeeklyGoalAchievementRate', () => {
    it('returns 0 for empty metrics', () => {
      expect(calculateWeeklyGoalAchievementRate([])).toBe(0);
    });

    it('returns 100 when all users achieved goal', () => {
      const metrics = [createUserMetric('u1', 0, 5, 5), createUserMetric('u2', 0, 7, 5)];
      expect(calculateWeeklyGoalAchievementRate(metrics)).toBe(100);
    });

    it('returns 0 when no users achieved goal', () => {
      const metrics = [createUserMetric('u1', 0, 2, 5), createUserMetric('u2', 0, 4, 5)];
      expect(calculateWeeklyGoalAchievementRate(metrics)).toBe(0);
    });

    it('calculates percentage correctly', () => {
      const metrics = [
        createUserMetric('u1', 0, 5, 5), // achieved
        createUserMetric('u2', 0, 3, 5), // not achieved
        createUserMetric('u3', 0, 6, 5), // achieved
        createUserMetric('u4', 0, 4, 5), // not achieved
      ];
      expect(calculateWeeklyGoalAchievementRate(metrics)).toBe(50);
    });

    it('[spec-lock] progress == goal counts as achieved', () => {
      const metrics = [createUserMetric('u1', 0, 5, 5)];
      expect(calculateWeeklyGoalAchievementRate(metrics)).toBe(100);
    });

    it('[spec-lock] progress > goal counts as achieved', () => {
      const metrics = [createUserMetric('u1', 0, 10, 5)];
      expect(calculateWeeklyGoalAchievementRate(metrics)).toBe(100);
    });
  });

  describe('buildAdminSummary', () => {
    const today = '2024-01-15';

    it('builds summary for today period', () => {
      const events = [
        createEvent('user1', '2024-01-15'),
        createEvent('user1', '2024-01-15'),
        createEvent('user2', '2024-01-15'),
      ];
      const metrics = [createUserMetric('user1', 5, 5, 5), createUserMetric('user2', 0, 2, 5)];

      const result = buildAdminSummary(events, metrics, 'today', today);

      expect(result.period).toBe('today');
      expect(result.activeUsers).toBe(2);
      expect(result.totalEvents).toBe(3);
      expect(result.avgEventsPerUser).toBe(1.5);
    });

    it('builds summary for 7d period', () => {
      const events = [
        createEvent('user1', '2024-01-10'),
        createEvent('user1', '2024-01-12'),
        createEvent('user2', '2024-01-15'),
        createEvent('user3', '2024-01-01'), // outside range
      ];
      const metrics: UserLearningMetric[] = [];

      const result = buildAdminSummary(events, metrics, '7d', today);

      expect(result.period).toBe('7d');
      expect(result.activeUsers).toBe(2);
      expect(result.totalEvents).toBe(3);
    });

    it('handles no events gracefully', () => {
      const result = buildAdminSummary([], [], '30d', today);

      expect(result.activeUsers).toBe(0);
      expect(result.totalEvents).toBe(0);
      expect(result.avgEventsPerUser).toBe(0);
    });
  });

  describe('buildEventsTrend', () => {
    it('generates trend with all dates filled', () => {
      const events = [
        createEvent('user1', '2024-01-10'),
        createEvent('user1', '2024-01-10'),
        createEvent('user2', '2024-01-12'),
      ];

      const result = buildEventsTrend(events, '2024-01-10', '2024-01-12');

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ x: '2024-01-10', y: 2 });
      expect(result[1]).toEqual({ x: '2024-01-11', y: 0 }); // gap filled with 0
      expect(result[2]).toEqual({ x: '2024-01-12', y: 1 });
    });

    it('fills gaps with zeros', () => {
      const events = [createEvent('user1', '2024-01-15')];

      const result = buildEventsTrend(events, '2024-01-13', '2024-01-15');

      expect(result).toHaveLength(3);
      expect(result[0].y).toBe(0);
      expect(result[1].y).toBe(0);
      expect(result[2].y).toBe(1);
    });

    it('returns all zeros for empty events', () => {
      const result = buildEventsTrend([], '2024-01-10', '2024-01-12');

      expect(result).toHaveLength(3);
      expect(result.every((d) => d.y === 0)).toBe(true);
    });

    it('ignores events outside range', () => {
      const events = [
        createEvent('user1', '2024-01-05'),
        createEvent('user1', '2024-01-10'),
        createEvent('user1', '2024-01-20'),
      ];

      const result = buildEventsTrend(events, '2024-01-08', '2024-01-12');

      expect(result).toHaveLength(5);
      const total = result.reduce((sum, d) => sum + d.y, 0);
      expect(total).toBe(1);
    });
  });

  describe('buildEventsHeatmap', () => {
    const today = '2024-01-15';

    it('generates heatmap for specified days', () => {
      const events = [
        createEvent('user1', '2024-01-15'),
        createEvent('user2', '2024-01-15'),
        createEvent('user1', '2024-01-14'),
      ];

      const result = buildEventsHeatmap(events, 7, today);

      expect(result).toHaveLength(7);
      expect(result[result.length - 1].date).toBe('2024-01-15');
      expect(result[result.length - 1].count).toBe(2);
      expect(result[result.length - 2].count).toBe(1);
    });

    it('calculates heatmap levels correctly', () => {
      const events = [
        // 5 events on same day = level 3
        ...Array(5)
          .fill(null)
          .map(() => createEvent('u1', '2024-01-15')),
        // 3 events = level 2
        ...Array(3)
          .fill(null)
          .map(() => createEvent('u2', '2024-01-14')),
        // 1 event = level 1
        createEvent('u3', '2024-01-13'),
      ];

      const result = buildEventsHeatmap(events, 3, today);

      expect(result[0].level).toBe(1); // 1 event
      expect(result[1].level).toBe(2); // 3 events
      expect(result[2].level).toBe(3); // 5 events
    });

    it('fills missing days with 0 count and level 0', () => {
      const result = buildEventsHeatmap([], 3, today);

      expect(result).toHaveLength(3);
      expect(result.every((d) => d.count === 0 && d.level === 0)).toBe(true);
    });

    // Spec-locking heatmap levels
    it('[spec-lock] 0 events = level 0', () => {
      const result = buildEventsHeatmap([], 1, today);
      expect(result[0].level).toBe(0);
    });

    it('[spec-lock] 1-2 events = level 1', () => {
      const events = [createEvent('u1', today), createEvent('u2', today)];
      const result = buildEventsHeatmap(events, 1, today);
      expect(result[0].level).toBe(1);
    });

    it('[spec-lock] 3-4 events = level 2', () => {
      const events = Array(4)
        .fill(null)
        .map(() => createEvent('u1', today));
      const result = buildEventsHeatmap(events, 1, today);
      expect(result[0].level).toBe(2);
    });

    it('[spec-lock] 5+ events = level 3', () => {
      const events = Array(5)
        .fill(null)
        .map(() => createEvent('u1', today));
      const result = buildEventsHeatmap(events, 1, today);
      expect(result[0].level).toBe(3);
    });
  });

  describe('buildLeaderboards', () => {
    const today = '2024-01-15';

    it('returns top users by 30-day events', () => {
      const events = [
        ...Array(10)
          .fill(null)
          .map(() => createEvent('user1', '2024-01-10')),
        ...Array(5)
          .fill(null)
          .map(() => createEvent('user2', '2024-01-12')),
        ...Array(20)
          .fill(null)
          .map(() => createEvent('user3', '2024-01-14')),
      ];
      const metrics = [
        createUserMetric('user1', 3, 0),
        createUserMetric('user2', 1, 0),
        createUserMetric('user3', 5, 0),
      ];

      const result = buildLeaderboards(events, metrics, today, 10);

      expect(result.byThirtyDayEvents[0].userId).toBe('user3');
      expect(result.byThirtyDayEvents[0].thirtyDayEvents).toBe(20);
      expect(result.byThirtyDayEvents[1].userId).toBe('user1');
      expect(result.byThirtyDayEvents[2].userId).toBe('user2');
    });

    it('returns top users by streak', () => {
      const events: LearningEvent[] = [];
      const metrics = [
        createUserMetric('user1', 10, 0),
        createUserMetric('user2', 5, 0),
        createUserMetric('user3', 20, 0),
      ];

      const result = buildLeaderboards(events, metrics, today, 10);

      expect(result.byStreak[0].userId).toBe('user3');
      expect(result.byStreak[0].streak).toBe(20);
      expect(result.byStreak[1].userId).toBe('user1');
      expect(result.byStreak[2].userId).toBe('user2');
    });

    it('respects limit parameter', () => {
      const metrics = Array(15)
        .fill(null)
        .map((_, i) => createUserMetric(`user${i}`, i, 0));

      const result = buildLeaderboards([], metrics, today, 5);

      expect(result.byStreak).toHaveLength(5);
      expect(result.byThirtyDayEvents).toHaveLength(5);
    });

    it('handles users with events but no metrics', () => {
      const events = [createEvent('newUser', '2024-01-15')];
      const metrics: UserLearningMetric[] = [];

      const result = buildLeaderboards(events, metrics, today, 10);

      expect(result.byThirtyDayEvents).toHaveLength(1);
      expect(result.byThirtyDayEvents[0].userId).toBe('newUser');
      expect(result.byThirtyDayEvents[0].streak).toBe(0);
    });

    it('calculates weekly events correctly', () => {
      const events = [
        createEvent('user1', '2024-01-15'), // today
        createEvent('user1', '2024-01-10'), // within 7d
        createEvent('user1', '2024-01-01'), // outside 7d
      ];
      const metrics = [createUserMetric('user1', 0, 0)];

      const result = buildLeaderboards(events, metrics, today, 10);

      expect(result.byThirtyDayEvents[0].weeklyEvents).toBe(2);
      expect(result.byThirtyDayEvents[0].thirtyDayEvents).toBe(3);
    });
  });
});
