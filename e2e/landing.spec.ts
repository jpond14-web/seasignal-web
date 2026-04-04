import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SeaSignal/);
  });

  test('displays hero heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('SeaSignal');
    await expect(page.locator('h1')).toContainText('for Seafarers');
  });

  test('Get Started link navigates to /signup', async ({ page }) => {
    await page.goto('/');
    const getStarted = page.locator('a', { hasText: 'Get Started' });
    await expect(getStarted).toHaveAttribute('href', '/signup');
    await getStarted.click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('Learn More link scrolls to features section', async ({ page }) => {
    await page.goto('/');
    const learnMore = page.locator('a', { hasText: 'Learn More' });
    await expect(learnMore).toHaveAttribute('href', '#features');
  });

  test('footer contains legal links', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer.locator('a', { hasText: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    await expect(footer.locator('a', { hasText: 'Terms of Service' })).toHaveAttribute('href', '/terms');
    await expect(footer.locator('a', { hasText: 'About' })).toHaveAttribute('href', '/about');
    await expect(footer.locator('a', { hasText: 'Contact' })).toHaveAttribute('href', '/contact');
  });

  test('legal pages load without error', async ({ page }) => {
    for (const path of ['/privacy', '/terms', '/about', '/contact']) {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
    }
  });
});
