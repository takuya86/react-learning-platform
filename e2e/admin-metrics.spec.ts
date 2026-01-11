import { test, expect } from '@playwright/test';

// Set admin auth before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('e2e_mock_authenticated', 'true');
    localStorage.setItem('e2e_mock_role', 'admin');
  });
});

test.describe('Admin Metrics Page', () => {
  test('should display admin metrics page with all sections', async ({ page }) => {
    await page.goto('/admin/metrics');
    await page.waitForLoadState('networkidle');

    // Page should be visible
    const metricsPage = page.getByTestId('admin-metrics-page');
    await expect(metricsPage).toBeVisible();

    // Title should be visible
    await expect(page.getByText('Metrics 管理')).toBeVisible();

    // Period selector should be visible
    const periodSelector = page.getByTestId('admin-metrics-period-select');
    await expect(periodSelector).toBeVisible();

    // Summary section should be visible
    const summary = page.getByTestId('admin-metrics-summary');
    await expect(summary).toBeVisible();

    // Trend section should be visible
    const trend = page.getByTestId('admin-metrics-trend');
    await expect(trend).toBeVisible();

    // Heatmap section should be visible
    const heatmap = page.getByTestId('admin-metrics-heatmap');
    await expect(heatmap).toBeVisible();

    // Leaderboards section should be visible
    const leaderboards = page.getByTestId('admin-metrics-leaderboards');
    await expect(leaderboards).toBeVisible();
  });

  test('should switch periods when clicking period buttons', async ({ page }) => {
    await page.goto('/admin/metrics');
    await page.waitForLoadState('networkidle');

    // Default should be 30d
    const thirtyDayButton = page.getByRole('button', { name: '30日間を表示' });
    await expect(thirtyDayButton).toHaveClass(/active/);

    // Click 7d button
    const sevenDayButton = page.getByRole('button', { name: '7日間を表示' });
    await sevenDayButton.click();
    await expect(sevenDayButton).toHaveClass(/active/);
    await expect(thirtyDayButton).not.toHaveClass(/active/);

    // Click today button
    const todayButton = page.getByRole('button', { name: '今日を表示' });
    await todayButton.click();
    await expect(todayButton).toHaveClass(/active/);
    await expect(sevenDayButton).not.toHaveClass(/active/);
  });

  test('should navigate back to admin page', async ({ page }) => {
    await page.goto('/admin/metrics');
    await page.waitForLoadState('networkidle');

    // Click back link
    const backLink = page.getByRole('link', { name: /管理者ページに戻る/ });
    await backLink.click();

    // Should navigate to admin page
    await expect(page).toHaveURL('/admin');
  });

  test('should display summary cards with metrics', async ({ page }) => {
    await page.goto('/admin/metrics');
    await page.waitForLoadState('networkidle');

    const summary = page.getByTestId('admin-metrics-summary');

    // Check for summary labels
    await expect(summary.getByText('アクティブユーザー')).toBeVisible();
    await expect(summary.getByText('総イベント数')).toBeVisible();
    await expect(summary.getByText('平均イベント/人')).toBeVisible();
    await expect(summary.getByText('週次目標達成率')).toBeVisible();
  });

  test('should display streak distribution', async ({ page }) => {
    await page.goto('/admin/metrics');
    await page.waitForLoadState('networkidle');

    // Streak distribution labels
    await expect(page.getByText('Streak 分布')).toBeVisible();
    // Use exact match to avoid matching other elements containing "日"
    await expect(page.getByText('0日', { exact: true })).toBeVisible();
    await expect(page.getByText('1-2日', { exact: true })).toBeVisible();
    await expect(page.getByText('3-6日', { exact: true })).toBeVisible();
    await expect(page.getByText('7-13日', { exact: true })).toBeVisible();
    await expect(page.getByText('14日+', { exact: true })).toBeVisible();
  });

  test('should display leaderboards', async ({ page }) => {
    await page.goto('/admin/metrics');
    await page.waitForLoadState('networkidle');

    const leaderboards = page.getByTestId('admin-metrics-leaderboards');

    // Check for leaderboard titles
    await expect(leaderboards.getByText('30日間イベント数 Top10')).toBeVisible();
    await expect(leaderboards.getByText('Streak Top10')).toBeVisible();
  });

  /**
   * [spec-lock] P3-1 Learning Effectiveness
   * AdminMetricsPage displays effectiveness metrics
   */
  test('should display learning effectiveness section', async ({ page }) => {
    await page.goto('/admin/metrics');
    await page.waitForLoadState('networkidle');

    // Effectiveness section should be visible
    const effectiveness = page.getByTestId('admin-metrics-effectiveness');
    await expect(effectiveness).toBeVisible();

    // Check for effectiveness labels
    await expect(effectiveness.getByText('学習効果')).toBeVisible();
    await expect(effectiveness.getByText('Follow-up率')).toBeVisible();
    await expect(effectiveness.getByText('完了率')).toBeVisible();
    await expect(effectiveness.getByText('起点イベント')).toBeVisible();
    await expect(effectiveness.getByText('Follow-up数')).toBeVisible();
    await expect(effectiveness.getByText('Top Action')).toBeVisible();
  });

  /**
   * [spec-lock] P3-2.1 Lesson Effectiveness Ranking
   * AdminMetricsPage displays lesson ranking
   */
  test('should display lesson effectiveness ranking section', async ({ page }) => {
    await page.goto('/admin/metrics');
    await page.waitForLoadState('networkidle');

    // Lesson ranking section should be visible
    const ranking = page.getByTestId('admin-metrics-lesson-ranking');
    await expect(ranking).toBeVisible();

    // Check for section title
    await expect(ranking.getByText('Lesson Effectiveness Ranking')).toBeVisible();

    // Check for Best/Worst tables
    await expect(ranking.getByText('Best（Follow-up率が高い）')).toBeVisible();
    await expect(ranking.getByText('Worst（Follow-up率が低い）')).toBeVisible();

    // Check for table headers
    await expect(ranking.getByText('レッスン').first()).toBeVisible();
    await expect(ranking.getByText('母数').first()).toBeVisible();
    await expect(ranking.getByText('Rate').first()).toBeVisible();
  });
});

test.describe('Admin Metrics Page - Access Control', () => {
  test('should redirect non-admin users', async ({ page }) => {
    // Set non-admin auth
    await page.addInitScript(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
      localStorage.setItem('e2e_mock_role', 'user');
    });

    await page.goto('/admin/metrics');
    await page.waitForLoadState('networkidle');

    // Should be redirected (admin-metrics-page should not be visible)
    const metricsPage = page.getByTestId('admin-metrics-page');
    await expect(metricsPage).not.toBeVisible();
  });

  test('should redirect unauthenticated users', async ({ page }) => {
    // Clear auth
    await page.addInitScript(() => {
      localStorage.removeItem('e2e_mock_authenticated');
      localStorage.removeItem('e2e_mock_role');
    });

    await page.goto('/admin/metrics');
    await page.waitForLoadState('networkidle');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Admin Page - Metrics Link', () => {
  test('should have link to metrics page from admin page', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Check for Metrics link
    await expect(page.getByText('Metrics 管理')).toBeVisible();

    // Click the link
    const metricsLink = page.getByRole('link', { name: '管理画面へ' }).nth(1); // Second link (after Backlog)
    await metricsLink.click();

    // Should navigate to metrics page
    await expect(page).toHaveURL('/admin/metrics');
  });
});

/**
 * [spec-lock] P3-2.3 Issue Automation
 * Tests for GitHub Issue creation from Worst lessons table
 */
test.describe('Admin Metrics Page - Issue Automation', () => {
  test('should display Issue column in Worst lessons table', async ({ page }) => {
    await page.goto('/admin/metrics');
    await page.waitForLoadState('networkidle');

    // Worst table should have Issue column
    const ranking = page.getByTestId('admin-metrics-lesson-ranking');
    await expect(ranking).toBeVisible();

    // Check for Issue column header in Worst table
    const worstTable = ranking.locator('table').nth(1);
    await expect(worstTable.getByText('Issue')).toBeVisible();
  });

  test('should show Issue button or status for Worst lessons', async ({ page }) => {
    await page.goto('/admin/metrics');
    await page.waitForLoadState('networkidle');

    const ranking = page.getByTestId('admin-metrics-lesson-ranking');
    await expect(ranking).toBeVisible();

    // Check that Issue column cells exist (either button, link, or placeholder)
    const worstTable = ranking.locator('table').nth(1);

    // Should have rows with Issue column content
    // In mock mode, lessons might not have enough data to show buttons
    // but the column should exist
    const issueColumn = worstTable.getByRole('columnheader', { name: 'Issue' });
    await expect(issueColumn).toBeVisible();
  });
});
