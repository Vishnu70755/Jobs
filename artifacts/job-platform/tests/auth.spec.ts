// tests/auth.spec.ts - Authentication flow test
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can sign in', async ({ page }) => {
    await page.goto('/');

    // Click sign in link
    await page.click('text=Sign In');

    // Wait for sign in form
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Fill in credentials (using test credentials)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Submit form
    await page.click('button:has-text("Sign In")');

    // Should redirect to protected route after login
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('user can sign up', async ({ page }) => {
    await page.goto('/');

    // Click sign up link
    await page.click('text=Sign Up');

    // Wait for sign up form
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Fill in registration form
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');

    // Submit form
    await page.click('button:has-text("Sign Up")');

    // Should redirect to onboarding or dashboard
    await expect(page).toHaveURL(/\/onboarding|\/dashboard/);
  });
});