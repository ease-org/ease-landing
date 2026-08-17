import { test, expect, type Page } from "@playwright/test";

/**
 * Trial distribution pages (/trial/ gate and /trial/app/ web app).
 *
 * Both pages talk to the ease-trial Supabase project (NOT the main one the
 * supabase-mock helper covers), so this spec installs its own route mocks:
 * the validate RPC answers true only for VALID_KEY, and every event insert
 * is captured for assertions. No real network requests leave the test.
 */

const VALID_KEY = "EASE-TEST-VAL1";
const WRONG_KEY = "EASE-TEST-WRNG";
const KEYNAME = "ease_trial_key";

type TrialEvent = { trial_key: string; platform: string; kind: string; payload: unknown };

async function mockTrialDb(page: Page, events: TrialEvent[]) {
  await page.route("**/rest/v1/rpc/validate_trial_key**", async (route) => {
    const body = route.request().postDataJSON() as { k?: string } | null;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body?.k === VALID_KEY),
    });
  });
  await page.route("**/rest/v1/trial_events**", async (route) => {
    events.push(route.request().postDataJSON() as TrialEvent);
    await route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
  });
}

test.describe("Trial gate (/trial/)", () => {
  let events: TrialEvent[];

  test.beforeEach(async ({ page }) => {
    events = [];
    await mockTrialDb(page, events);
  });

  test("rejects a too-short key client-side, without any network call", async ({ page }) => {
    await page.goto("/trial/");
    await page.locator("#key").fill("EASE");
    await page.locator("#go").click();
    await expect(page.locator("#msg")).toContainText("too short");
    await expect(page.locator("#unlocked")).toBeHidden();
    expect(events).toHaveLength(0);
  });

  test("rejects an unknown key with a clear message", async ({ page }) => {
    await page.goto("/trial/");
    await page.locator("#key").fill(WRONG_KEY);
    await page.locator("#go").click();
    await expect(page.locator("#msg")).toContainText("not recognized");
    await expect(page.locator("#unlocked")).toBeHidden();
  });

  test("a valid key unlocks the downloads and logs gate_unlock", async ({ page }) => {
    await page.goto("/trial/");
    await page.locator("#key").fill(VALID_KEY);
    await page.locator("#go").click();
    await expect(page.locator("#unlocked")).toBeVisible();
    await expect(page.locator("#apk")).toHaveAttribute("href", "/trial/dusk-android.apk");
    await expect(page.locator("#webapp")).toHaveAttribute("href", "/trial/app/");
    await expect.poll(() => events.map((e) => e.kind)).toContain("gate_unlock");
    const unlock = events.find((e) => e.kind === "gate_unlock");
    expect(unlock?.trial_key).toBe(VALID_KEY);
    expect(unlock?.platform).toBe("web");
  });
});

test.describe("Trial web app (/trial/app/)", () => {
  let events: TrialEvent[];

  test.beforeEach(async ({ page }) => {
    events = [];
    await mockTrialDb(page, events);
  });

  test("shows the key gate when no key is stored", async ({ page }) => {
    await page.goto("/trial/app/");
    await expect(page.locator("#gate")).toBeVisible();
    await expect(page.locator("#s-today")).toBeHidden();
  });

  test("with a stored key: tabs navigate and the outcome flow records an event", async ({ page }) => {
    await page.addInitScript(
      ([name, key]) => localStorage.setItem(name, key),
      [KEYNAME, VALID_KEY],
    );
    await page.goto("/trial/app/");

    // Gate skipped, Today visible.
    await expect(page.locator("#gate")).toBeHidden();
    await expect(page.locator("#s-today h1")).toHaveText("Quiet so far.");

    // Tab navigation.
    await page.locator("nav div", { hasText: "Timeline" }).click();
    await expect(page.locator("#s-timeline h1")).toBeVisible();
    await page.locator("nav div", { hasText: "Report" }).click();
    await expect(page.locator("#s-report h1")).toBeVisible();
    await page.locator("nav div", { hasText: "Research" }).click();
    await expect(page.locator("#s-research h1")).toBeVisible();
    await page.locator("nav div", { hasText: "Today" }).click();

    // FAB -> sheet -> three-tap outcome flow.
    await page.locator("#fab").click();
    await expect(page.locator("#sheet")).toBeVisible();
    await page.locator("#sheet .tap", { hasText: "Record outcome now" }).click();
    await expect(page.locator("#outcome .q")).toHaveText("Did you take it?");
    await page.locator("#outcome .opt", { hasText: "Taken · 14:32" }).click();
    await page.locator("#outcome .opt", { hasText: "Pain-free" }).click();
    await page.locator("#outcome .opt", { hasText: "Could work" }).click();
    await expect(page.locator("#outcome")).toBeHidden();
    await expect(page.locator("#toast")).toContainText("Outcome №10 recorded");

    const outcome = events.find((e) => e.kind === "outcome");
    expect(outcome?.trial_key).toBe(VALID_KEY);
    expect((outcome?.payload as { summary?: string })?.summary).toBe("pain-free, functional");
  });

  test("research passive-sources toggle stays gated behind enrollment", async ({ page }) => {
    await page.addInitScript(
      ([name, key]) => localStorage.setItem(name, key),
      [KEYNAME, VALID_KEY],
    );
    await page.goto("/trial/app/");
    await page.locator("nav div", { hasText: "Research" }).click();
    await expect(page.locator("#passive")).toBeDisabled();
    await page.locator("#enroll").click();
    await expect(page.locator("#passive")).toBeEnabled();
    await page.locator("#enroll").click();
    await expect(page.locator("#passive")).toBeDisabled();
    await expect(page.locator("#passive")).not.toBeChecked();
  });

  test("low-stim entry logs an attack event and exits cleanly", async ({ page }) => {
    await page.addInitScript(
      ([name, key]) => localStorage.setItem(name, key),
      [KEYNAME, VALID_KEY],
    );
    await page.goto("/trial/app/");
    await page.locator(".lowstim-chip").click();
    await expect(page.locator("#lowstim")).toBeVisible();
    await expect.poll(() => events.map((e) => e.kind)).toContain("attack");
    await page.locator(".ls-link").click();
    await expect(page.locator("#lowstim")).toBeHidden();
  });

  test("a past-due pending check-in reopens the outcome flow after reload", async ({ page }) => {
    await page.addInitScript(
      ([name, key]) => {
        localStorage.setItem(name, key);
        localStorage.setItem("ease_pending_checkin", String(Date.now() - 1000));
      },
      [KEYNAME, VALID_KEY],
    );
    await page.goto("/trial/app/");
    await expect(page.locator("#outcome")).toBeVisible();
    await expect(page.locator("#outcome .q")).toHaveText("Did you take it?");
  });
});
