import { test, expect } from '@playwright/test';

// Set mock auth before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('e2e_mock_authenticated', 'true');
  });
});

test.describe('学習メトリクス表示テスト', () => {
  test('ダッシュボードに LearningMetricsCard が表示される', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // LearningMetricsCard が表示されることを確認
    const metricsCard = page.getByTestId('learning-metrics-card');
    await expect(metricsCard).toBeVisible();

    // Streak表示の確認
    const streakDisplay = page.getByTestId('streak-display');
    await expect(streakDisplay).toBeVisible();

    // Weekly Goal表示の確認
    const weeklyGoalDisplay = page.getByTestId('weekly-goal-display');
    await expect(weeklyGoalDisplay).toBeVisible();
  });

  test('ロードマップに LearningMetricsCard が表示される', async ({ page }) => {
    await page.goto('/roadmap');
    await page.waitForLoadState('networkidle');

    // LearningMetricsCard が表示されることを確認
    const metricsCard = page.getByTestId('learning-metrics-card');
    await expect(metricsCard).toBeVisible();
  });
});

test.describe('未ログイン時の表示テスト', () => {
  test('未ログイン時はメトリクスカードが表示されない', async ({ page }) => {
    // Clear auth before this test
    await page.addInitScript(() => {
      localStorage.removeItem('e2e_mock_authenticated');
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // メトリクスカードが表示されないことを確認
    const metricsCard = page.getByTestId('learning-metrics-card');
    await expect(metricsCard).not.toBeVisible();
  });
});
