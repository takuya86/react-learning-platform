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

test.describe('理由説明UI（P1-3）', () => {
  test('Streak説明ボタンをクリックするとポップオーバーが表示される', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Streak説明ボタンをクリック
    const streakExplainButton = page.getByTestId('streak-explain-button');
    await expect(streakExplainButton).toBeVisible();
    await streakExplainButton.click();

    // ポップオーバーが表示されることを確認
    const streakPopover = page.getByTestId('streak-explain-popover');
    await expect(streakPopover).toBeVisible();

    // 詳細リストが表示されていることを確認
    const details = streakPopover.locator('li');
    await expect(details.first()).toBeVisible();
  });

  test('Weekly説明ボタンをクリックするとポップオーバーが表示される', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Weekly説明ボタンをクリック
    const weeklyExplainButton = page.getByTestId('weekly-explain-button');
    await expect(weeklyExplainButton).toBeVisible();
    await weeklyExplainButton.click();

    // ポップオーバーが表示されることを確認
    const weeklyPopover = page.getByTestId('weekly-explain-popover');
    await expect(weeklyPopover).toBeVisible();

    // 詳細リストが表示されていることを確認
    const details = weeklyPopover.locator('li');
    await expect(details.first()).toBeVisible();
  });

  test('一方のポップオーバーを開くともう一方は閉じる', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Streak説明ボタンをクリック
    const streakExplainButton = page.getByTestId('streak-explain-button');
    await streakExplainButton.click();
    await expect(page.getByTestId('streak-explain-popover')).toBeVisible();

    // Weekly説明ボタンをクリック
    const weeklyExplainButton = page.getByTestId('weekly-explain-button');
    await weeklyExplainButton.click();

    // Streakポップオーバーが閉じてWeeklyポップオーバーが開く
    await expect(page.getByTestId('streak-explain-popover')).not.toBeVisible();
    await expect(page.getByTestId('weekly-explain-popover')).toBeVisible();
  });
});
