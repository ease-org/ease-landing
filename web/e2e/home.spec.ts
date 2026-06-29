import { test, expect } from "@playwright/test";
import { installSupabaseMock } from "./support/supabase-mock";
import { collectConsoleErrors } from "./support/console";

test.describe("Home page (index.astro)", () => {
  test.beforeEach(async ({ page }) => {
    await installSupabaseMock(page);
  });

  test("loads with the hero headline and subcopy", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Ease/i);

    // Hero H1: "Know your triggers. Take back your days."
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Know your");
    await expect(h1).toContainText("triggers"); // rendered inside <em>
    await expect(h1).toContainText("Take back your days");

    // Hero subcopy mentions the product promise.
    await expect(
      page.getByText(/surfaces trigger patterns/i),
    ).toBeVisible();
  });

  test("primary CTA (Join Beta) targets the signup anchor", async ({ page }) => {
    await page.goto("/");

    // NavCta renders "Join Beta" -> #beta when logged out.
    const joinBeta = page.getByRole("link", { name: /join beta/i });
    await expect(joinBeta).toBeVisible();
    await expect(joinBeta).toHaveAttribute("href", "#beta");

    // Activate the CTA. The fixed nav can intercept a synthetic pointer
    // click on small viewports, so dispatch the anchor activation directly
    // — we are testing that the link navigates to the signup region, not
    // pointer-hit-testing of the translucent header.
    await joinBeta.click({ force: true });
    await expect(page).toHaveURL(/#beta$/);

    // The signup region (the email field lives inside #beta) is now in view.
    await expect(
      page.getByPlaceholder("your@email.com"),
    ).toBeInViewport({ timeout: 5000 });
  });

  test("beta signup form and its OAuth options render", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByPlaceholder("your@email.com")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /get early access/i }),
    ).toBeVisible();

    // OAuth buttons hydrate from the Svelte island.
    await expect(
      page.getByRole("button", { name: /sign in with google/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in with github/i }),
    ).toBeVisible();
    // Apple is intentionally disabled ("Coming Soon").
    const apple = page.getByRole("button", { name: /sign in with apple/i });
    await expect(apple).toBeDisabled();
  });

  test("feature cards describe what Ease does", async ({ page }) => {
    await page.goto("/#features");
    await expect(
      page.getByRole("heading", { name: "Continuous Monitoring" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Privacy First" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Personalized Insights" }),
    ).toBeVisible();
  });

  test("loads without unexpected console errors", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/", { waitUntil: "networkidle" });
    // Give Svelte islands a beat to hydrate and run onMount.
    await page.waitForTimeout(500);
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("has exactly one h1 (a11y landmark)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
  });
});
