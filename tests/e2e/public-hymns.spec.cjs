const { test, expect } = require("@playwright/test");

test("guests can open hymns and navigate away and back without loading errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /instant-shell|URL data|blocking-prerender|encountered runtime data/.test(message.text())) errors.push(message.text());
  });
  await page.goto("/hymns");
  await expect(page.getByText("Murinzi We, Vuz", { exact: false }).first()).toBeVisible({ timeout: 45000 });
  await expect(page.getByText("No hymns are available right now")).toHaveCount(0);
  await page.locator('header a[href="/about"]').first().click();
  await expect(page).toHaveURL(/\/about$/);
  await page.locator('header a[href="/hymns"]').filter({ hasText: "Hymns" }).first().click();
  await expect(page).toHaveURL(/\/hymns$/);
  await expect(page.getByText("Murinzi We, Vuz", { exact: false }).first()).toBeVisible({ timeout: 45000 });
  await expect(page.getByText("No hymns are available right now")).toHaveCount(0);
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test("About keeps its logo and title together on desktop and phone", async ({ page }, testInfo) => {
  await page.goto("/about");
  await page.evaluate(() => document.fonts.ready);
  const header = page.locator("main header").first();
  for (const width of [1280, 768]) {
    await page.setViewportSize({ width, height: 800 });
    const logo = await header.locator("img").boundingBox();
    const title = await header.locator("h2").boundingBox();
    expect(logo).not.toBeNull(); expect(title).not.toBeNull();
    expect(title.x - logo.x - logo.width).toBeGreaterThanOrEqual(0);
    expect(title.x - logo.x - logo.width).toBeLessThanOrEqual(24);
  }
  await page.screenshot({ path: testInfo.outputPath("about-header.png") });
  await page.setViewportSize({ width: 375, height: 800 });
  const logo = await header.locator("img").boundingBox();
  const title = await header.locator("h2").boundingBox();
  expect(title.y - logo.y - logo.height).toBeGreaterThanOrEqual(0);
  expect(title.y - logo.y - logo.height).toBeLessThanOrEqual(24);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test("missing pages use the branded recovery page and return to real hymns", async ({ page }) => {
  await page.goto("/page-that-does-not-exist");
  await expect(page.getByRole("heading", { name: "This page could not be found" })).toBeVisible();
  await expect(page.locator("main").getByText("Indirimbo Zo", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Back to hymns", exact: true }).click();
  await expect(page.getByText("Murinzi We, Vuz", { exact: false }).first()).toBeVisible({ timeout: 45000 });
});

test("search expands in the popup without adding a search URL", async ({ page }) => {
  await page.goto("/about");
  await page.locator("header input").first().fill("a");
  const search = page.getByRole("dialog", { name: "Search hymns" });
  await expect(search).toBeVisible();
  await expect(search.locator("button[data-selected]")).toHaveCount(8);
  await search.getByRole("button", { name: /View all \d+ results/ }).click();
  await expect.poll(() => search.locator("button[data-selected]").count()).toBeGreaterThan(8);
  await expect(page).toHaveURL(/\/about$/);
  await search.getByRole("textbox").fill("56");
  await search.getByRole("button", { name: /^56 / }).click();
  await expect(page).toHaveURL(/\/hymns\/[^?]+$/);
  await page.goto("/search?q=56");
  await expect(page).toHaveURL(/\/hymns$/);
});

test("audio skip controls change recordings while keeping the reader open", async ({ page }) => {
  // Exercise the real player controls without streaming audio during the test.
  await page.addInitScript(() => {
    class TestAudio extends EventTarget {
      constructor(src) { super(); this.src = src; this.currentTime = 0; this.duration = 180; queueMicrotask(() => this.dispatchEvent(new Event("loadedmetadata"))); }
      play() { return Promise.resolve(); }
      pause() {}
      load() {}
      removeAttribute(name) { if (name === "src") this.src = ""; }
    }
    window.Audio = TestAudio;
  });
  await page.goto("/hymns");
  await page.locator('main a[href^="/hymns/"]').first().click();
  await page.getByRole("button", { name: "Play audio", exact: true }).click();
  const player = page.getByRole("region", { name: "Audio player" });
  await expect(player.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  const firstTitle = await player.locator("p").first().innerText();
  const readerUrl = page.url();
  await expect(player.getByRole("button", { name: "Previous hymn", exact: true })).toBeDisabled();
  await player.getByRole("button", { name: "Next hymn", exact: true }).click();
  await expect(player.locator("p").first()).not.toHaveText(firstTitle);
  await expect(player.getByRole("slider", { name: "Seek" })).toHaveValue("0");
  await player.getByRole("button", { name: "Previous hymn", exact: true }).click();
  await expect(player.locator("p").first()).toHaveText(firstTitle);
  await expect(page).toHaveURL(readerUrl);
});
