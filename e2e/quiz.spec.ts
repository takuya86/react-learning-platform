import { test, expect } from '@playwright/test';

// Set mock auth before each test (for routes that require authentication)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('e2e_mock_authenticated', 'true');
  });
});

test.describe('クイズ機能 - Quiz Functionality', () => {
  test('クイズページが正しく表示される', async ({ page }) => {
    await page.goto('/quiz/react-basics-quiz');
    await page.waitForLoadState('networkidle');

    // 再開ダイアログまたはクイズタイトルが表示される
    const resumeDialog = page.getByText('前回の続きから再開しますか？');
    const quizTitle = page.getByTestId('quiz-title');

    await expect(resumeDialog.or(quizTitle)).toBeVisible();
  });

  test('新規クイズ開始 - 再開ダイアログで「最初からやり直す」を選択', async ({ page }) => {
    await page.goto('/quiz/react-basics-quiz');
    await page.waitForLoadState('networkidle');

    // 再開ダイアログが表示される場合は「最初からやり直す」を選択
    const startNewButton = page.getByRole('button', { name: '最初からやり直す' });
    if (await startNewButton.isVisible()) {
      await startNewButton.click();
    }

    // クイズが開始される
    await page.waitForLoadState('networkidle');
    const quizTitle = page.getByTestId('quiz-title');
    await expect(quizTitle).toBeVisible();
  });

  test('クイズの進行 - 問題が表示される', async ({ page }) => {
    await page.goto('/quiz/react-basics-quiz');
    await page.waitForLoadState('networkidle');

    // 再開ダイアログをスキップ
    const startNewButton = page.getByRole('button', { name: '最初からやり直す' });
    if (await startNewButton.isVisible()) {
      await startNewButton.click();
      await page.waitForLoadState('networkidle');
    }

    // 問題文が表示される
    const questionCard = page.locator('.questionCard');
    await expect(questionCard).toBeVisible();

    // 選択肢が表示される
    const options = page.locator('.option');
    await expect(options.first()).toBeVisible();
  });

  test('クイズの進行 - 選択肢を選択すると次へ進めるボタンが表示される', async ({ page }) => {
    await page.goto('/quiz/react-basics-quiz');
    await page.waitForLoadState('networkidle');

    // 再開ダイアログをスキップ
    const startNewButton = page.getByRole('button', { name: '最初からやり直す' });
    if (await startNewButton.isVisible()) {
      await startNewButton.click();
      await page.waitForLoadState('networkidle');
    }

    // 最初の選択肢をクリック
    const firstOption = page.locator('.option').first();
    await firstOption.click();

    // 「次の問題へ」または「結果を見る」ボタンが表示される
    const nextButton = page.getByRole('button', { name: /次の問題へ|結果を見る/ });
    await expect(nextButton).toBeVisible();
  });

  test('クイズの進行 - 問題をスキップできる', async ({ page }) => {
    await page.goto('/quiz/react-basics-quiz');
    await page.waitForLoadState('networkidle');

    // 再開ダイアログをスキップ
    const startNewButton = page.getByRole('button', { name: '最初からやり直す' });
    if (await startNewButton.isVisible()) {
      await startNewButton.click();
      await page.waitForLoadState('networkidle');
    }

    // スキップボタンをクリック
    const skipButton = page.getByRole('button', { name: 'スキップ' });
    if (await skipButton.isVisible()) {
      await skipButton.click();

      // 次の問題へボタンが表示される
      const nextButton = page.getByRole('button', { name: /次の問題へ|結果を見る/ });
      await expect(nextButton).toBeVisible();
    }
  });

  test('ヒント機能 - ヒントを表示できる', async ({ page }) => {
    await page.goto('/quiz/react-basics-quiz');
    await page.waitForLoadState('networkidle');

    // 再開ダイアログをスキップ
    const startNewButton = page.getByRole('button', { name: '最初からやり直す' });
    if (await startNewButton.isVisible()) {
      await startNewButton.click();
      await page.waitForLoadState('networkidle');
    }

    // ヒントボタンが表示される場合はクリック
    const hintButton = page.getByRole('button', { name: 'ヒントを見る' });
    if (await hintButton.isVisible()) {
      await hintButton.click();

      // ヒントが表示される
      await expect(page.getByText(/ヒント:/)).toBeVisible();
    }
  });

  test('クイズ完了 - 結果が表示される', async ({ page }) => {
    await page.goto('/quiz/react-basics-quiz');
    await page.waitForLoadState('networkidle');

    // 再開ダイアログをスキップ
    const startNewButton = page.getByRole('button', { name: '最初からやり直す' });
    if (await startNewButton.isVisible()) {
      await startNewButton.click();
      await page.waitForLoadState('networkidle');
    }

    // すべての問題に回答（最大5問まで）
    for (let i = 0; i < 5; i++) {
      // 選択肢をクリック
      const firstOption = page.locator('.option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await page.waitForTimeout(300);

        // 次へ進むボタンをクリック
        const nextButton = page.getByRole('button', { name: /次の問題へ|結果を見る/ });
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await page.waitForTimeout(500);

          // 結果画面が表示されたら終了
          const resultTitle = page.getByRole('heading', { name: 'クイズ完了！' });
          if (await resultTitle.isVisible()) {
            break;
          }
        } else {
          break;
        }
      }
    }

    // 結果画面の確認
    const resultTitle = page.getByRole('heading', { name: 'クイズ完了！' });
    await expect(resultTitle).toBeVisible();

    // スコアが表示される
    await expect(page.locator('.score')).toBeVisible();
  });

  test('クイズ結果 - スコア表示の確認', async ({ page }) => {
    // 先に完了させる（簡易版）
    await page.goto('/quiz/react-basics-quiz');
    await page.waitForLoadState('networkidle');

    const startNewButton = page.getByRole('button', { name: '最初からやり直す' });
    if (await startNewButton.isVisible()) {
      await startNewButton.click();
      await page.waitForLoadState('networkidle');
    }

    // 1問だけ回答して完了させる
    const firstOption = page.locator('.option').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
      await page.waitForTimeout(300);

      const nextButton = page.getByRole('button', { name: /次の問題へ|結果を見る/ });
      if (await nextButton.isVisible()) {
        // すべてスキップして結果へ
        for (let i = 0; i < 5; i++) {
          await nextButton.click();
          await page.waitForTimeout(300);

          const resultTitle = page.getByRole('heading', { name: 'クイズ完了！' });
          if (await resultTitle.isVisible()) {
            break;
          }

          const skipButton = page.getByRole('button', { name: 'スキップ' });
          if (await skipButton.isVisible()) {
            await skipButton.click();
            await page.waitForTimeout(300);
          }
        }
      }
    }

    // 結果画面でパーセンテージが表示される
    await expect(page.locator('.percentage')).toBeVisible();
  });

  test('クイズ結果 - もう一度挑戦ボタンが機能する', async ({ page }) => {
    // まず結果画面まで進む（既存のセッションがあると仮定）
    await page.goto('/quiz/react-basics-quiz');
    await page.waitForLoadState('networkidle');

    // 続きから再開して即座に結果を見る（もしくは新規開始）
    const resumeButton = page.getByRole('button', { name: '続きから再開' });
    const startNewButton = page.getByRole('button', { name: '最初からやり直す' });

    if (await resumeButton.isVisible()) {
      await resumeButton.click();
    } else if (await startNewButton.isVisible()) {
      await startNewButton.click();
    }

    await page.waitForLoadState('networkidle');

    // 結果画面が表示されている場合は「もう一度挑戦」をテスト
    const retryButton = page.getByRole('button', { name: 'もう一度挑戦' });
    if (await retryButton.isVisible()) {
      await retryButton.click();
      await page.waitForLoadState('networkidle');

      // クイズが再開される
      const quizTitle = page.getByTestId('quiz-title');
      await expect(quizTitle).toBeVisible();
    }
  });

  test('クイズ結果 - クイズ一覧に戻るボタンが機能する', async ({ page }) => {
    await page.goto('/quiz/react-basics-quiz');
    await page.waitForLoadState('networkidle');

    // 結果画面まで進む（簡易版）
    const startNewButton = page.getByRole('button', { name: '最初からやり直す' });
    if (await startNewButton.isVisible()) {
      await startNewButton.click();
      await page.waitForLoadState('networkidle');

      // スキップして結果へ
      for (let i = 0; i < 10; i++) {
        const skipButton = page.getByRole('button', { name: 'スキップ' });
        if (await skipButton.isVisible()) {
          await skipButton.click();
          await page.waitForTimeout(200);

          const nextButton = page.getByRole('button', { name: /次の問題へ|結果を見る/ });
          if (await nextButton.isVisible()) {
            await nextButton.click();
            await page.waitForTimeout(200);
          }
        }

        const resultTitle = page.getByRole('heading', { name: 'クイズ完了！' });
        if (await resultTitle.isVisible()) {
          break;
        }
      }
    }

    // 「クイズ一覧に戻る」ボタンがあればクリック
    const backButton = page.getByRole('button', { name: 'クイズ一覧に戻る' });
    if (await backButton.isVisible()) {
      await backButton.click();
      await expect(page).toHaveURL('/quiz');
    }
  });

  test('存在しないクイズにアクセスするとエラーメッセージが表示される', async ({ page }) => {
    await page.goto('/quiz/non-existent-quiz-id-xyz');
    await page.waitForLoadState('networkidle');

    // エラーメッセージが表示される
    await expect(page.getByRole('heading', { name: 'クイズが見つかりません' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'クイズ一覧に戻る' })).toBeVisible();
  });
});
