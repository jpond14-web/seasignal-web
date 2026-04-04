import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('renders with email input and magic link option', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Sign in');
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Magic Link' })).toBeVisible();
  });

  test('renders password input when Password tab is selected', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Password' }).click();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Sign In' })).toBeVisible();
  });

  test('invalid login shows error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Password' }).click();
    await page.locator('input#email').fill('invalid@test.com');
    await page.locator('input#password').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.text-red-400')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Signup Page', () => {
  test('renders with required fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('h2')).toContainText('Create your account');
    await expect(page.locator('input#displayName')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Create Account' })).toBeVisible();
  });
});

test.describe('Protected Route Redirects', () => {
  test('redirects to login for /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects to login for /messages', async ({ page }) => {
    await page.goto('/messages');
    await expect(page).toHaveURL(/\/login/);
  });
});
