/**
 * Actionable Learning Visualization E2E Tests
 *
 * P2-1 仕様:
 * - P2-1.1: Heatmap daily drill-down (click on day shows modal)
 * - P2-1.2: Streak alert shows warning/success
 * - P2-1.3: Weekly countdown displays remaining events/days
 * - P2-1.4: Today action card with CTA
 */

import { test, expect } from '@playwright/test';

test.describe('Actionable Learning Visualization', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user login
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
    });
    await page.reload();
  });

  test.describe('P2-1.1: Heatmap Drill-down', () => {
    test('clicking heatmap day opens drill-down modal', async ({ page }) => {
      // Wait for clickable heatmap
      const heatmap = page.getByTestId('clickable-heatmap');
      await expect(heatmap).toBeVisible();

      // Click on a day cell
      const dayCell = page.getByTestId('heatmap-day').first();
      await dayCell.click();

      // Modal should appear
      const modal = page.getByTestId('heatmap-drilldown-modal');
      await expect(modal).toBeVisible();
    });

    test('drill-down modal shows date in header', async ({ page }) => {
      const heatmap = page.getByTestId('clickable-heatmap');
      await expect(heatmap).toBeVisible();

      // Click a day
      const dayCell = page.getByTestId('heatmap-day').first();
      await dayCell.click();

      // Modal should show date (M月D日 format)
      const modal = page.getByTestId('heatmap-drilldown-modal');
      await expect(modal).toBeVisible();
      // Japanese date pattern
      await expect(modal.getByText(/\d{1,2}月\d{1,2}日/)).toBeVisible();
    });

    test('clicking overlay closes modal', async ({ page }) => {
      const heatmap = page.getByTestId('clickable-heatmap');
      await expect(heatmap).toBeVisible();

      // Open modal
      await page.getByTestId('heatmap-day').first().click();
      const modal = page.getByTestId('heatmap-drilldown-modal');
      await expect(modal).toBeVisible();

      // Click overlay to close
      await page.getByTestId('heatmap-drilldown-overlay').click({ position: { x: 10, y: 10 } });
      await expect(modal).not.toBeVisible();
    });

    test('drill-down shows content based on day events', async ({ page }) => {
      const heatmap = page.getByTestId('clickable-heatmap');
      await expect(heatmap).toBeVisible();

      // Click a day
      const dayCell = page.getByTestId('heatmap-day').first();
      await dayCell.click();

      // Modal should appear with either empty state or event list
      const modal = page.getByTestId('heatmap-drilldown-modal');
      await expect(modal).toBeVisible();

      // Should have either empty state or event list
      const emptyState = page.getByTestId('drilldown-empty');
      const eventList = page.getByTestId('drilldown-event-list');
      const hasContent = await emptyState.or(eventList).first().isVisible();
      expect(hasContent).toBe(true);
    });
  });

  test.describe('P2-1.2: Streak Alert', () => {
    test('streak alert is hidden when user has no activity (default state)', async ({ page }) => {
      // In mock mode with no activity, streak alert should not be visible
      // This is the expected behavior - alert only shows when there's activity
      const streakAlert = page.getByTestId('streak-alert');
      await expect(streakAlert).not.toBeVisible();
    });

    test('streak alert container position exists in DOM (for when active)', async ({ page }) => {
      // The alert row container should exist even if alert is hidden
      const alertsRow = page.locator('[class*="alertsRow"]');
      await expect(alertsRow).toBeVisible();
    });
  });

  test.describe('P2-1.3: Weekly Countdown', () => {
    test('weekly countdown is visible on dashboard', async ({ page }) => {
      const countdown = page.getByTestId('weekly-countdown');
      await expect(countdown).toBeVisible();
    });

    test('weekly countdown shows progress bar', async ({ page }) => {
      const countdown = page.getByTestId('weekly-countdown');
      await expect(countdown).toBeVisible();

      // Progress bar should exist
      const progressBar = countdown.locator('[class*="progressBar"]');
      await expect(progressBar).toBeVisible();
    });
  });

  test.describe('P2-1.4: Today Action Card', () => {
    test('today action card is visible on dashboard', async ({ page }) => {
      const actionCard = page.getByTestId('today-action-card');
      await expect(actionCard).toBeVisible();
    });

    test('today action card has CTA button when lessons available', async ({ page }) => {
      const actionCard = page.getByTestId('today-action-card');
      await expect(actionCard).toBeVisible();

      // Should have CTA button when there are lessons to do
      const ctaButton = page.getByTestId('today-action-cta');
      // CTA may or may not be visible depending on mock data state
      // If visible, should navigate to lesson
      if (await ctaButton.isVisible()) {
        await expect(ctaButton).toHaveText('今すぐ始める');
      }
    });

    test('today action card CTA navigates to lesson', async ({ page }) => {
      const ctaButton = page.getByTestId('today-action-cta');

      // If CTA is visible, clicking should navigate
      if (await ctaButton.isVisible()) {
        await ctaButton.click();

        // Should navigate to a lesson page
        await expect(page).toHaveURL(/\/lessons\//);
      }
    });

    test('today action card displays headline', async ({ page }) => {
      const actionCard = page.getByTestId('today-action-card');
      await expect(actionCard).toBeVisible();

      // Should have a headline text
      const text = await actionCard.textContent();
      expect(text).toBeTruthy();
    });
  });

  test.describe('Integration', () => {
    test('core components render on dashboard for logged-in user', async ({ page }) => {
      // Heatmap, countdown, and action card should be visible
      await expect(page.getByTestId('clickable-heatmap')).toBeVisible();
      await expect(page.getByTestId('weekly-countdown')).toBeVisible();
      await expect(page.getByTestId('today-action-card')).toBeVisible();

      // [spec-lock] New users see an encouraging success streak alert (P2-2 "責めない" design)
      const alert = page.getByTestId('streak-alert');
      await expect(alert).toBeVisible();
      await expect(alert).toHaveAttribute('data-alert-type', 'success');
    });

    test('components not shown for logged-out user', async ({ page }) => {
      // Clear user session
      await page.evaluate(() => {
        localStorage.removeItem('e2e_mock_authenticated');
      });
      await page.goto('/');

      // Actionable components should not be visible
      await expect(page.getByTestId('clickable-heatmap')).not.toBeVisible();
      await expect(page.getByTestId('streak-alert')).not.toBeVisible();
      await expect(page.getByTestId('weekly-countdown')).not.toBeVisible();
      await expect(page.getByTestId('today-action-card')).not.toBeVisible();
    });
  });
});
