const { test, expect } = require('@playwright/test');
const { mkdir } = require('node:fs/promises');

test('the hymnbook exposes a standalone install manifest and correctly sized branded icons', async ({ page, request }) => {
  await page.goto('/hymns');
  const link = page.locator('link[rel="manifest"]');
  await expect(link).toHaveAttribute('href', /\/manifest.webmanifest/);
  const response = await request.get(await link.getAttribute('href'));
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.id).toBe('/');
  expect(manifest.start_url).toBe('/hymns');
  expect(manifest.scope).toBe('/');
  expect(manifest.display).toBe('standalone');
  expect(manifest.name).toBe('Indirimbo Zo Guhimbaza Imana');
  expect(manifest.prefer_related_applications).toBe(false);
  for (const icon of manifest.icons) {
    const image = await request.get(icon.src);
    expect(image.ok()).toBe(true);
    expect(image.headers()['content-type']).toContain('image/png');
    const bytes = await image.body();
    expect(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`).toBe(icon.sizes);
  }
});

test('production installation support controls pages, passes Chrome checks, and keeps private data out of offline storage', async ({ playwright, baseURL, request }, testInfo) => {
  test.skip(!process.env.PWA_PRODUCTION_TEST, 'Service workers are registered in production only.');
  // Installation is disabled in Playwright's default incognito contexts.
  const profile = testInfo.outputPath('browser-profile');
  await mkdir(profile, { recursive: true });
  const context = await playwright.chromium.launchPersistentContext(profile, { channel: 'chrome', headless: true, baseURL });
  try {
  const page = context.pages()[0] ?? await context.newPage();
  await page.goto('/hymns');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const worker = await request.get('/sw.js');
  expect(worker.headers()['cache-control']).toContain('no-store');
  const cdp = await context.newCDPSession(page);
  await cdp.send('Page.enable');
  await expect.poll(async () => (await cdp.send('Page.getInstallabilityErrors')).installabilityErrors).toEqual([]);
  const cached = await page.evaluate(async () => {
    const cache = await caches.open('hymnbook-shell-v7');
    return (await cache.keys()).map(request => new URL(request.url).pathname).sort();
  });
  expect(cached).toEqual(['/offline-presentation.js', '/offline-reader.js', '/offline.css', '/offline.html', '/pwa/icon-192.png', '/pwa/icon-512.png', '/pwa/icon-maskable-512.png']);
  await context.setOffline(true);
  await page.goto('/hymns/001');
  await expect(page.getByRole('heading', { name: 'Reconnect to your hymnbook' })).toBeVisible();
  await context.setOffline(false);
  await page.getByRole('link', { name: 'Try again', exact: true }).click();
  await expect(page.getByText('Murinzi We, Vuz', { exact: false }).first()).toBeVisible();
  await page.goto('/settings#offline-storage');
  await page.getByRole('button', { name: 'Download hymns', exact: true }).click();
  await expect(page.getByText('500 hymns saved for offline reading and search.')).toBeVisible({ timeout: 60000 });
  await context.setOffline(true);
  await page.goto('/hymns/372');
  await expect(page.locator('.reader h1')).toContainText('Kwa Kwizera');
  const audiencePromise = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Present', exact: true }).click();
  const audience = await audiencePromise;
  if (!await audience.evaluate(() => Boolean(document.fullscreenElement))) {
    await audience.locator('body').click({ position: { x: 40, y: 40 } });
  }
  await expect.poll(() => audience.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await expect(audience.getByRole('button', { name: 'Enter fullscreen', exact: true })).toHaveCount(0);
  await expect(audience.locator('.slide-lyrics')).toBeVisible();
  await expect(audience.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect(audience.locator('.slide-lyrics')).toHaveCSS('white-space', 'pre-line');
  await expect(audience.locator('.offline-slide')).toHaveCSS('text-align', 'center');
  await expect.poll(() => audience.locator('.slide-lyrics').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThan(32);
  expect(await audience.locator('link[rel="stylesheet"]').count()).toBe(0);
  expect(await audience.locator('.offline-slide').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  await audience.setViewportSize({ width: 1024, height: 500 });
  await expect.poll(() => audience.locator('.offline-slide').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  const firstLyrics = await audience.locator('.slide-lyrics').textContent();
  await page.getByRole('button', { name: 'Next slide', exact: true }).click();
  await expect(audience.locator('.slide-lyrics')).not.toHaveText(firstLyrics);
  await expect(audience.locator('h2')).toHaveText('Refrain');
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
  await page.getByRole('button', { name: 'Blank audience screen', exact: true }).click();
  await expect(audience.locator('.slide-lyrics')).toHaveCount(0);
  await page.keyboard.press('b');
  await expect(audience.locator('.slide-lyrics')).toBeVisible();
  await audience.close();
  await expect(page.getByRole('status')).toContainText('Audience window closed');
  await page.getByRole('button', { name: 'End presentation', exact: true }).click();
  await expect(page.locator('.reader h1')).toContainText('Kwa Kwizera');
  await page.getByRole('button', { name: '♡ Favorite', exact: true }).click();
  await page.getByRole('link', { name: 'Favorites', exact: true }).click();
  await expect(page.locator('.results')).toContainText('Kwa Kwizera');
  await page.getByRole('link', { name: 'Hymns', exact: true }).click();
  await page.getByRole('searchbox').fill('Murinzi');
  await expect(page.locator('.results a[href="/hymns/001"]')).toBeVisible();
  await page.locator('.results a[href="/hymns/001"]').click();
  await expect(page.locator('.reader h1')).toContainText('Murinzi');
  const before = await page.evaluate(async () => (await (await caches.open('hymnbook-lyrics-v1')).match('/__offline/library')).json().then(pack => pack.checkedAt));
  await context.setOffline(false);
  // Chrome's emulated offline mode can leave navigator.onLine true in a worker
  // fallback document. Deliver the browser reconnect event after restoring HTTP.
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect.poll(() => page.evaluate(async () => (await (await caches.open('hymnbook-lyrics-v1')).match('/__offline/library')).json().then(pack => pack.checkedAt)), { timeout: 15000 }).not.toBe(before);
  await page.goto('/settings#offline-storage');
  await page.getByRole('button', { name: 'Remove download', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Download hymns', exact: true })).toBeVisible();
  } finally { await context.close(); }
});
