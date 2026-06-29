import { test, expect } from "@playwright/test";
import { installSupabaseMock } from "./support/supabase-mock";

test.describe("Roadmap section", () => {
  test.beforeEach(async ({ page }) => {
    await installSupabaseMock(page);
    await page.goto("/#roadmap");
  });

  test("renders the section heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /private beta/i, level: 2 }),
    ).toBeVisible();
  });

  test("renders all four phases in order", async ({ page }) => {
    const phaseTitles = page.locator(".rm-title");
    await expect(phaseTitles).toHaveCount(4);
    await expect(phaseTitles.nth(0)).toHaveText("Private Beta");
    await expect(phaseTitles.nth(1)).toHaveText("Predictive Intelligence");
    await expect(phaseTitles.nth(2)).toHaveText("Clinical Validation");
    await expect(phaseTitles.nth(3)).toContainText("Class II SaMD");
  });

  test("each phase shows its status badge", async ({ page }) => {
    await expect(page.getByText("Now", { exact: true })).toBeVisible();
    await expect(page.getByText("In development", { exact: true })).toBeVisible();
    await expect(page.getByText("Planned", { exact: true })).toBeVisible();
    await expect(page.getByText("Target", { exact: true })).toBeVisible();
  });

  test("phase content mentions key roadmap milestones", async ({ page }) => {
    // Phase 2 — Bayesian model; Phase 4 — FDA 510(k).
    await expect(
      page.getByText(/Bayesian hierarchical model/i),
    ).toBeVisible();
    await expect(
      page.getByText(/510\(k\) substantial equivalence submission/i),
    ).toBeVisible();
  });
});
