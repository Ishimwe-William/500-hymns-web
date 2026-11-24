const { test, expect } = require('@playwright/test');

test('reader fully prefetches five upcoming hymns and can open one without another RSC fetch', async ({ page }) => {
  const prepared = new Set();
  page.on('response', async response => {
    const url = new URL(response.url());
    const id = /^\/hymns\/(00[2-6])$/.exec(url.pathname)?.[1];
    if (!id || !url.searchParams.has('_rsc')) return;
    try { if ((await response.text()).includes('"sections"')) prepared.add(id); } catch { /* aborted prefetch */ }
  });
  await page.goto('/hymns/001');
  await expect(page.getByRole('navigation', { name: 'Upcoming hymns' }).getByRole('link')).toHaveCount(5);
  await expect.poll(() => [...prepared].sort(), { timeout: 30000 }).toEqual(['002', '003', '004', '005', '006']);
  // Fail any extra request for this route: the complete page should be in the router cache.
  await page.route('**/hymns/006?*', route => route.abort());
  const target = page.getByRole('navigation', { name: 'Upcoming hymns' }).getByRole('link', { name: /^Hymn 6:/ });
  const title = (await target.getAttribute('title')).replace(/^6\.\s*/, '');
  let extraRequests = 0;
  page.on('request', request => { if (new URL(request.url()).pathname === '/hymns/006') extraRequests++; });
  await target.click();
  await expect(page).toHaveURL(/\/hymns\/006$/);
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  expect(extraRequests).toBe(0);
});

test('search keeps a loading indicator visible until the chosen hymn opens', async ({ page }) => {
  let release;
  const wait = new Promise(resolve => { release = resolve; });
  await page.route('**/hymns/050?*', async route => { await wait; await route.continue(); });
  await page.goto('/hymns');
  await page.locator('header').getByRole('textbox').first().fill('50');
  const dialog = page.getByRole('dialog', { name: 'Search hymns', exact: true });
  await expect(dialog).toBeVisible();
  try {
    await dialog.getByRole('textbox').press('Enter');
    await expect(dialog.getByRole('status')).toContainText('Opening hymn');
  } finally { release(); }
  await expect(page).toHaveURL(/\/hymns\/050$/);
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('an unprepared hymn link shows a spinner while the destination is delayed', async ({ page }) => {
  // Navigate backwards to a route outside the lookahead window.
  let release;
  const wait = new Promise(resolve => { release = resolve; });
  await page.route('**/hymns/497?*', async route => { await wait; await route.continue(); });
  await page.goto('/hymns/498');
  await expect(page.getByRole('navigation', { name: 'Upcoming hymns' }).getByRole('link')).toHaveCount(2);
  const previous = page.getByRole('link', { name: /^Previous hymn: 497\./ });
  try {
    await previous.click();
    await expect(previous.getByRole('status', { name: 'Opening hymn', exact: true })).toBeVisible();
  } finally { release(); }
  await expect(page).toHaveURL(/\/hymns\/497$/);
  await expect(page.getByRole('status', { name: 'Opening hymn', exact: true })).toHaveCount(0);
});
