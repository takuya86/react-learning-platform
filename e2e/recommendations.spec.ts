import { test, expect } from '@playwright/test';

// Set mock auth before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('e2e_mock_authenticated', 'true');
  });
});

test.describe('次のおすすめレッスン表示テスト', () => {
  test('ダッシュボードに NextLessonsCard が表示される', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // NextLessonsCard が表示されることを確認
    // 推薦あり: data-testid="next-lessons-card"
    // 推薦なし（全完了）: data-testid="recommendations-empty"
    const card = page.getByTestId('next-lessons-card');
    const emptyCard = page.getByTestId('recommendations-empty');

    await expect(card.or(emptyCard)).toBeVisible();
  });

  test('ロードマップに NextLessonsCard が表示される', async ({ page }) => {
    await page.goto('/roadmap');
    await page.waitForLoadState('networkidle');

    const card = page.getByTestId('next-lessons-card');
    const emptyCard = page.getByTestId('recommendations-empty');

    await expect(card.or(emptyCard)).toBeVisible();
  });
});
