import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should display login page', async ({ page }) => {
        await page.goto('/login');

        // Check for email and password inputs
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should login successfully', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[type="email"]', 'wrong@example.com');
        await page.fill('input[type="password"]', 'wrongpass');
        await page.click('button[type="submit"]');

        // Check for error message (adjust selector based on your implementation)
        await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({ timeout: 5000 });
    });
});
