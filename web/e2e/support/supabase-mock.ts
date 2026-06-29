import type { Page, Route } from "@playwright/test";

/**
 * Network isolation for Supabase.
 *
 * Every page on this site mounts a Supabase client on load (NavCta,
 * BetaSignupForm, UserProfile, BetaWelcome) which immediately hits
 * `/auth/v1/...` and `/rest/v1/...` on the real project URL baked into
 * src/lib/env.ts. In tests we must never touch the real backend, and we
 * want deterministic, offline-friendly behavior.
 *
 * `installSupabaseMock` intercepts ALL Supabase REST/auth traffic and
 * returns canned responses:
 *   - getSession / getUser            -> logged-out (null session/user)
 *   - signInWithOtp (magic link send) -> success, so the form reaches its
 *                                        "sent" state without emailing anyone
 *   - any rest table read/write       -> empty / accepted
 *
 * Tests can override individual routes AFTER calling this (last matching
 * handler wins in Playwright), e.g. to assert the exact OTP request body.
 */
export const SUPABASE_HOST_GLOB = "**/*.supabase.co/**";

export async function installSupabaseMock(page: Page): Promise<void> {
  await page.route(SUPABASE_HOST_GLOB, async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const method = req.method();

    // --- Auth endpoints -------------------------------------------------
    // GET /auth/v1/user -> not logged in
    if (path.endsWith("/auth/v1/user")) {
      return route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "missing session" }),
      });
    }

    // Magic-link / OTP send: POST /auth/v1/otp -> accept, send nothing
    if (path.endsWith("/auth/v1/otp")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    }

    // Token / session refresh -> no session
    if (path.includes("/auth/v1/token")) {
      return route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "invalid_grant" }),
      });
    }

    // PKCE OAuth redirect kick-off: don't actually navigate anywhere.
    if (path.includes("/auth/v1/authorize")) {
      return route.fulfill({ status: 200, contentType: "text/html", body: "<html></html>" });
    }

    // --- REST / Postgrest tables ---------------------------------------
    if (path.includes("/rest/v1/")) {
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        });
      }
      // inserts/upserts (beta_signups) -> accepted
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: "[]",
      });
    }

    // Fallback: anything else Supabase -> empty 200 (never reaches network)
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
}
