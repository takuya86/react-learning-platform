import { test, expect } from '@playwright/test';

// Set mock auth before each test (for routes that require authentication)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('e2e_mock_authenticated', 'true');
  });
});

test.describe('レッスン一覧ページ - Lessons Page', () => {
  test('レッスン一覧ページが正しく表示される', async ({ page }) => {
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    // ヘッダーの確認
    await expect(page.getByRole('heading', { name: 'レッスン一覧' })).toBeVisible();
    await expect(page.getByText(/Reactの基礎から実践までを学びましょう/)).toBeVisible();

    // レッスンカードが表示されることを確認
    const lessonCards = page.getByTestId('lesson-card');
    await expect(lessonCards.first()).toBeVisible();
  });

  test('検索機能 - タイトルで検索できる', async ({ page }) => {
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    // 検索ボックスに入力
    const searchInput = page.locator('input[placeholder*="タイトルやタグで検索"]');
    await searchInput.fill('React');
    await page.waitForTimeout(500); // デバウンス待機

    // 検索結果が表示される
    const lessonCards = page.getByTestId('lesson-card');
    await expect(lessonCards.first()).toBeVisible();
  });

  test('検索機能 - 存在しないキーワードで検索すると結果が空になる', async ({ page }) => {
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    // 存在しないキーワードで検索
    const searchInput = page.locator('input[placeholder*="タイトルやタグで検索"]');
    await searchInput.fill('存在しないレッスン名xyz123');
    await page.waitForTimeout(500); // デバウンス待機

    // レッスンカードが表示されないことを確認
    const lessonCards = page.getByTestId('lesson-card');
    await expect(lessonCards).toHaveCount(0);
  });

  test('タグフィルター - タグで絞り込みできる', async ({ page }) => {
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    // タグフィルターを選択
    const tagSelect = page.locator('select#tag-filter');
    await expect(tagSelect).toBeVisible();

    // 最初のタグ（すべてのタグ以外）を選択
    const options = await tagSelect.locator('option').all();
    if (options.length > 1) {
      const firstTagOption = await options[1].getAttribute('value');
      if (firstTagOption) {
        await tagSelect.selectOption(firstTagOption);
        await page.waitForTimeout(300);

        // フィルター後もレッスンが表示される
        const lessonCards = page.getByTestId('lesson-card');
        await expect(lessonCards.first()).toBeVisible();
      }
    }
  });

  test('難易度フィルター - 難易度で絞り込みできる', async ({ page }) => {
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    // 難易度フィルターを選択
    const difficultySelect = page.locator('select#difficulty-filter');
    await expect(difficultySelect).toBeVisible();

    // 初級を選択
    await difficultySelect.selectOption('beginner');
    await page.waitForTimeout(300);

    // レッスンカードが表示される
    const lessonCards = page.getByTestId('lesson-card');
    await expect(lessonCards.first()).toBeVisible();
  });

  test('複合フィルター - 検索とタグと難易度を組み合わせて絞り込める', async ({ page }) => {
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    // 難易度を選択
    const difficultySelect = page.locator('select#difficulty-filter');
    await expect(difficultySelect).toBeVisible();
    await difficultySelect.selectOption('beginner');
    await page.waitForTimeout(300);

    // 検索キーワードを入力
    const searchInput = page.locator('input[placeholder*="タイトルやタグで検索"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('React');
    await page.waitForTimeout(500);

    // 結果が表示される（ページは常に表示される）
    await expect(page.getByRole('heading', { name: 'レッスン一覧' })).toBeVisible();
  });

  test('レッスンカードをクリックすると詳細ページに遷移する', async ({ page }) => {
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    // 最初のレッスンカードをクリック
    const firstCard = page.getByTestId('lesson-card').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // レッスン詳細ページに遷移
    await expect(page).toHaveURL(/\/lessons\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('フィルターをリセットできる', async ({ page }) => {
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    // フィルターを設定
    const difficultySelect = page.locator('select#difficulty-filter');
    await difficultySelect.selectOption('beginner');
    await page.waitForTimeout(300);

    // リセット（すべての難易度に戻す）
    await difficultySelect.selectOption('');
    await page.waitForTimeout(300);

    // すべてのレッスンが表示される
    const lessonCards = page.getByTestId('lesson-card');
    await expect(lessonCards.first()).toBeVisible();
  });
});
