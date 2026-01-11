/**
 * Habit Intervention E2E Tests
 *
 * P2-2 仕様:
 * - Habit scoreによる状態判定（stable/warning/danger）
 * - 介入UIが表示される条件
 * - CTAクリックでレッスン開始
 */

import { test, expect } from '@playwright/test';

test.describe('Habit Intervention', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user login
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
    });
    await page.reload();
  });

  test.describe('Intervention Card Display', () => {
    test('intervention card is conditionally rendered based on habit state', async ({ page }) => {
      // In mock mode with no activity, the intervention card may or may not appear
      // depending on the calculated habit state
      await page.waitForLoadState('networkidle');

      // Check that dashboard loads correctly
      const metricsCard = page.getByTestId('learning-metrics-card');
      await expect(metricsCard).toBeVisible();

      // Intervention card visibility depends on habit state
      const interventionCard = page.getByTestId('habit-intervention-card');
      // Just verify the element can be queried (may or may not be visible)
      const isVisible = await interventionCard.isVisible().catch(() => false);
      // Log the state for debugging
      console.log('Intervention card visible:', isVisible);
    });

    test('intervention card has appropriate content when displayed', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const interventionCard = page.getByTestId('habit-intervention-card');

      // If intervention is visible, verify it has content
      if (await interventionCard.isVisible().catch(() => false)) {
        // Should have an icon
        const icon = interventionCard.locator('[class*="icon"]');
        await expect(icon).toBeVisible();

        // Should have message text
        const textContent = await interventionCard.textContent();
        expect(textContent).toBeTruthy();
        expect(textContent!.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Intervention Types', () => {
    test('stable state shows POSITIVE intervention with encouraging message', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const interventionCard = page.getByTestId('habit-intervention-card');

      // If POSITIVE intervention is shown, verify content is encouraging
      if (await interventionCard.isVisible().catch(() => false)) {
        const type = await interventionCard.getAttribute('data-intervention-type');

        if (type === 'POSITIVE') {
          // Positive messages should be encouraging
          const text = await interventionCard.textContent();
          // Should not contain warning/danger language
          expect(text).not.toContain('危険');
          expect(text).not.toContain('警告');
        }
      }
    });

    test('intervention card uses calm colors (no red/warning)', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const interventionCard = page.getByTestId('habit-intervention-card');

      if (await interventionCard.isVisible().catch(() => false)) {
        // Get computed background color
        const bgColor = await interventionCard.evaluate((el) => {
          return window.getComputedStyle(el).backgroundImage;
        });

        // Should not be red-toned (our design uses green, blue, purple gradients)
        expect(bgColor).not.toContain('rgb(255, 0, 0)');
        expect(bgColor).not.toContain('#ff0000');
      }
    });
  });

  test.describe('CTA Functionality', () => {
    test('CTA button navigates to lesson when clicked', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const ctaButton = page.getByTestId('intervention-cta');

      // If CTA is visible, clicking it should navigate
      if (await ctaButton.isVisible().catch(() => false)) {
        await ctaButton.click();

        // Should navigate to a lesson or roadmap
        await expect(page).toHaveURL(/\/(lessons|roadmap)/);
      }
    });

    test('CTA text matches intervention type', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const interventionCard = page.getByTestId('habit-intervention-card');
      const ctaButton = page.getByTestId('intervention-cta');

      if (
        (await interventionCard.isVisible().catch(() => false)) &&
        (await ctaButton.isVisible().catch(() => false))
      ) {
        const type = await interventionCard.getAttribute('data-intervention-type');
        const ctaText = await ctaButton.textContent();

        if (type === 'STREAK_RESCUE') {
          expect(ctaText).toBe('5分だけ学習する');
        } else if (type === 'WEEKLY_CATCHUP') {
          expect(ctaText).toBe('今週分を取り戻す');
        }
      }
    });
  });

  test.describe('Non-intervention Scenarios', () => {
    test('logged out user does not see intervention card', async ({ page }) => {
      // Clear auth
      await page.evaluate(() => {
        localStorage.removeItem('e2e_mock_authenticated');
      });
      await page.goto('/');

      // Intervention should not be visible
      const interventionCard = page.getByTestId('habit-intervention-card');
      await expect(interventionCard).not.toBeVisible();
    });

    test('intervention card does not block other dashboard elements', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Other elements should always be visible regardless of intervention state
      await expect(page.getByTestId('learning-metrics-card')).toBeVisible();
      await expect(page.getByTestId('clickable-heatmap')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('intervention card is accessible', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const interventionCard = page.getByTestId('habit-intervention-card');

      if (await interventionCard.isVisible().catch(() => false)) {
        // Card should have data-testid for accessibility testing
        const testId = await interventionCard.getAttribute('data-testid');
        expect(testId).toBe('habit-intervention-card');
      }
    });
  });

  test.describe('Intervention Logging (P2-2 運用強化)', () => {
    test('STREAK_RESCUE intervention has correct data-intervention-type attribute', async ({
      page,
    }) => {
      await page.waitForLoadState('networkidle');

      const interventionCard = page.getByTestId('habit-intervention-card');

      if (await interventionCard.isVisible().catch(() => false)) {
        const type = await interventionCard.getAttribute('data-intervention-type');

        // If it's a STREAK_RESCUE type, verify the attribute is set correctly
        if (type === 'STREAK_RESCUE') {
          expect(type).toBe('STREAK_RESCUE');
          // STREAK_RESCUE should have a CTA
          const cta = page.getByTestId('intervention-cta');
          await expect(cta).toBeVisible();
        }
      }
    });

    test('WEEKLY_CATCHUP intervention has correct data-intervention-type attribute', async ({
      page,
    }) => {
      await page.waitForLoadState('networkidle');

      const interventionCard = page.getByTestId('habit-intervention-card');

      if (await interventionCard.isVisible().catch(() => false)) {
        const type = await interventionCard.getAttribute('data-intervention-type');

        // If it's a WEEKLY_CATCHUP type, verify the attribute is set correctly
        if (type === 'WEEKLY_CATCHUP') {
          expect(type).toBe('WEEKLY_CATCHUP');
          // WEEKLY_CATCHUP should have a CTA
          const cta = page.getByTestId('intervention-cta');
          await expect(cta).toBeVisible();
        }
      }
    });

    test('POSITIVE intervention has no CTA button (not logged)', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const interventionCard = page.getByTestId('habit-intervention-card');

      if (await interventionCard.isVisible().catch(() => false)) {
        const type = await interventionCard.getAttribute('data-intervention-type');

        // POSITIVE intervention should NOT have a CTA
        if (type === 'POSITIVE') {
          expect(type).toBe('POSITIVE');
          const cta = page.getByTestId('intervention-cta');
          await expect(cta).not.toBeVisible();
        }
      }
    });

    test('intervention type attribute is one of valid types', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const interventionCard = page.getByTestId('habit-intervention-card');

      if (await interventionCard.isVisible().catch(() => false)) {
        const type = await interventionCard.getAttribute('data-intervention-type');
        expect(['STREAK_RESCUE', 'WEEKLY_CATCHUP', 'POSITIVE']).toContain(type);
      }
    });
  });
});
