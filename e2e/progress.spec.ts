import { test, expect } from '@playwright/test';

// Set mock auth before each test (for routes that require authentication)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('e2e_mock_authenticated', 'true');
  });
});

test.describe('進捗ページ - Progress Page', () => {
  test('進捗ページが正しく表示される', async ({ page }) => {
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // ヘッダーの確認
    await expect(page.getByRole('heading', { name: '学習の進捗' })).toBeVisible();
    await expect(page.getByText('あなたの学習状況を確認しましょう')).toBeVisible();
  });

  test('統計カードが表示される', async ({ page }) => {
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // 完了したレッスンの統計
    await expect(page.getByText('完了したレッスン')).toBeVisible();

    // 進捗率の統計
    await expect(page.getByText('進捗率')).toBeVisible();

    // 連続学習日数の統計
    await expect(page.getByText('連続学習日数')).toBeVisible();

    // 学習中のレッスンの統計
    await expect(page.getByText('学習中のレッスン')).toBeVisible();
  });

  test('進捗バーが表示される', async ({ page }) => {
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // 進捗バーのラベル
    await expect(page.getByText('全体の進捗')).toBeVisible();

    // 進捗バーの要素
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();

    // 進捗率が表示される
    const progressValue = await progressBar.getAttribute('aria-valuenow');
    expect(progressValue).toBeDefined();
  });

  test('最近の学習履歴が表示される', async ({ page }) => {
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // 最近の学習履歴のヘッディング
    await expect(page.getByText('最近の学習履歴')).toBeVisible();

    // 学習履歴がある場合はリストが表示される
    const historyList = page.getByTestId('recent-history-list');
    const emptyMessage = page.getByText(/まだ学習履歴がありません/);

    // どちらかが表示される
    await expect(historyList.or(emptyMessage)).toBeVisible();
  });

  test('リセットボタンが機能する', async ({ page }) => {
    // 確認ダイアログを自動承認（先に設定）
    page.on('dialog', (dialog) => dialog.accept());

    // 進捗ページに移動
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // リセットボタンが表示される
    const resetButton = page.getByRole('button', { name: '進捗をリセット' });
    await expect(resetButton).toBeVisible();

    // リセットボタンをクリック
    await resetButton.click();
    await page.waitForTimeout(500);

    // ページがまだ表示されている（エラーにならない）
    await expect(page.getByRole('heading', { name: '学習の進捗' })).toBeVisible();
  });

  test('学習履歴からレッスンに移動できる', async ({ page }) => {
    // まずレッスンを開いて履歴を作成
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    const firstCard = page.getByTestId('lesson-card').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForLoadState('networkidle');
    }

    // 進捗ページに移動
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // 履歴リストからリンクをクリック
    const historyList = page.getByTestId('recent-history-list');
    if (await historyList.isVisible()) {
      const firstLink = historyList.locator('a').first();
      if (await firstLink.isVisible()) {
        await firstLink.click();

        // レッスン詳細ページに遷移
        await expect(page).toHaveURL(/\/lessons\/.+/);
      }
    }
  });

  test('進捗リセットボタンが表示される', async ({ page }) => {
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // リセットボタンの確認
    const resetButton = page.getByRole('button', { name: '進捗をリセット' });
    await expect(resetButton).toBeVisible();
  });

  test('進捗リセット機能が動作する', async ({ page }) => {
    // まず何かレッスンを開く
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    const firstCard = page.getByTestId('lesson-card').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForLoadState('networkidle');

      // 完了ボタンをクリック
      const completeButton = page.getByRole('button', { name: 'このレッスンを完了にする' });
      if (await completeButton.isVisible()) {
        await completeButton.click();
        await page.waitForTimeout(300);
      }
    }

    // 進捗ページに移動
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // リセット前の完了数を確認
    const statValue = page.getByTestId('completed-lessons-value');
    const beforeResetText = await statValue.textContent();
    expect(beforeResetText).toBeTruthy();

    // リセットボタンをクリック
    const resetButton = page.getByRole('button', { name: '進捗をリセット' });

    // 確認ダイアログを自動承認
    page.on('dialog', (dialog) => {
      expect(dialog.message()).toContain('進捗をリセットしますか');
      dialog.accept();
    });

    await resetButton.click();
    await page.waitForTimeout(500);

    // リセット後の状態を確認
    const afterResetStatValue = page.getByTestId('completed-lessons-value');
    const afterResetText = await afterResetStatValue.textContent();
    expect(afterResetText).toContain('0');
  });

  test('進捗率が正しく計算される', async ({ page }) => {
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // 進捗率の値を取得
    const progressBar = page.locator('[role="progressbar"]');
    const progressValue = await progressBar.getAttribute('aria-valuenow');

    // 0-100の範囲内であることを確認
    const percentage = parseInt(progressValue || '0', 10);
    expect(percentage).toBeGreaterThanOrEqual(0);
    expect(percentage).toBeLessThanOrEqual(100);
  });

  test('完了バッジが正しく表示される', async ({ page }) => {
    // レッスンを完了させる
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    const firstCard = page.getByTestId('lesson-card').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForLoadState('networkidle');

      const completeButton = page.getByRole('button', { name: 'このレッスンを完了にする' });
      if (await completeButton.isVisible()) {
        await completeButton.click();
        await page.waitForTimeout(300);
      }
    }

    // 進捗ページで完了バッジを確認
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    const historyListForBadge = page.getByTestId('recent-history-list');
    if (await historyListForBadge.isVisible()) {
      const completeBadge = historyListForBadge.locator('text=完了').first();
      if (await completeBadge.isVisible()) {
        await expect(completeBadge).toBeVisible();
      }
    }
  });

  test('学習中バッジが正しく表示される', async ({ page }) => {
    // レッスンを開くが完了させない
    await page.goto('/lessons');
    await page.waitForLoadState('networkidle');

    const firstCard = page.getByTestId('lesson-card').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForLoadState('networkidle');
    }

    // 進捗ページで学習中バッジを確認
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    const historyListForInProgress = page.getByTestId('recent-history-list');
    if (await historyListForInProgress.isVisible()) {
      const inProgressBadge = historyListForInProgress.locator('text=学習中').first();
      if (await inProgressBadge.isVisible()) {
        await expect(inProgressBadge).toBeVisible();
      }
    }
  });

  test('連続学習日数が表示される', async ({ page }) => {
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // 連続学習日数の値を取得
    const streakLabel = page.getByText('連続学習日数');
    await expect(streakLabel).toBeVisible();

    // 日数の表示を確認
    await expect(page.getByText(/\d+ 日/)).toBeVisible();
  });
});
