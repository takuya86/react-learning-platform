import { test, expect } from '@playwright/test';

test.describe('Admin Authorization', () => {
  test('should show role selector in mock mode on login page', async ({ page }) => {
    await page.goto('/login');

    // Should show role selector
    await expect(page.getByText('テスト用ロール:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ユーザー' })).toBeVisible();
    await expect(page.getByRole('button', { name: '管理者' })).toBeVisible();
  });

  test('should allow switching between user and admin roles in mock mode', async ({ page }) => {
    await page.goto('/login');

    // Initially, user should be selected (default)
    const userButton = page.getByRole('button', { name: 'ユーザー' });
    const adminButton = page.getByRole('button', { name: '管理者' });

    // Click admin button
    await adminButton.click();

    // Check localStorage was updated
    const mockRole = await page.evaluate(() => localStorage.getItem('e2e_mock_role'));
    expect(mockRole).toBe('admin');

    // Click user button
    await userButton.click();

    // Check localStorage was updated
    const mockRoleAfter = await page.evaluate(() => localStorage.getItem('e2e_mock_role'));
    expect(mockRoleAfter).toBe('user');
  });

  test('should not show admin link in navigation for regular user', async ({ page }) => {
    // Enable mock authentication as user
    await page.addInitScript(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
      localStorage.setItem('e2e_mock_role', 'user');
    });

    await page.goto('/');

    // Should not see admin link
    await expect(page.getByRole('link', { name: '管理' })).not.toBeVisible();
  });

  test('should show admin link in navigation for admin user', async ({ page }) => {
    // Enable mock authentication as admin
    await page.addInitScript(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
      localStorage.setItem('e2e_mock_role', 'admin');
    });

    await page.goto('/');

    // Should see admin link
    await expect(page.getByRole('link', { name: '管理' })).toBeVisible();
  });

  test('should show 403 error when regular user tries to access admin page', async ({ page }) => {
    // Enable mock authentication as user
    await page.addInitScript(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
      localStorage.setItem('e2e_mock_role', 'user');
    });

    await page.goto('/admin');

    // Should show 403 error
    await expect(page.getByText('403 - アクセス拒否')).toBeVisible();
    await expect(page.getByText('このページにアクセスする権限がありません。')).toBeVisible();
    await expect(page.getByText(/管理者権限が必要です/)).toBeVisible();
  });

  test('should allow admin user to access admin page', async ({ page }) => {
    // Enable mock authentication as admin
    await page.addInitScript(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
      localStorage.setItem('e2e_mock_role', 'admin');
    });

    await page.goto('/admin');

    // Should show admin page content
    await expect(page.getByRole('heading', { name: '管理者ページ' })).toBeVisible();
    await expect(page.getByText('管理者専用の機能にアクセスできます')).toBeVisible();
    await expect(page.getByText('ユーザー管理')).toBeVisible();
    await expect(page.getByText('コンテンツ管理')).toBeVisible();
  });

  test('should navigate to admin page via navigation link', async ({ page }) => {
    // Enable mock authentication as admin
    await page.addInitScript(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
      localStorage.setItem('e2e_mock_role', 'admin');
    });

    await page.goto('/');

    // Click admin link
    await page.getByRole('link', { name: '管理' }).click();

    // Should be on admin page
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('heading', { name: '管理者ページ' })).toBeVisible();
  });

  test('should display correct role badge on admin page', async ({ page }) => {
    // Enable mock authentication as admin
    await page.addInitScript(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
      localStorage.setItem('e2e_mock_role', 'admin');
    });

    await page.goto('/admin');

    // Should show admin badge
    await expect(page.getByText('管理者')).toBeVisible();
  });

  test('should redirect to login when unauthenticated user tries to access admin page', async ({
    page,
  }) => {
    await page.goto('/admin');

    // Should be redirected to /login
    await expect(page).toHaveURL(/\/login/);
  });
});
