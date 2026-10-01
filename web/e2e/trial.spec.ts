import { test, expect, type Page } from "@playwright/test";

/**
 * Trial distribution page (/trial/ gate).
 *
 * The page talks to the ease-trial Supabase project (NOT the main one the
 * supabase-mock helper covers), so this spec installs its own route mocks:
 * the validate RPC answers true only for VALID_KEY, and every event insert
 * is captured for assertions. No real network requests leave the test.
 *
 * The APK itself is not part of this build. It sits in a private bucket and is
 * reached through /trial/download, a serverless function that re-checks the key
 * server-side; `astro preview` serves only the static output, so these tests
 * cover the link the page builds, and that no APK is sitting in public/.
 *
 * The iPhone app is ease-web, a separate private Vercel project that this site
 * proxies at /app/ (rewrite in vercel.json). `astro preview` does not apply
 * vercel.json, so the tests cover the hand-off link and that the old static
 * demo under /trial/app/ is no longer part of the build.
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
    await expect(page.locator("#apk")).toHaveAttribute("href", `/trial/download?k=${VALID_KEY}`);
    await expect(page.locator("#webapp")).toHaveAttribute("href", `/app/?k=${VALID_KEY}`);
    await expect.poll(() => events.map((e) => e.kind)).toContain("gate_unlock");
    const unlock = events.find((e) => e.kind === "gate_unlock");
    expect(unlock?.trial_key).toBe(VALID_KEY);
    expect(unlock?.platform).toBe("web");
  });

  test("the APK is not a static asset of the site", async ({ page }) => {
    const response = await page.request.get("/trial/ease-android.apk");
    expect(response.status()).toBe(404);
  });

  test("the old static iPhone demo is gone from the build", async ({ page }) => {
    const response = await page.request.get("/trial/app/index.html");
    expect(response.status()).toBe(404);
  });
});
