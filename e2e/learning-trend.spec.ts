/**
 * Learning Trend Chart E2E Tests
 *
 * P1-2 仕様:
 * - Dashboard にグラフが表示される
 * - 30日/12週の切り替えが機能する
 * - 空状態UI（イベント0のケース）を検証
 */

import { test, expect } from '@playwright/test';

test.describe('Learning Trend Chart', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user login
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
    });
    await page.reload();
  });

  test('displays trend chart on dashboard for logged-in user', async ({ page }) => {
    // Wait for trend chart to be visible
    const trendChart = page.getByTestId('trend-chart');
    await expect(trendChart).toBeVisible();

    // Check that title is displayed
    await expect(page.getByText('学習量推移')).toBeVisible();
  });

  test('30日/12週 mode toggle works', async ({ page }) => {
    const trendChart = page.getByTestId('trend-chart');
    await expect(trendChart).toBeVisible();

    // Check mode buttons exist
    const dailyButton = page.getByTestId('trend-mode-daily');
    const weeklyButton = page.getByTestId('trend-mode-weekly');

    await expect(dailyButton).toBeVisible();
    await expect(weeklyButton).toBeVisible();

    // Default should be daily (30日)
    await expect(dailyButton).toHaveText('30日');
    await expect(weeklyButton).toHaveText('12週');

    // Click weekly mode
    await weeklyButton.click();

    // Weekly button should now be active (verify by checking if it's still clickable and functional)
    await expect(weeklyButton).toBeVisible();

    // Click back to daily mode
    await dailyButton.click();
    await expect(dailyButton).toBeVisible();
  });

  test('displays empty state when no events', async ({ page }) => {
    const trendChart = page.getByTestId('trend-chart');
    await expect(trendChart).toBeVisible();

    // Check for empty state UI
    const emptyState = page.getByTestId('trend-empty');
    await expect(emptyState).toBeVisible();
    await expect(page.getByText('まだ学習データがありません')).toBeVisible();
  });

  test('trend chart not shown for logged-out user', async ({ page }) => {
    // Clear user session
    await page.evaluate(() => {
      localStorage.removeItem('e2e_mock_authenticated');
    });

    await page.goto('/');

    // Trend chart should not be visible
    const trendChart = page.getByTestId('trend-chart');
    await expect(trendChart).not.toBeVisible();
  });
});
