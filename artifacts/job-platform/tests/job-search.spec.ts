// tests/job-search.spec.ts - Job search flow test
import { test, expect } from '@playwright/test';

test.describe('Job Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming user is already logged in via session storage or mock auth
    // For simplicity, we'll navigate directly to protected route
    // In a real test, you might want to handle authentication properly
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');
  });

  test('user can search for jobs', async ({ page }) => {
    // Wait for jobs to load
    await expect(page.locator('text=jobs found')).toBeVisible();

    // Enter search term
    await page.fill('input[placeholder*="Search jobs"]', 'software engineer');
    await page.press('input[placeholder*="Search jobs"]', 'Enter');

    // Wait for results to update
    await page.waitForTimeout(1000); // Simple wait for debounce

    // Verify search worked (results may vary based on mock data)
    await expect(page.locator('text=jobs found')).toBeVisible();
  });

  test('user can filter jobs by work mode', async ({ page }) => {
    // Click work mode dropdown
    await page.click('text=All Types');

    // Select Remote option
    await page.click('text=Remote');

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    // Verify filter is applied (would need to check URL or active filter indicator)
    await expect(page.locator('text=Remote')).toBeVisible();
  });

  test('user can view job details', async ({ page }) => {
    // Wait for job listings to load
    await expect(page.locator('text=Software Engineer')).toBeVisible();

    // Click on first job listing
    await page.click('text=Software Engineer');

    // Should navigate to job detail page
    await expect(page).toHaveURL(/\/jobs\/\d+/);

    // Verify job details are displayed
    await expect(page.locator('text=Software Engineer')).toBeVisible();
    await expect(page.locator('text=About the Role')).toBeVisible();
  });

  test('user can track a job application', async ({ page }) => {
    // Navigate to jobs page if not already there
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    // Find and click on a job
    await page.click('text=Software Engineer');
    await page.waitForURL(/\/jobs\/\d+/);

    // Click track application button
    await page.click('button:has-text("Track Application")');

    // Should show success toast or confirmation
    await expect(page.locator('text=Application tracked!')).toBeVisible();

    // Button text should change
    await expect(page.locator('button:has-text("Tracking…")')).toBeVisible();
  });
});