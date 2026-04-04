import { test, expect } from '@playwright/test';

test.describe('PWA Assets', () => {
  test('manifest.json is accessible and has correct properties', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBeTruthy();
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('service worker registration file exists', async ({ request }) => {
    const response = await request.get('/sw.js');
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toMatch(/javascript/);
  });

  test('offline.html is accessible', async ({ request }) => {
    const response = await request.get('/offline.html');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('html');
  });
});
