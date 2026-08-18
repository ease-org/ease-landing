import { test, expect } from "@playwright/test";
import { installSupabaseMock } from "./support/supabase-mock";

test.describe("Roadmap section", () => {
  test.beforeEach(async ({ page }) => {
    await installSupabaseMock(page);
    await page.goto("/#roadmap");
  });

  test("renders the section heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /better-informed appointments/i, level: 2 }),
    ).toBeVisible();
  });

  test("renders all four phases in order", async ({ page }) => {
    const phaseTitles = page.locator(".rm-title");
    await expect(phaseTitles).toHaveCount(4);
    await expect(phaseTitles.nth(0)).toHaveText("Treatment History");
    await expect(phaseTitles.nth(1)).toHaveText("Workflow Validation");
    await expect(phaseTitles.nth(2)).toHaveText("Shadow Research");
    await expect(phaseTitles.nth(3)).toHaveText("Regulated Product, If Validated");
  });

  test("each phase shows its status badge", async ({ page }) => {
    await expect(page.getByText("Now", { exact: true })).toBeVisible();
    await expect(page.getByText("In development", { exact: true })).toBeVisible();
    await expect(page.getByText("Planned", { exact: true })).toBeVisible();
    await expect(page.getByText("Target", { exact: true })).toBeVisible();
  });

  test("phase content mentions key roadmap milestones", async ({ page }) => {
    // Phase 2 validates the workflow; Phase 4 remains gated on evidence.
    await expect(
      page.getByText(/clinician review of the report format/i),
    ).toBeVisible();
    await expect(
      page.getByText(/regulatory submission only after evidence gates/i),
    ).toBeVisible();
  });
});
