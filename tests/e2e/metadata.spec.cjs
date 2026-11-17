const { test, expect } = require("@playwright/test");

test("public hymn pages expose real search and sharing metadata", async ({ page, request }) => {
  await page.goto("/hymns/001");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://500-hymns.vercel.app/hymns/001");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Hymn 1.*Murinzi/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  const data = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(data.some((value) => JSON.parse(value)["@graph"]?.some((entry) => entry["@type"] === "MusicComposition"))).toBe(true);
  const image = await request.get("/hymns/001/opengraph-image");
  expect(image.ok()).toBe(true);
  expect(image.headers()["content-type"]).toContain("image/png");
  const bytes = await image.body();
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(630);
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("https://500-hymns.vercel.app/hymns/001");
  expect(await sitemap.text()).not.toContain("/admin");
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /admin");
});
