/**
 * Lifecycle Idempotency Service Tests
 *
 * spec-lock tests for idempotency logic
 */

import { describe, it, expect } from 'vitest';
import {
  buildLifecycleReferenceId,
  shouldSkipDecision,
  buildLifecycleAppliedEvent,
  parseLifecycleReferenceId,
} from './lifecycleIdempotencyService';

describe('lifecycleIdempotencyService', () => {
  describe('buildLifecycleReferenceId', () => {
    it('builds correct reference ID format', () => {
      const result = buildLifecycleReferenceId(123, 'CLOSE_NO_EFFECT');
      expect(result).toBe('issue:123:CLOSE_NO_EFFECT');
    });

    it('handles different decisions', () => {
      expect(buildLifecycleReferenceId(456, 'REDESIGN_REQUIRED')).toBe(
        'issue:456:REDESIGN_REQUIRED'
      );
      expect(buildLifecycleReferenceId(789, 'CONTINUE')).toBe('issue:789:CONTINUE');
    });
  });

  describe('shouldSkipDecision', () => {
    it('returns true when reference ID exists in set', () => {
      const appliedSet = new Set(['issue:123:CLOSE_NO_EFFECT', 'issue:456:REDESIGN_REQUIRED']);

      expect(shouldSkipDecision(appliedSet, 123, 'CLOSE_NO_EFFECT')).toBe(true);
      expect(shouldSkipDecision(appliedSet, 456, 'REDESIGN_REQUIRED')).toBe(true);
    });

    it('returns false when reference ID does not exist', () => {
      const appliedSet = new Set(['issue:123:CLOSE_NO_EFFECT']);

      expect(shouldSkipDecision(appliedSet, 123, 'REDESIGN_REQUIRED')).toBe(false);
      expect(shouldSkipDecision(appliedSet, 999, 'CLOSE_NO_EFFECT')).toBe(false);
    });

    it('returns false for empty set', () => {
      const appliedSet = new Set<string>();

      expect(shouldSkipDecision(appliedSet, 123, 'CLOSE_NO_EFFECT')).toBe(false);
    });

    it('same issue with different decisions are treated separately', () => {
      const appliedSet = new Set(['issue:123:CLOSE_NO_EFFECT']);

      // Same issue, different decision = not skipped
      expect(shouldSkipDecision(appliedSet, 123, 'REDESIGN_REQUIRED')).toBe(false);
      // Same issue, same decision = skipped
      expect(shouldSkipDecision(appliedSet, 123, 'CLOSE_NO_EFFECT')).toBe(true);
    });
  });

  describe('buildLifecycleAppliedEvent', () => {
    it('builds correct event structure', () => {
      const event = buildLifecycleAppliedEvent('system', 123, 'CLOSE_NO_EFFECT', '2026-01-13');

      expect(event).toEqual({
        user_id: 'system',
        event_type: 'lifecycle_applied',
        reference_id: 'issue:123:CLOSE_NO_EFFECT',
        event_date: '2026-01-13',
      });
    });

    it('handles different decisions', () => {
      const event = buildLifecycleAppliedEvent('admin', 456, 'REDESIGN_REQUIRED', '2026-01-10');

      expect(event.reference_id).toBe('issue:456:REDESIGN_REQUIRED');
      expect(event.user_id).toBe('admin');
    });
  });

  describe('parseLifecycleReferenceId', () => {
    it('parses valid reference ID', () => {
      const result = parseLifecycleReferenceId('issue:123:CLOSE_NO_EFFECT');

      expect(result).toEqual({
        issueNumber: 123,
        decision: 'CLOSE_NO_EFFECT',
      });
    });

    it('parses different decisions', () => {
      expect(parseLifecycleReferenceId('issue:456:REDESIGN_REQUIRED')).toEqual({
        issueNumber: 456,
        decision: 'REDESIGN_REQUIRED',
      });

      expect(parseLifecycleReferenceId('issue:789:CONTINUE')).toEqual({
        issueNumber: 789,
        decision: 'CONTINUE',
      });
    });

    it('returns null for invalid format', () => {
      expect(parseLifecycleReferenceId('invalid')).toBeNull();
      expect(parseLifecycleReferenceId('issue:abc:CLOSE')).toBeNull();
      expect(parseLifecycleReferenceId('')).toBeNull();
    });
  });
});
