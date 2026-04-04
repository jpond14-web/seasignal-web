import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  test('/companies page loads', async ({ page }) => {
    const response = await page.goto('/companies');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('/privacy page loads with content', async ({ page }) => {
    const response = await page.goto('/privacy');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toContainText(/privacy/i);
  });

  test('/terms page loads with content', async ({ page }) => {
    const response = await page.goto('/terms');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toContainText(/terms/i);
  });

  test('/about page loads with content', async ({ page }) => {
    const response = await page.goto('/about');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toContainText(/about|seasignal/i);
  });

  test('/contact page loads', async ({ page }) => {
    const response = await page.goto('/contact');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toContainText(/contact/i);
  });
});
