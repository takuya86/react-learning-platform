/**
 * Learning Heatmap E2E Tests
 *
 * P1-1 仕様:
 * - Dashboard に heatmap が表示される
 * - 0件ユーザーでも表示される
 */

import { test, expect } from '@playwright/test';

test.describe('Learning Heatmap', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user login
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
    });
    await page.reload();
  });

  test('displays heatmap on dashboard for logged-in user', async ({ page }) => {
    // Wait for heatmap to be visible
    const heatmap = page.getByTestId('heatmap');
    await expect(heatmap).toBeVisible();

    // Verify heatmap-day cells exist
    const days = page.getByTestId('heatmap-day');
    await expect(days.first()).toBeVisible();

    // Should have 84 days (12 weeks)
    const dayCount = await days.count();
    expect(dayCount).toBe(84);
  });

  test('displays heatmap with zero events (empty state)', async ({ page }) => {
    // Heatmap should still be visible even with no events
    const heatmap = page.getByTestId('heatmap');
    await expect(heatmap).toBeVisible();

    // All days should have level 0 (no events)
    const days = page.getByTestId('heatmap-day');
    const firstDay = days.first();
    await expect(firstDay).toBeVisible();

    // Verify the level is 0 for a day with no events
    const level = await firstDay.getAttribute('data-level');
    expect(level).toBe('0');
  });

  test('heatmap has correct structure with legend', async ({ page }) => {
    const heatmap = page.getByTestId('heatmap');
    await expect(heatmap).toBeVisible();

    // Check for legend text
    await expect(page.getByText('Less')).toBeVisible();
    await expect(page.getByText('More')).toBeVisible();
  });

  test('heatmap not shown for logged-out user', async ({ page }) => {
    // Clear user session
    await page.evaluate(() => {
      localStorage.removeItem('e2e_mock_authenticated');
    });

    await page.goto('/');

    // Heatmap should not be visible
    const heatmap = page.getByTestId('heatmap');
    await expect(heatmap).not.toBeVisible();
  });
});
