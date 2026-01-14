/**
 * Lifecycle Constants Tests (spec-lock)
 *
 * Safety guard values must not be changed without careful review.
 */

import { describe, it, expect } from 'vitest';
import {
  MAX_ACTIONS_PER_RUN,
  DEFAULT_RUN_MODE,
  REQUIRE_CONFIRM_FLAG_FOR_RUN,
  SAFE_EXIT_ON_MISSING_SECRETS,
  LIFECYCLE_APPLIED_EVENT_TYPE,
  LIFECYCLE_RUN_SUMMARY_EVENT_TYPE,
  LIFECYCLE_REFERENCE_PREFIX,
  LIFECYCLE_DECISIONS,
  buildRunSummaryReferenceId,
} from './lifecycleConstants';

describe('lifecycleConstants (spec-lock)', () => {
  describe('Safety Guards', () => {
    it('MAX_ACTIONS_PER_RUN is 20', () => {
      expect(MAX_ACTIONS_PER_RUN).toBe(20);
    });

    it('DEFAULT_RUN_MODE is dry', () => {
      expect(DEFAULT_RUN_MODE).toBe('dry');
    });

    it('REQUIRE_CONFIRM_FLAG_FOR_RUN is true', () => {
      expect(REQUIRE_CONFIRM_FLAG_FOR_RUN).toBe(true);
    });

    it('SAFE_EXIT_ON_MISSING_SECRETS is true', () => {
      expect(SAFE_EXIT_ON_MISSING_SECRETS).toBe(true);
    });
  });

  describe('Event Types', () => {
    it('LIFECYCLE_APPLIED_EVENT_TYPE is lifecycle_applied', () => {
      expect(LIFECYCLE_APPLIED_EVENT_TYPE).toBe('lifecycle_applied');
    });

    it('LIFECYCLE_RUN_SUMMARY_EVENT_TYPE is lifecycle_run_summary', () => {
      expect(LIFECYCLE_RUN_SUMMARY_EVENT_TYPE).toBe('lifecycle_run_summary');
    });

    it('LIFECYCLE_REFERENCE_PREFIX is issue', () => {
      expect(LIFECYCLE_REFERENCE_PREFIX).toBe('issue');
    });
  });

  describe('Lifecycle Decisions', () => {
    it('contains exactly 3 decision types', () => {
      expect(LIFECYCLE_DECISIONS).toHaveLength(3);
    });

    it('contains CONTINUE, CLOSE_NO_EFFECT, REDESIGN_REQUIRED', () => {
      expect(LIFECYCLE_DECISIONS).toContain('CONTINUE');
      expect(LIFECYCLE_DECISIONS).toContain('CLOSE_NO_EFFECT');
      expect(LIFECYCLE_DECISIONS).toContain('REDESIGN_REQUIRED');
    });
  });

  describe('buildRunSummaryReferenceId', () => {
    it('builds correct reference ID format', () => {
      const result = buildRunSummaryReferenceId('2026-01-13T00:30:00Z');
      expect(result).toBe('run:2026-01-13T00:30:00Z');
    });
  });
});
