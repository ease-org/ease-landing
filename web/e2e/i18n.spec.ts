import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { installSupabaseMock } from "./support/supabase-mock";

/**
 * Localization (en `/`, fi `/fi/`).
 *
 * Locale routing is URL-prefixed: `/` serves English, `/fi/` serves Finnish.
 * The Accept-Language / cookie redirect happens in Vercel's routing layer
 * (vercel.json), which `astro preview` does not emulate — so the redirect
 * RULES are asserted against vercel.json directly, and everything the static
 * build controls (copy, <html lang>, canonical, hreflang, switcher, cookie)
 * is asserted in the browser.
 */

const SITE = "https://ease-health.org";

async function expectHreflangSet(page: Page) {
  const en = page.locator('head link[rel="alternate"][hreflang="en"]');
  const fi = page.locator('head link[rel="alternate"][hreflang="fi"]');
  const xd = page.locator('head link[rel="alternate"][hreflang="x-default"]');
  await expect(en).toHaveAttribute("href", `${SITE}/`);
  await expect(fi).toHaveAttribute("href", `${SITE}/fi/`);
  await expect(xd).toHaveAttribute("href", `${SITE}/`);
}

test.describe("Finnish landing page (/fi/)", () => {
  test.beforeEach(async ({ page }) => {
    await installSupabaseMock(page);
  });

  test("loads with the Finnish hero headline and subcopy", async ({ page }) => {
    await page.goto("/fi/");

    await expect(page).toHaveTitle(/Ease/i);
    await expect(page.locator("html")).toHaveAttribute("lang", "fi");

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Migreenisi hoito");
    await expect(h1).toContainText("Yksi selkeä historia");
    await expect(page.locator("h1")).toHaveCount(1);

    // Subcopy stays descriptive (record/collect language — no outcome claims).
    await expect(
      page.getByText(/Kirjaa lääkärin ohjaamat lääkekokeilut/i),
    ).toBeVisible();
  });

  test("has Finnish metadata, canonical, and hreflang alternates", async ({ page }) => {
    await page.goto("/fi/");

    const desc = page.locator('head meta[name="description"]');
    await expect(desc).toHaveCount(1);
    await expect(desc).toHaveAttribute("content", /migreeni/i);

    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE}/fi/`,
    );
    await expectHreflangSet(page);
  });

  test("feature cards use the established Finnish terminology", async ({ page }) => {
    await page.goto("/fi/#features");
    await expect(
      page.getByRole("heading", { name: "Hoitokokeilut" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Vastaanottoyhteenvedot" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Yksityisyys edellä" }),
    ).toBeVisible();
  });

  test("roadmap renders all four phases in Finnish", async ({ page }) => {
    await page.goto("/fi/#roadmap");
    const phaseTitles = page.locator(".rm-title");
    await expect(phaseTitles).toHaveCount(4);
    await expect(phaseTitles.nth(0)).toHaveText("Hoitohistoria");
    await expect(phaseTitles.nth(1)).toHaveText("Työnkulun validointi");
    await expect(phaseTitles.nth(2)).toHaveText("Varjotutkimus");
    await expect(phaseTitles.nth(3)).toHaveText("Säännelty tuote, jos näyttö riittää");
    // The regulatory guardrail line must survive translation.
    await expect(
      page.getByText("Ei ennusteita eikä hoitosuosituksia käyttäjille"),
    ).toBeVisible();
  });

  test("signup form and OAuth islands hydrate in Finnish", async ({ page }) => {
    await page.goto("/fi/");
    await expect(page.getByPlaceholder("sinun@sahkoposti.fi")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Liity betaan" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Kirjaudu Googlella/i }),
    ).toBeVisible();
    // Nav CTA (logged out) is the Finnish "Liity betaan" link.
    await expect(
      page.getByRole("link", { name: "Liity betaan" }),
    ).toHaveAttribute("href", "#beta");
  });
});

test.describe("Language switcher", () => {
  test.beforeEach(async ({ page }) => {
    await installSupabaseMock(page);
  });

  test("switching EN → FI navigates to /fi/ and remembers the choice", async ({ page, context }) => {
    await page.goto("/");
    // force: the fixed translucent nav can intercept synthetic taps on
    // mobile viewports (same workaround as home.spec's CTA test) — we are
    // testing navigation + cookie persistence, not pointer hit-testing.
    await page.locator('.lang-switch a[data-lang="fi"]').click({ force: true });
    await expect(page).toHaveURL(/\/fi\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "fi");

    const cookie = (await context.cookies()).find((c) => c.name === "ease-lang");
    expect(cookie?.value).toBe("fi");
  });

  test("switching FI → EN navigates back to / and updates the cookie", async ({ page, context }) => {
    await page.goto("/fi/");
    await page.locator('.lang-switch a[data-lang="en"]').click({ force: true });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    const cookie = (await context.cookies()).find((c) => c.name === "ease-lang");
    expect(cookie?.value).toBe("en");
  });

  test("the switcher is visible on the English page too", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('.lang-switch a[data-lang="fi"]')).toBeVisible();
    await expectHreflangSet(page);
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE}/`,
    );
  });
});

test.describe("Finnish trial gate (/fi/trial/)", () => {
  const VALID_KEY = "EASE-TEST-VAL1";

  test.beforeEach(async ({ page }) => {
    await page.route("**/rest/v1/rpc/validate_trial_key**", async (route) => {
      const body = route.request().postDataJSON() as { k?: string } | null;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body?.k === VALID_KEY),
      });
    });
    await page.route("**/rest/v1/trial_events**", async (route) => {
      await route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
    });
  });

  test("renders the gate in Finnish", async ({ page }) => {
    await page.goto("/fi/trial/");
    await expect(page.locator("html")).toHaveAttribute("lang", "fi");
    await expect(page.locator("#gate h1")).toHaveText("Syötä kokeiluavaimesi.");
    await expect(page.locator("#go")).toHaveText("Avaa");
  });

  test("rejects a too-short key with a Finnish message, client-side", async ({ page }) => {
    await page.goto("/fi/trial/");
    await page.locator("#key").fill("EASE");
    await page.locator("#go").click();
    await expect(page.locator("#msg")).toContainText("liian lyhyeltä");
    await expect(page.locator("#unlocked")).toBeHidden();
  });

  test("a valid key unlocks the Finnish download instructions", async ({ page }) => {
    await page.goto("/fi/trial/");
    await page.locator("#key").fill(VALID_KEY);
    await page.locator("#go").click();
    await expect(page.locator("#unlocked")).toBeVisible();
    await expect(page.locator("#unlocked h1")).toHaveText("Olet sisällä.");
    // Downloads point at the SAME shared assets as the English gate.
    await expect(page.locator("#apk")).toHaveAttribute("href", "/trial/dusk-android.apk");
    await expect(page.locator("#webapp")).toHaveAttribute("href", "/trial/app/");
  });

  test("the two gates cross-link each other", async ({ page }) => {
    await page.goto("/trial/");
    await expect(page.locator('a[data-lang="fi"]')).toHaveAttribute("href", "/fi/trial/");
    await page.goto("/fi/trial/");
    await expect(page.locator('a[data-lang="en"]')).toHaveAttribute("href", "/trial/");
  });
});

test.describe("Locale redirect rules (vercel.json)", () => {
  /**
   * `astro preview` cannot exercise Vercel's routing layer, so pin the
   * redirect configuration itself: an explicit cookie choice wins, and the
   * Accept-Language redirect only fires for first-time visitors (no cookie)
   * whose FIRST language preference is Finnish — on `/` only, as a temporary
   * (307, uncached) redirect so the edge cache never varies per-URL content.
   */
  test("vercel.json contains the cookie and accept-language redirects for /", () => {
    const raw = readFileSync(
      fileURLToPath(new URL("../vercel.json", import.meta.url)),
      "utf-8",
    );
    const cfg = JSON.parse(raw) as {
      redirects: Array<{
        source: string;
        destination: string;
        statusCode?: number;
        has?: Array<{ type: string; key: string; value?: string }>;
        missing?: Array<{ type: string; key: string }>;
      }>;
    };

    const cookieRule = cfg.redirects.find(
      (r) => r.source === "/" && r.has?.some((h) => h.type === "cookie" && h.key === "ease-lang"),
    );
    expect(cookieRule).toBeDefined();
    expect(cookieRule?.destination).toBe("/fi/");
    expect(cookieRule?.statusCode).toBe(307);
    expect(cookieRule?.has?.find((h) => h.type === "cookie")?.value).toBe("fi");

    const alRule = cfg.redirects.find(
      (r) => r.source === "/" && r.has?.some((h) => h.type === "header" && h.key === "accept-language"),
    );
    expect(alRule).toBeDefined();
    expect(alRule?.destination).toBe("/fi/");
    expect(alRule?.statusCode).toBe(307);
    // Only fires when no explicit choice has been stored.
    expect(alRule?.missing?.some((m) => m.type === "cookie" && m.key === "ease-lang")).toBe(true);
    // Anchored: Finnish must be the first Accept-Language preference.
    expect(alRule?.has?.find((h) => h.type === "header")?.value).toMatch(/\^fi/);
  });
});
