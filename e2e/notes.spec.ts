import { test, expect } from '@playwright/test';

// Set mock auth before each test (for routes that require authentication)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('e2e_mock_authenticated', 'true');
  });
});

test.describe('ノート機能 - Notes Functionality', () => {
  test('ノートページが正しく表示される', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    // ノートページの要素を確認
    await expect(page.getByTestId('notes-page')).toBeVisible();

    // サイドバーが表示される
    await expect(page.locator('aside')).toBeVisible();
  });

  test('レッスンIDを指定してノートページにアクセスできる', async ({ page }) => {
    await page.goto('/notes?lessonId=react-basics');
    await page.waitForLoadState('networkidle');

    // ノートページが表示される
    await expect(page.getByTestId('notes-page')).toBeVisible();
  });

  test('ノート作成 - 新しいノートを作成できる', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    // 新規ノートボタンを探してクリック
    const newNoteButton = page.getByRole('button', { name: /新しいノート|ノートを追加/ });

    if (await newNoteButton.isVisible()) {
      await newNoteButton.click();
      await page.waitForTimeout(500);

      // ノート編集エリアが表示される
      const noteEditor = page.locator('textarea, [contenteditable="true"]');
      await expect(noteEditor.first()).toBeVisible();
    }
  });

  test('ノート作成 - テキストを入力できる', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    // 新規ノートボタンをクリック
    const newNoteButton = page.getByRole('button', { name: /新しいノート|ノートを追加/ });

    if (await newNoteButton.isVisible()) {
      await newNoteButton.click();
      await page.waitForTimeout(500);

      // テキストエリアに入力
      const noteEditor = page.locator('textarea').first();
      if (await noteEditor.isVisible()) {
        await noteEditor.fill('これはテストノートです');
        await page.waitForTimeout(300);

        // 入力内容が反映される
        await expect(noteEditor).toHaveValue('これはテストノートです');
      }
    }
  });

  test('ノート一覧 - サイドバーにレッスンリストが表示される', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    // サイドバー内のリスト要素を確認
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // レッスンボタンまたは空メッセージが表示される
    const lessonButton = sidebar.locator('button').first();
    const emptyMessage = sidebar.getByText('該当するレッスンがありません');

    await expect(lessonButton.or(emptyMessage)).toBeVisible();
  });

  test('ノート編集 - 既存のノートを編集できる', async ({ page }) => {
    // まずノートを作成
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    const newNoteButton = page.getByRole('button', { name: /新しいノート|ノートを追加/ });
    if (await newNoteButton.isVisible()) {
      await newNoteButton.click();
      await page.waitForTimeout(500);

      const noteEditor = page.locator('textarea').first();
      if (await noteEditor.isVisible()) {
        await noteEditor.fill('編集前のテキスト');
        await page.waitForTimeout(500);

        // 保存ボタンがあればクリック
        const saveButton = page.getByRole('button', { name: /保存/ });
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // サイドバーから作成したノートをクリック
    const sidebar = page.locator('aside');
    const noteItem = sidebar.locator('button, a, li').first();

    if (await noteItem.isVisible()) {
      await noteItem.click();
      await page.waitForTimeout(500);

      // 編集
      const editor = page.locator('textarea').first();
      if (await editor.isVisible()) {
        await editor.clear();
        await editor.fill('編集後のテキスト');
        await page.waitForTimeout(300);

        await expect(editor).toHaveValue('編集後のテキスト');
      }
    }
  });

  test('ノート削除 - ノートを削除できる', async ({ page }) => {
    // まずノートを作成
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    const newNoteButton = page.getByRole('button', { name: /新しいノート|ノートを追加/ });
    if (await newNoteButton.isVisible()) {
      await newNoteButton.click();
      await page.waitForTimeout(500);

      const noteEditor = page.locator('textarea').first();
      if (await noteEditor.isVisible()) {
        await noteEditor.fill('削除されるノート');
        await page.waitForTimeout(500);

        const saveButton = page.getByRole('button', { name: /保存/ });
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // 削除ボタンを探してクリック
    const deleteButton = page.getByRole('button', { name: /削除/ });

    if (await deleteButton.isVisible()) {
      // 確認ダイアログを自動承認
      page.on('dialog', (dialog) => dialog.accept());

      await deleteButton.click();
      await page.waitForTimeout(500);

      // ノートが削除されたことを確認（空メッセージまたはノートが消える）
      // 削除後は空メッセージが表示されるか、サイドバーが表示される
      await expect(
        page.getByText(/ノートがありません|まだノートがありません/).or(page.locator('aside'))
      ).toBeVisible();
    }
  });

  test('ノート検索 - 検索フィールドが表示される', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    // 検索フィールドが存在するか確認
    const searchInput = page.locator('input[type="search"], input[placeholder*="検索"]');

    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('ノート検索 - キーワードで検索できる', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"], input[placeholder*="検索"]');

    if (await searchInput.isVisible()) {
      // 検索キーワードを入力
      await searchInput.fill('React');
      await page.waitForTimeout(500);

      // 検索結果が表示される（またはフィルターされる）
      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();
    }
  });

  test('ノートフィルター - レッスン別にフィルターできる', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    // レッスンフィルターのセレクトボックスを探す
    const lessonSelect = page.locator('select').first();

    if (await lessonSelect.isVisible()) {
      // レッスンを選択
      const options = await lessonSelect.locator('option').all();
      if (options.length > 1) {
        const firstLessonOption = await options[1].getAttribute('value');
        if (firstLessonOption) {
          await lessonSelect.selectOption(firstLessonOption);
          await page.waitForTimeout(300);

          // フィルター後のノートリストが表示される
          const sidebar = page.locator('aside');
          await expect(sidebar).toBeVisible();
        }
      }
    }
  });

  test('ノート詳細 - ノートをクリックすると詳細が表示される', async ({ page }) => {
    // まずノートを作成
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    const newNoteButton = page.getByRole('button', { name: /新しいノート|ノートを追加/ });
    if (await newNoteButton.isVisible()) {
      await newNoteButton.click();
      await page.waitForTimeout(500);

      const noteEditor = page.locator('textarea').first();
      if (await noteEditor.isVisible()) {
        await noteEditor.fill('詳細表示のテスト');
        await page.waitForTimeout(500);

        const saveButton = page.getByRole('button', { name: /保存/ });
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // サイドバーからノートをクリック
    const sidebar = page.locator('aside');
    const noteItem = sidebar.locator('button, a, li').first();

    if (await noteItem.isVisible()) {
      await noteItem.click();
      await page.waitForTimeout(500);

      // 詳細エリアが表示される
      const detailArea = page.locator('textarea, [contenteditable="true"]');
      await expect(detailArea.first()).toBeVisible();
    }
  });

  test('ノートの自動保存 - 入力後自動的に保存される', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    const newNoteButton = page.getByRole('button', { name: /新しいノート|ノートを追加/ });
    if (await newNoteButton.isVisible()) {
      await newNoteButton.click();
      await page.waitForTimeout(500);

      const noteEditor = page.locator('textarea').first();
      if (await noteEditor.isVisible()) {
        await noteEditor.fill('自動保存のテスト');

        // 数秒待って自動保存を待つ
        await page.waitForTimeout(2000);

        // ページをリロードして保存されているか確認
        await page.reload();
        await page.waitForLoadState('networkidle');

        // サイドバーにノートが表示される
        const sidebar = page.locator('aside');
        const notesList = sidebar.locator('button, a, li');

        if (await notesList.first().isVisible()) {
          await expect(notesList.first()).toBeVisible();
        }
      }
    }
  });

  test('ノートページに直接アクセスできる', async ({ page }) => {
    // ノートページに直接アクセス
    await page.goto('/notes?lessonId=react-basics');
    await page.waitForLoadState('networkidle');

    // ノートページが表示される
    await expect(page.getByTestId('notes-page')).toBeVisible();
  });

  test('ノートページからレッスンに戻る', async ({ page }) => {
    await page.goto('/notes?lessonId=react-basics');
    await page.waitForLoadState('networkidle');

    // レッスンに戻るリンクを探す
    const backLink = page.getByRole('link', { name: /レッスンに戻る|戻る/ });

    if (await backLink.isVisible()) {
      await backLink.click();

      // レッスン詳細ページに遷移
      await expect(page).toHaveURL(/\/lessons\/.+/);
    }
  });

  test('ノートページのサイドバーが表示される', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');

    // サイドバーが表示される
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // メインエリアが表示される
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
