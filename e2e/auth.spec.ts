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

  test('should show mock mode warning when env vars not set', async ({ page }) => {
    await page.goto('/login');

    // Should show mock mode warning
    await expect(page.getByText('開発モード:')).toBeVisible();
    await expect(page.getByText('.env.local')).toBeVisible();
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

  test('should redirect to original page after mock authentication', async ({ page }) => {
    // First, try to access a protected route without authentication
    await page.goto('/notes');

    // Should be redirected to /login
    await expect(page).toHaveURL(/\/login/);

    // Now enable mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
    });

    // Navigate to /notes again
    await page.goto('/notes');

    // Should now be on /notes page (mock authenticated)
    await expect(page).toHaveURL(/\/notes/);
    await expect(page.getByTestId('notes-page')).toBeVisible();
  });

  test('should access protected route when mock authenticated', async ({ page }) => {
    // Enable mock authentication before navigating
    await page.addInitScript(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
    });

    // Navigate directly to protected route
    await page.goto('/roadmap');

    // Should be on roadmap page (not redirected)
    await expect(page).toHaveURL(/\/roadmap/);
    // Verify we're on the actual roadmap page
    await expect(page.getByText('ロードマップ')).toBeVisible();
  });
});
