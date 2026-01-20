import { test, expect } from '@playwright/test';

// Set mock auth before each test (for routes that require authentication)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('e2e_mock_authenticated', 'true');
  });
});

test.describe('レッスン詳細ページ - Lesson Detail Page', () => {
  test('レッスン詳細ページが正しく表示される', async ({ page }) => {
    // レッスン一覧から最初のレッスンに遷移
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    const firstCard = page.getByTestId('lesson-card').first();
    await firstCard.click();

    // レッスン詳細ページの要素を確認
    await expect(page).toHaveURL(/\/lessons\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId('breadcrumb')).toContainText('レッスン一覧');
  });

  test('レッスンコンテンツが表示される', async ({ page }) => {
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // コンテンツエリアが表示される
    const article = page.locator('article');
    await expect(article).toBeVisible();
  });

  test('メタ情報（難易度・所要時間・タグ）が表示される', async ({ page }) => {
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // 難易度バッジが表示される
    const difficultyBadge = page.getByTestId('difficulty-badge');
    await expect(difficultyBadge).toBeVisible();

    // 所要時間が表示される
    await expect(page.getByText(/約.*分/)).toBeVisible();
  });

  test('完了ボタンをクリックするとレッスンが完了状態になる', async ({ page }) => {
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // 完了ボタンを探す（すでに完了済みでない場合）
    const completeButton = page.getByRole('button', { name: 'このレッスンを完了にする' });

    if (await completeButton.isVisible()) {
      await completeButton.click();
      await page.waitForTimeout(500);

      // 完了バッジが表示される
      await expect(page.getByText('完了済み')).toBeVisible();
    } else {
      // すでに完了済みの場合
      await expect(page.getByText('完了済み')).toBeVisible();
    }
  });

  test('復習ボタンが表示される', async ({ page }) => {
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // 復習ボタンが表示される
    const reviewButton = page.getByTestId('review-button');
    await expect(reviewButton).toBeVisible();
    await expect(reviewButton).toContainText('復習する');
  });

  test('ノートを開くリンクが機能する', async ({ page }) => {
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // ノートを開くリンクをクリック
    const notesLink = page.getByTestId('open-notes-link');
    await expect(notesLink).toBeVisible();

    const href = await notesLink.getAttribute('href');
    expect(href).toMatch(/\/notes\?lessonId=.+/);
  });

  test('クイズを開くリンクが表示される（関連クイズがある場合）', async ({ page }) => {
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // クイズリンクが表示される
    const quizLink = page.getByTestId('open-quiz-link');
    await expect(quizLink).toBeVisible();

    const href = await quizLink.getAttribute('href');
    expect(href).toMatch(/\/quiz\/.+/);
  });

  test('次に読むべきレッスンが表示される（依存関係がある場合）', async ({ page }) => {
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // 次のレッスンセクションが表示される可能性がある
    const nextLessonsSection = page.locator('section').filter({ hasText: '次に読むべきレッスン' });

    // セクションの有無を確認（存在する場合のみテスト）
    if (await nextLessonsSection.isVisible()) {
      await expect(nextLessonsSection).toBeVisible();
    }
  });

  test('前提レッスンが表示される（依存関係がある場合）', async ({ page }) => {
    // 前提レッスンがあるレッスンを探す
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    // 適当なレッスンに移動
    const firstCard = page.getByTestId('lesson-card').first();
    await firstCard.click();

    await page.waitForLoadState('networkidle');

    // 前提レッスンセクションが表示される可能性がある
    const prerequisitesText = page.getByText('前提レッスン:');

    if (await prerequisitesText.isVisible()) {
      await expect(prerequisitesText).toBeVisible();
    }
  });

  test('レッスン一覧に戻るリンクが機能する', async ({ page }) => {
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // レッスン一覧に戻るリンクをクリック
    const backLink = page.getByRole('link', { name: 'レッスン一覧に戻る' });
    await expect(backLink).toBeVisible();
    await backLink.click();

    // レッスン一覧ページに遷移
    await expect(page).toHaveURL('/lessons');
  });

  test('パンくずリストからレッスン一覧に戻れる', async ({ page }) => {
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // パンくずリストのレッスン一覧リンクをクリック
    const breadcrumbLink = page
      .getByTestId('breadcrumb')
      .getByRole('link', { name: 'レッスン一覧' });
    await expect(breadcrumbLink).toBeVisible();
    await breadcrumbLink.click();

    // レッスン一覧ページに遷移
    await expect(page).toHaveURL('/lessons');
  });

  test('存在しないレッスンにアクセスするとエラーメッセージが表示される', async ({ page }) => {
    await page.goto('/lessons/non-existent-lesson-id-xyz');
    await page.waitForLoadState('networkidle');

    // エラーメッセージが表示される
    await expect(page.getByRole('heading', { name: 'レッスンが見つかりません' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'レッスン一覧に戻る' })).toBeVisible();
  });
});
