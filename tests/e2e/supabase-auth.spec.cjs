const { test, expect } = require('@playwright/test');

test('Google sign-in starts native Supabase PKCE with a same-origin callback', async ({ page }) => {
  let authorization;
  await page.route('**/auth/v1/authorize?**', async route => {
    authorization = new URL(route.request().url());
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<p>OAuth provider handoff</p>' });
  });
  await page.goto('/hymns');
  const origin = new URL(page.url()).origin;
  await page.getByRole('button', { name: 'Account menu', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
  await expect(page.getByText('OAuth provider handoff')).toBeVisible();
  expect(authorization.searchParams.get('provider')).toBe('google');
  expect(authorization.searchParams.get('redirect_to')).toBe(`${origin}/auth/callback`);
  expect(authorization.searchParams.get('code_challenge_method')).toBe('s256');
  expect(authorization.searchParams.get('code_challenge')).toBeTruthy();
  expect(authorization.searchParams.has('access_token')).toBe(false);
});

test('cancelled OAuth callbacks show recovery without leaking provider error details', async ({ page }) => {
  await page.goto('/auth/callback?error=access_denied&error_description=private-provider-detail');
  await expect(page.getByRole('heading', { name: 'Sign-in could not be completed' })).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/callback$/);
  await expect(page.getByText('private-provider-detail')).toHaveCount(0);
  await page.getByRole('link', { name: 'Return to sign-in' }).click();
  await expect(page).toHaveURL(/\/profile$/);
});
