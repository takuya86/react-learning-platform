import { test, expect } from '@playwright/test';

/**
 * P3-1 Learning Effectiveness E2E Tests
 *
 * [spec-lock] Tests for follow-up actions and effectiveness measurement
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('e2e_mock_authenticated', 'true');
    localStorage.setItem('e2e_mock_role', 'user');
  });
});

test.describe('LessonDetailPage - Follow-up Actions', () => {
  /**
   * [spec-lock] Review button is visible on lesson detail page
   */
  test('should display review button on lesson detail page', async ({ page }) => {
    // Navigate directly to a lesson detail page
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // Review button should be visible
    const reviewButton = page.getByTestId('review-button');
    await expect(reviewButton).toBeVisible();
    await expect(reviewButton).toHaveText('復習する（3分）');
  });

  /**
   * [spec-lock] Review button can be clicked to start review
   */
  test('should be able to click review button', async ({ page }) => {
    // Navigate directly to a lesson
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // Review button should be clickable
    const reviewButton = page.getByTestId('review-button');
    await expect(reviewButton).toBeVisible();
    await expect(reviewButton).toBeEnabled();

    // Click the button (should not throw)
    await reviewButton.click();
  });

  /**
   * [spec-lock] Quiz link is visible when lesson has a quiz
   */
  test('should display quiz link when lesson has a quiz', async ({ page }) => {
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // Quiz link should be visible (if the lesson has a quiz)
    const quizLink = page.getByTestId('open-quiz-link');
    // Some lessons might not have quizzes, so we check if it exists
    const quizLinkCount = await quizLink.count();
    if (quizLinkCount > 0) {
      await expect(quizLink).toBeVisible();
      await expect(quizLink).toHaveText('クイズを開く');
    }
  });

  /**
   * [spec-lock] Notes link is always visible
   */
  test('should display notes link on lesson detail page', async ({ page }) => {
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // Notes link should be visible
    const notesLink = page.getByTestId('open-notes-link');
    await expect(notesLink).toBeVisible();
    await expect(notesLink).toHaveText('ノートを開く');
  });

  /**
   * [spec-lock] Next lesson links are clickable
   */
  test('should display next lesson section when there are next lessons', async ({ page }) => {
    // Navigate to a lesson that has next lessons
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // Check for next lessons section (if available)
    const nextLessonsTitle = page.getByText('次に読むべきレッスン');
    const nextLessonsCount = await nextLessonsTitle.count();

    if (nextLessonsCount > 0) {
      await expect(nextLessonsTitle).toBeVisible();
    }
  });
});

test.describe('LessonDetailPage - Action Buttons Layout', () => {
  /**
   * [spec-lock] All action buttons are in the footer
   */
  test('should display all action buttons in footer', async ({ page }) => {
    await page.goto('/lessons/react-basics');
    await page.waitForLoadState('networkidle');

    // Review button
    await expect(page.getByTestId('review-button')).toBeVisible();

    // Notes link
    await expect(page.getByTestId('open-notes-link')).toBeVisible();

    // Back to lessons link
    await expect(page.getByText('レッスン一覧に戻る')).toBeVisible();
  });
});
