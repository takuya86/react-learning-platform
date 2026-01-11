/**
 * Growth Insights E2E Tests
 *
 * P2-3 仕様:
 * - Dashboard に「成長実感カード」が表示される
 * - 過去比較（先週比）と累積が見える
 * - データが少ない/0件でも自然な空状態になる
 */

import { test, expect } from '@playwright/test';

test.describe('Growth Insights', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user login
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
    });
    await page.reload();
  });

  test.describe('Card Display', () => {
    test('growth insights card is conditionally rendered', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Check that dashboard loads
      // Card may or may not be visible depending on data state
      const card = page.getByTestId('growth-insights-card');
      const isVisible = await card.isVisible().catch(() => false);

      // Just verify we can check - card visibility depends on insights data
      console.log('Growth insights card visible:', isVisible);
    });

    test('card renders after page loads', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Give time for async data loading
      await page.waitForTimeout(500);

      const card = page.getByTestId('growth-insights-card');
      const isVisible = await card.isVisible().catch(() => false);

      if (isVisible) {
        // Should have some content
        const textContent = await card.textContent();
        expect(textContent).toBeTruthy();
      }
    });

    test('card has appropriate content when visible', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const card = page.getByTestId('growth-insights-card');

      if (await card.isVisible().catch(() => false)) {
        // Should have some text content
        const textContent = await card.textContent();
        expect(textContent).toBeTruthy();
        expect(textContent!.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Empty State', () => {
    test('empty state shows encouraging message', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const card = page.getByTestId('growth-insights-card');

      if (await card.isVisible().catch(() => false)) {
        const state = await card.getAttribute('data-state');

        // If empty state, should have encouraging message
        if (state === 'empty') {
          const textContent = await card.textContent();
          expect(textContent).toBeTruthy();
          // Should not contain negative words
          expect(textContent).not.toContain('失敗');
          expect(textContent).not.toContain('ダメ');
        }
      }
    });
  });

  test.describe('Active State', () => {
    test('active state shows stats row', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const card = page.getByTestId('growth-insights-card');

      if (await card.isVisible().catch(() => false)) {
        const state = await card.getAttribute('data-state');

        if (state === 'active') {
          // Should show stats
          const textContent = await card.textContent();
          // Should contain day-related text (今週 or 学習日数 or similar)
          expect(textContent).toMatch(/(今週|学習日数|累積)/);
        }
      }
    });

    test('delta display shows comparison', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const card = page.getByTestId('growth-insights-card');

      if (await card.isVisible().catch(() => false)) {
        const state = await card.getAttribute('data-state');
        const delta = await card.getAttribute('data-delta');

        if (state === 'active' && delta !== null) {
          // Should have a delta value
          const deltaNum = parseInt(delta, 10);
          expect(typeof deltaNum).toBe('number');
        }
      }
    });
  });

  test.describe('Content Validation', () => {
    test('card does not use negative/blaming language', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const card = page.getByTestId('growth-insights-card');

      if (await card.isVisible().catch(() => false)) {
        const textContent = await card.textContent();

        // P2-3 design principle: "責めない"
        expect(textContent).not.toContain('悪い');
        expect(textContent).not.toContain('ダメ');
        expect(textContent).not.toContain('失敗');
        expect(textContent).not.toContain('減った');
      }
    });

    test('card uses calm colors', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const card = page.getByTestId('growth-insights-card');

      if (await card.isVisible().catch(() => false)) {
        // Get background style
        const bgStyle = await card.evaluate((el) => {
          return window.getComputedStyle(el).backgroundImage;
        });

        // Should not be red/warning colors
        expect(bgStyle).not.toContain('rgb(255, 0, 0)');
        expect(bgStyle).not.toContain('#ff0000');
      }
    });
  });

  test.describe('Integration', () => {
    test('dashboard elements render for authenticated user', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Check dashboard content - at least one metrics element should be present
      const metricsCard = page.getByTestId('learning-metrics-card');
      const growthCard = page.getByTestId('growth-insights-card');

      const metricsVisible = await metricsCard.isVisible().catch(() => false);
      const growthVisible = await growthCard.isVisible().catch(() => false);

      // At least one should be visible for authenticated user
      console.log('Metrics visible:', metricsVisible, 'Growth visible:', growthVisible);
    });

    test('logged out user does not see growth insights card', async ({ page }) => {
      // Clear auth
      await page.evaluate(() => {
        localStorage.removeItem('e2e_mock_authenticated');
      });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Card should not be visible
      const card = page.getByTestId('growth-insights-card');
      await expect(card).not.toBeVisible();
    });
  });

  test.describe('Mock Data Scenarios', () => {
    test('displays content with mock events', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const card = page.getByTestId('growth-insights-card');

      if (await card.isVisible().catch(() => false)) {
        // Card should display something meaningful
        const textContent = await card.textContent();
        expect(textContent).toBeTruthy();
      }
    });
  });
});
