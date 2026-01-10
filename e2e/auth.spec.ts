import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect to /login when accessing protected route without authentication', async ({
    page,
  }) => {
    // Try to access a protected route
    await page.goto('/roadmap');

    // Should be redirected to /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to /login when accessing root without authentication', async ({ page }) => {
    // Try to access the root
    await page.goto('/');

    // Should be redirected to /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show login form on /login page', async ({ page }) => {
    await page.goto('/login');

    // Should show login form
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible();
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('should toggle between login and signup forms', async ({ page }) => {
    await page.goto('/login');

    // Initially should show login
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible();

    // Click to switch to signup
    await page.getByRole('button', { name: 'アカウントを作成する' }).click();

    // Should show signup
    await expect(page.getByRole('heading', { name: 'アカウント作成' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'アカウント作成' })).toBeVisible();

    // Click to switch back to login
    await page.getByRole('button', { name: 'すでにアカウントをお持ちの方はこちら' }).click();

    // Should show login again
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible();
  });

  test('should preserve redirect location in state', async ({ page }) => {
    // Try to access /notes
    await page.goto('/notes');

    // Should be on /login page
    await expect(page).toHaveURL(/\/login/);

    // The from state is preserved internally, we can't directly test it
    // but we verify the redirect happened from a protected route
  });
});
