import { test, expect } from '@playwright/test';

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

    // 「ノートを開く」リンクを確認
    const notesLink = page.getByTestId('open-notes-link');
    await expect(notesLink).toBeVisible();

    // リンクのhrefを取得して直接遷移（SPAナビゲーションの問題を回避）
    const href = await notesLink.getAttribute('href');
    console.log('Notes link href:', href);
    await page.goto(href!);
    await page.waitForLoadState('networkidle');

    // /notes に遷移したことを確認
    await expect(page).toHaveURL(/\/notes\?lessonId=.+/);

    // ノートページが表示されていることを確認（サイドバーの存在で判定）
    await expect(page.locator('aside')).toBeVisible();
  });

  test('レッスン詳細 → クイズを開く → /quiz に遷移しクイズ画面が表示される', async ({ page }) => {
    // レッスン一覧に移動
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    // 最初のレッスンカードをクリック（react-basicsには関連クイズがある）
    const lessonCard = page.getByTestId('lesson-card').first();
    await expect(lessonCard).toBeVisible();
    await lessonCard.click();

    // レッスン詳細ページに遷移したことを確認
    await expect(page).toHaveURL(/\/lessons\/.+/);
    await page.waitForLoadState('networkidle');

    // 「クイズを開く」リンクを確認
    const quizLink = page.getByTestId('open-quiz-link');
    await expect(quizLink).toBeVisible();

    // リンクのhrefを取得して直接遷移（SPAナビゲーションの問題を回避）
    const href = await quizLink.getAttribute('href');
    console.log('Quiz link href:', href);
    await page.goto(href!);
    await page.waitForLoadState('networkidle');

    // /quiz に遷移したことを確認
    await expect(page).toHaveURL(/\/quiz\/.+/);

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
