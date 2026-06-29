import { test, expect } from "@playwright/test";
import { installSupabaseMock } from "./support/supabase-mock";
import { collectConsoleErrors } from "./support/console";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await installSupabaseMock(page);
  });

  test("in-page anchor links scroll to their sections", async ({ page }) => {
    await page.goto("/");

    // The full nav links are hidden under 600px (mobile), so only assert
    // anchor navigation where the nav links are actually rendered.
    const featuresLink = page.locator('header.nav nav a[href="#features"]');
    if (await featuresLink.isVisible()) {
      await featuresLink.click();
      await expect(page).toHaveURL(/#features$/);
      await expect(
        page.getByRole("heading", { name: "Continuous Monitoring" }),
      ).toBeInViewport();
    } else {
      // Mobile layout: links collapsed. Drive the anchor directly.
      await page.goto("/#roadmap");
      await expect(
        page.getByRole("heading", { name: "Private Beta", level: 2 }),
      ).toBeInViewport();
    }
  });

  test("footer legal links point at /privacy and /terms", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /privacy policy/i }),
    ).toHaveAttribute("href", "/privacy");
    await expect(
      page.getByRole("link", { name: /terms of use/i }),
    ).toHaveAttribute("href", "/terms");
  });

  test("can navigate to the profile page directly", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/profile");
    await expect(page).toHaveTitle(/Profile/i);
    // Wait for the Svelte island to resolve its (mocked) logged-out state.
    await page.waitForTimeout(500);
    expect(errors, errors.join("\n")).toEqual([]);
  });
});

test.describe("User profile page (logged-out)", () => {
  test.beforeEach(async ({ page }) => {
    await installSupabaseMock(page);
    await page.goto("/profile");
  });

  test("prompts the visitor to log in when no session exists", async ({ page }) => {
    // UserProfile shows the login gate until a session is present.
    await expect(
      page.getByRole("heading", { name: /please log in/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /log in/i }),
    ).toBeVisible();
  });

  test("does not leak an authenticated profile card to anonymous users", async ({ page }) => {
    // Account Details / Roles only render with a session — confirm absence.
    await expect(page.getByText(/account details/i)).toHaveCount(0);
    await expect(page.getByText("Roles:", { exact: false })).toHaveCount(0);
  });
});
