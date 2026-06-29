import { test, expect } from "@playwright/test";
import { installSupabaseMock } from "./support/supabase-mock";
import { collectConsoleErrors } from "./support/console";

/**
 * Basic a11y + responsive smoke. These specs run under BOTH configured
 * projects (chromium-desktop and chromium-mobile/Pixel 5), so the same
 * assertions cover desktop and mobile viewports without duplication.
 */
test.describe("Responsive + a11y smoke", () => {
  test.beforeEach(async ({ page }) => {
    await installSupabaseMock(page);
  });

  test("renders the hero at the current viewport with one h1", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // The body clamps horizontal overflow (overflow-x: hidden), so the user
    // cannot scroll content sideways even though decorative orbs/halo spill.
    await expect(page.locator("body")).toHaveCSS("overflow-x", "hidden");

    // The hero copy itself fits within the visible viewport (no content
    // that the reader actually needs is pushed off-screen horizontally).
    const vw = page.viewportSize()?.width ?? 0;
    const box = await page.getByRole("heading", { level: 1 }).boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(-2);
      expect(box.x + box.width).toBeLessThanOrEqual(vw + 2);
    }
  });

  test("page has a language and a meta description", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    const desc = page.locator('head meta[name="description"]');
    await expect(desc).toHaveCount(1);
    await expect(desc).toHaveAttribute("content", /migraine|trigger/i);
  });

  test("the primary CTA stays reachable on this viewport", async ({ page }) => {
    await page.goto("/");
    // The nav "Join Beta" CTA is shown at every breakpoint (it is exempt
    // from the mobile link-collapse rule), so it must always be visible.
    await expect(
      page.getByRole("link", { name: /join beta/i }),
    ).toBeVisible();
  });

  test("loads cleanly without console errors at this viewport", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    expect(errors, errors.join("\n")).toEqual([]);
  });
});
