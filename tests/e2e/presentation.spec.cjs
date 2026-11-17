const { test, expect } = require("@playwright/test");

test("phones and tablets do not offer presentation, including tablets with a mouse", async ({ browser, baseURL }) => {
  for (const device of [
    { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile", viewport: { width: 390, height: 844 }, hasTouch: true },
    { userAgent: "Mozilla/5.0 (Linux; Android 15; Tablet) AppleWebKit/537.36 Chrome/140.0 Safari/537.36", viewport: { width: 1366, height: 1024 }, hasTouch: false },
    { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Safari/605.1.15", viewport: { width: 1366, height: 1024 }, hasTouch: true, ipad: true },
  ]) {
    const { ipad, ...options } = device;
    const context = await browser.newContext({ ...options, baseURL });
    if (ipad) await context.addInitScript(() => {
      Object.defineProperty(navigator, "platform", { get: () => "MacIntel" });
      Object.defineProperty(navigator, "maxTouchPoints", { get: () => 5 });
    });
    const page = await context.newPage();
    await page.goto("/hymns/001");
    await expect(page.getByRole("button", { name: "Share", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Present", exact: true })).toHaveCount(0);
    await context.close();
  }
});

test("presenter fits the browser height with slide navigation beside the preview", async ({ page }) => {
  await page.addInitScript(() => { window.open = () => null; });
  await page.goto("/hymns/001");
  await page.getByRole("button", { name: "Present", exact: true }).click();
  const presenter = page.getByRole("dialog", { name: "Presenter view" });
  for (const size of [{ width: 1920, height: 1080 }, { width: 1024, height: 616 }, { width: 800, height: 450 }, { width: 390, height: 700 }]) {
    await page.setViewportSize(size);
    await expect.poll(() => presenter.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
    for (const control of [presenter.getByRole("region", { name: "Current preview" }), presenter.getByRole("region", { name: "Next preview" }), presenter.getByRole("button", { name: "End presentation", exact: true }), presenter.getByRole("button", { name: "Next slide", exact: true }), presenter.getByRole("navigation", { name: "Presentation slides" })]) {
      const bounds = await control.boundingBox();
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(size.height + 1);
    }
    if (size.width >= 640) {
      const current = await presenter.getByRole("region", { name: "Current preview" }).boundingBox();
      const next = await presenter.getByRole("region", { name: "Next preview" }).boundingBox();
      expect(next.x).toBeGreaterThanOrEqual(current.x + current.width);
    }
  }
});

test("presenter preview synchronizes a separate audience window and cleans up", async ({ page }) => {
  await page.goto("/hymns/001");
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Present", exact: true }).click();
  const audience = await popup;
  const presenter = page.getByRole("dialog", { name: "Presenter view" });
  await expect(presenter).toBeVisible();
  const audienceSlide = audience.getByRole("img").first();
  await expect(audienceSlide).toBeVisible();
  const first = await audienceSlide.getAttribute("aria-label");
  await presenter.getByRole("button", { name: "Next slide", exact: true }).click();
  await expect(audienceSlide).not.toHaveAttribute("aria-label", first);
  const current = await audienceSlide.getAttribute("aria-label");
  await expect(presenter.getByRole("region", { name: "Current preview" }).getByRole("img")).toHaveAttribute("aria-label", current);
  await presenter.getByRole("button", { name: "Blank audience screen", exact: true }).click();
  await expect(audienceSlide).toHaveAttribute("aria-label", "Blank audience screen");
  await presenter.getByRole("button", { name: "Show audience slide", exact: true }).click();
  await expect(audienceSlide).toHaveAttribute("aria-label", current);
  await audience.close();
  await expect(presenter.getByRole("button", { name: "Open audience window", exact: true })).toBeVisible();
  const reopened = page.waitForEvent("popup");
  await presenter.getByRole("button", { name: "Open audience window", exact: true }).click();
  const second = await reopened;
  await expect(second.getByRole("img").first()).toHaveAttribute("aria-label", current);
  await presenter.getByRole("button", { name: "End presentation", exact: true }).click();
  await expect(presenter).toHaveCount(0);
  await expect.poll(() => second.isClosed()).toBe(true);
});

test("blocked audience popups keep the local preview and explain how to retry", async ({ page }) => {
  await page.addInitScript(() => { window.open = () => null; });
  await page.goto("/hymns/001");
  await page.getByRole("button", { name: "Present", exact: true }).click();
  const presenter = page.getByRole("dialog", { name: "Presenter view" });
  await expect(presenter).toBeVisible();
  await expect(presenter.getByRole("button", { name: "Open audience window" })).toBeVisible();
  await presenter.getByRole("button", { name: "Open audience window" }).click();
  await expect(presenter.getByRole("status")).toContainText("blocked");
  const preview = presenter.getByRole("region", { name: "Current preview" }).getByRole("img");
  const first = await preview.getAttribute("aria-label");
  await page.keyboard.press("ArrowRight");
  await expect(preview).not.toHaveAttribute("aria-label", first);
});

test("an external display is selected and requested in fullscreen while the presenter stays local", async ({ page }) => {
  await page.addInitScript(() => {
    const builtIn = { left: 0, top: 0, width: 1920, height: 1080, availLeft: 0, availTop: 0, availWidth: 1920, availHeight: 1040, isInternal: true, label: "Laptop" };
    const projector = { left: 1920, top: 0, width: 1920, height: 1080, availLeft: 1920, availTop: 0, availWidth: 1920, availHeight: 1080, isInternal: false, label: "Projector" };
    window.getScreenDetails = async () => Object.assign(new EventTarget(), { screens: [builtIn, projector], currentScreen: builtIn });
    window.projectionCalls = [];
    const open = window.open.bind(window);
    window.open = (...args) => {
      const output = open(...args);
      if (!output) return output;
      output.moveTo = (left, top) => window.projectionCalls.push(["move", left, top]);
      output.resizeTo = (width, height) => window.projectionCalls.push(["resize", width, height]);
      output.document.documentElement.requestFullscreen = async (options) => {
        window.projectionCalls.push(["fullscreen", options.screen?.label]);
        Object.defineProperty(output.document, "fullscreenElement", { configurable: true, value: output.document.documentElement });
        output.document.dispatchEvent(new Event("fullscreenchange"));
      };
      return output;
    };
  });
  await page.goto("/hymns/001");
  const opened = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Present", exact: true }).click();
  const audience = await opened;
  const presenter = page.getByRole("dialog", { name: "Presenter view" });
  await expect(presenter.getByRole("status")).toContainText("Projecting on Projector");
  expect(await page.evaluate(() => window.projectionCalls)).toContainEqual(["move", 1920, 0]);
  expect(await page.evaluate(() => window.projectionCalls)).toContainEqual(["fullscreen", "Projector"]);
  expect(await page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  await expect(audience.getByRole("button", { name: "Enter fullscreen" })).toHaveCount(0);
  await presenter.getByRole("button", { name: "End presentation" }).click();
});
