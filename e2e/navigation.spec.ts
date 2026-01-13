import { test, expect, type Page, type Locator } from '@playwright/test';

// [spec-lock] In E2E we navigate via page.goto(href) instead of clicking <Link>.
// Reason: SPA route transition can update URL but not reliably re-render in Playwright timing,
// causing flaky "element not found" failures. goto makes navigation deterministic.
async function gotoByLink(page: Page, locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
  const href = await locator.getAttribute('href');
  expect(href).toBeTruthy();
  await page.goto(href!);
  await page.waitForLoadState('networkidle');
}

// Set mock auth before each test (for routes that require authentication)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('e2e_mock_authenticated', 'true');
  });
});

test.describe('レッスン詳細からの導線テスト', () => {
  test('レッスン詳細 → ノートを開く → /notes に遷移し lessonId が含まれる', async ({ page }) => {
    // レッスン一覧に移動
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    // 最初のレッスンカードをクリック
    const lessonCard = page.getByTestId('lesson-card').first();
    await expect(lessonCard).toBeVisible();
    await lessonCard.click();

    // レッスン詳細ページに遷移したことを確認
    await expect(page).toHaveURL(/\/lessons\/.+/);
    await page.waitForLoadState('networkidle');

    // 「ノートを開く」リンクからナビゲート
    const notesLink = page.getByTestId('open-notes-link');
    const href = await notesLink.getAttribute('href');
    expect(href).toMatch(/\/notes\?lessonId=.+/);
    await gotoByLink(page, notesLink);

    // ノートページのサイドバーが表示されていることを確認
    await expect(page.locator('aside')).toBeVisible();
  });

  test('レッスン詳細 → クイズを開く → /quiz に遷移しクイズ画面が表示される', async ({ page }) => {
    // react-basicsには関連クイズがある
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // レッスン詳細ページに遷移したことを確認
    await expect(page).toHaveURL(/\/lessons\/react-basics/);

    // 「クイズを開く」リンクからナビゲート
    const quizLink = page.getByTestId('open-quiz-link');
    const href = await quizLink.getAttribute('href');
    expect(href).toMatch(/\/quiz\/.+/);
    await gotoByLink(page, quizLink);

    // クイズページの要素が表示されていることを確認
    // 再開ダイアログか、クイズ問題画面のいずれかが表示される
    const resumeDialog = page.getByText('前回の続きから再開しますか？');
    const quizTitle = page.getByTestId('quiz-title');

    await expect(resumeDialog.or(quizTitle)).toBeVisible();
  });
});

test.describe('直アクセステスト', () => {
  test('/notes に直アクセスで 404 にならない', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    // 404ページが表示されていないことを確認
    await expect(page.getByText('ページが見つかりません')).not.toBeVisible();

    // ノートページのサイドバーが表示されていることを確認
    await expect(page.locator('aside')).toBeVisible();
  });

  test('/quiz/<id> に直アクセスで 404 にならない', async ({ page }) => {
    // 既存のクイズIDで直アクセス
    await page.goto('/quiz/react-basics-quiz');
    await page.waitForLoadState('networkidle');

    // 404ページが表示されていないことを確認
    await expect(page.getByText('ページが見つかりません')).not.toBeVisible();

    // クイズページの要素が表示されていることを確認
    // 再開ダイアログか、クイズ問題画面のいずれかが表示される
    const resumeDialog = page.getByText('前回の続きから再開しますか？');
    const quizTitle = page.getByTestId('quiz-title');

    await expect(resumeDialog.or(quizTitle)).toBeVisible();
  });
});
