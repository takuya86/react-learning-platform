import { describe, it, expect } from 'vitest';
import { buildStreakAlert } from '@/features/actionable/services/streakAlertService';

describe('streakAlertService', () => {
  describe('buildStreakAlert', () => {
    describe('no alert conditions', () => {
      it('returns none for streak=0', () => {
        const result = buildStreakAlert('ACTIVE_YESTERDAY', 0);
        expect(result.show).toBe(false);
        expect(result.type).toBe('none');
      });

      it('returns none for BROKEN', () => {
        const result = buildStreakAlert('BROKEN', 5);
        expect(result.show).toBe(false);
        expect(result.type).toBe('none');
      });

      it('returns none for NO_ACTIVITY_YET', () => {
        const result = buildStreakAlert('NO_ACTIVITY_YET', 0);
        expect(result.show).toBe(false);
        expect(result.type).toBe('none');
      });

      it('returns none for UNKNOWN', () => {
        const result = buildStreakAlert('UNKNOWN', 5);
        expect(result.show).toBe(false);
        expect(result.type).toBe('none');
      });
    });

    describe('success alert (ACTIVE_TODAY)', () => {
      it('returns success alert', () => {
        const result = buildStreakAlert('ACTIVE_TODAY', 5);

        expect(result.show).toBe(true);
        expect(result.type).toBe('success');
        expect(result.message).toBe('今日学習済み');
        expect(result.subMessage).toBe('5日連続 継続中');
        expect(result.icon).toBe('✅');
      });
    });

    describe('warning alert (ACTIVE_YESTERDAY)', () => {
      it('returns warning alert when streak > 0', () => {
        const result = buildStreakAlert('ACTIVE_YESTERDAY', 3);

        expect(result.show).toBe(true);
        expect(result.type).toBe('warning');
        expect(result.message).toBe('今日学習するとstreak継続');
        expect(result.subMessage).toBe('現在3日連続');
        expect(result.icon).toBe('⚠️');
      });
    });

    describe('recovered alert', () => {
      it('returns success alert for RECOVERED', () => {
        const result = buildStreakAlert('RECOVERED', 1);

        expect(result.show).toBe(true);
        expect(result.type).toBe('success');
        expect(result.message).toBe('学習再開しました！');
        expect(result.subMessage).toBe('新しいstreakのスタートです');
        expect(result.icon).toBe('🔥');
      });
    });
  });

  describe('spec-locking', () => {
    it('[spec-lock] ACTIVE_YESTERDAY with streak=0 does not show', () => {
      const result = buildStreakAlert('ACTIVE_YESTERDAY', 0);
      expect(result.show).toBe(false);
    });

    it('[spec-lock] ACTIVE_TODAY with streak=1 shows success', () => {
      const result = buildStreakAlert('ACTIVE_TODAY', 1);
      expect(result.show).toBe(true);
      expect(result.type).toBe('success');
    });

    it('[spec-lock] warning type shows for ACTIVE_YESTERDAY with streak>0', () => {
      const result = buildStreakAlert('ACTIVE_YESTERDAY', 7);
      expect(result.type).toBe('warning');
    });
  });
});
