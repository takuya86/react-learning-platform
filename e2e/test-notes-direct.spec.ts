import { test, expect } from '@playwright/test';

test('直接 /notes?lessonId=xxx にアクセス', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('/notes?lessonId=react-basics');
  await page.waitForLoadState('networkidle');

  console.log('Console errors:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors.slice(0, 3));
  }

  await expect(page.getByTestId('notes-page')).toBeVisible({ timeout: 5000 });
});
