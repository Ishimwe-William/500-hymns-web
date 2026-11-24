const { test, expect } = require('@playwright/test');

for (const userAgent of ['Plain HTML reader', 'ChatGPT-User/1.0', 'OAI-SearchBot/1.0']) {
  test(`hymn list is visible without JavaScript for ${userAgent}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false, userAgent });
    try {
      const page = await context.newPage();
      const response = await page.goto('/hymns');
      expect(response.status()).toBe(200);
      const html = await response.text();
      // Real anchor markup, not a title serialized inside a React script payload.
      expect(html).toMatch(/<a[^>]*href="\/hymns\/001"/);
      await expect(page.locator('main a[href="/hymns/001"]').first()).toContainText('Murinzi');
      await expect(page.locator('main a[href="/hymns/001"]').first()).toBeVisible();
      await expect(page.getByText('Loading hymnbook...', { exact: true })).toHaveCount(0);
      await expect(page.locator('footer')).toContainText('BunsenPlus');
      await expect(page.locator('main header')).toContainText('Seventh-day Adventist Church in Rwanda');
      for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
        await expect(page.locator(selector)).toHaveAttribute('content', /Seventh-day Adventist Church in Rwanda/);
      }
      await page.goto('/hymns/001');
      await expect(page.getByRole('heading', { name: /Murinzi/ })).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/Uhan.*umuntu wese/).first()).toBeVisible();
    } finally { await context.close(); }
  });
}

test('homepage redirects at HTTP level and sitemap exposes every hymn', async ({ request }) => {
  const home = await request.get('/', { maxRedirects: 0 });
  expect(home.status()).toBe(308);
  expect(home.headers().location).toBe('/hymns');
  const sitemap = await request.get('/sitemap.xml');
  expect((await sitemap.text()).match(/<loc>[^<]+\/hymns\/[^<]+<\/loc>/g)).toHaveLength(500);
});
