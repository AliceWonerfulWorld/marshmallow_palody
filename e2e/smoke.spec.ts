import { readFileSync, readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Keyless production-server checks, not an authenticated external-service E2E.
for (const width of [320, 375, 390, 430, 1440]) {
  test(`${width}px: public routes, protected routes, 404 and layout`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/*", route => {
      return new URL(route.request().url()).origin === "http://127.0.0.1:3100" ? route.continue() : route.abort();
    });
    for (const path of ["/", "/sign-in", "/sign-up", "/u/missing", "/inbox", "/settings"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      if (path === "/") {
        await expect(page.getByRole("heading", { level: 1 })).toHaveText("匿名で送れて、みんなで見られる質問箱");
        const create = page.getByRole("link", { name: "質問箱を作る" });
        expect((await create.boundingBox())?.height).toBeGreaterThanOrEqual(44);
        await create.focus();
        expect(await create.evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe("none");
      } else if (path === "/u/missing") {
        await expect(page.getByRole("main").getByRole("alert")).toHaveText("現在この質問箱を利用できません。");
      } else if (path === "/inbox" || path === "/settings") {
        await expect(page).toHaveURL(/\/sign-in$/);
        await expect(page.getByText("現在ログインを利用できません。")).toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    const response = await page.goto("/definitely-not-a-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
  });
}

// Actual React component markup with local test doubles, styled with the exact
// production CSS. This verifies layout, not real Clerk/Convex transport.
for (const width of [320, 375, 390, 430, 1440]) {
  test(`${width}px: filled public / QR / inbox / settings and states`, async ({ page }, testInfo) => {
    const fixtures: Record<string, string> = JSON.parse(readFileSync("test-results/layout-fixtures.json", "utf8"));
    const css = readdirSync(".next/static/css").filter(name => name.endsWith(".css")).map(name => readFileSync(`.next/static/css/${name}`, "utf8")).join("\n");
    await page.setViewportSize({ width, height: 900 });
    for (const [name, html] of Object.entries(fixtures)) {
      await page.setContent(`<html lang="ja"><head><style>${css}</style></head><body>${html}</body></html>`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      for (const textarea of await page.locator("textarea").all()) {
        expect(await textarea.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
        const box = await textarea.boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      }
      for (const button of await page.getByRole("button").all()) {
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      if ((width === 375 || width === 1440) && ["public", "inbox", "settings"].includes(name)) {
        await page.screenshot({ path: testInfo.outputPath(`${name}-${width}.png`), fullPage: true });
      }
    }
  });
}
