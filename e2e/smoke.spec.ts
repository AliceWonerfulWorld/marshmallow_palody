import { readFileSync, readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Keyless production-server checks, not an authenticated external-service E2E.
for (const width of [320, 375, 390, 430, 1440]) {
  test(`${width}px: public routes, protected routes, 404 and layout`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/*", route => {
      return new URL(route.request().url()).origin === "http://127.0.0.1:3100" ? route.continue() : route.abort();
    });
    for (const path of ["/", "/sign-in", "/sign-up", "/u/missing", "/inbox", "/settings", "/boxes", "/boxes/new", "/boxes/invalid/settings", "/boxes/invalid/members", "/invite/invalid"]) {
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
      } else if (path === "/invite/invalid") {
        await expect(page.getByRole("main").getByRole("alert")).toHaveText("現在この招待を利用できません。");
        expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
        expect(response?.headers()["cache-control"]).toContain("no-store");
      } else if (path === "/inbox" || path === "/settings" || path.startsWith("/boxes")) {
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
      if (name === "boxes-new" || name === "boxes-settings") {
        await expect(page.getByLabel("公開モード")).toHaveValue("approval");
      }
      if (name === "inbox") {
        const activeFilter = page.locator('button[aria-pressed="true"]');
        await activeFilter.hover();
        const contrast = await activeFilter.evaluate(async node => {
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
          await Promise.all(node.getAnimations().map(animation => animation.finished));
          const luminance = (color: string) => {
            const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
            return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
          };
          const style = getComputedStyle(node);
          const foreground = luminance(style.color);
          const background = luminance(style.backgroundColor);
          return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
        });
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      }
      if ((width === 375 || width === 1440) && ["public", "inbox", "settings", "boxes", "boxes-new", "boxes-settings", "box-members", "invite"].includes(name)) {
        await page.screenshot({ path: testInfo.outputPath(`${name}-${width}.png`), fullPage: true });
      }
    }
  });
}
