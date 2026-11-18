const { test, expect } = require('@playwright/test');

test('grid photos are decorative and disappear offline, with a solid fallback on image failure', async ({ page, context }) => {
  await page.route('https://images.unsplash.com/**', route => route.fulfill({ path: 'public/pwa/icon-192.png', contentType: 'image/png' }));
  await page.goto('/hymns');
  await page.getByRole('button', { name: 'Grid view', exact: true }).click();
  const photos = page.locator('main img[src*="images.unsplash.com"]');
  await expect(photos).toHaveCount(20);
  await expect(photos.first()).toHaveAttribute('alt', '');
  await context.setOffline(true);
  await expect(photos).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Read →', exact: true }).first()).toBeVisible();
  await context.setOffline(false);
  await expect(photos).toHaveCount(20);
  await photos.first().evaluate(image => image.dispatchEvent(new Event('error')));
  await expect(photos).toHaveCount(19);
});
