import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright e2e configuration for the Ease landing site.
 *
 * The site is a static Astro build. We build it once and serve the real
 * production output via `astro preview`, so tests run against the exact
 * artifact that ships to Vercel — not the dev server.
 *
 * The preview port is pinned (4321 is Astro's default) and the same value
 * is reused as the baseURL so `page.goto("/")` resolves correctly both
 * locally and in CI.
 */
const PORT = Number(process.env.PREVIEW_PORT ?? 4321);
const HOST = "127.0.0.1";
const baseURL = `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  /* Fail the build on CI if test.only is left in the source. */
  forbidOnly: !!process.env.CI,
  /* Retry once on CI to absorb flake from animation/network timing. */
  retries: process.env.CI ? 1 : 0,
  /* One worker on CI keeps the single preview server unconfused. */
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { open: "never" }],
    ["list"],
  ],
  timeout: 30_000,
  expect: { timeout: 7_500 },

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],

  /**
   * Build the static site and serve it with `astro preview`.
   * reuseExistingServer lets a developer keep a preview running locally;
   * CI always starts fresh.
   */
  webServer: {
    command: `npm run build && npm run preview -- --host ${HOST} --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
