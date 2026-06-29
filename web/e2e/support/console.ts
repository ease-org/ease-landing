import type { Page, ConsoleMessage } from "@playwright/test";

/**
 * Collects browser console errors and page errors (uncaught exceptions)
 * during a test so we can assert "no console errors on load".
 *
 * Returns a live array; read it after the navigation/interaction settles.
 * Known-benign noise (e.g. favicon 404s, font preconnect) is filtered so
 * the assertion stays meaningful rather than perpetually red.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];

  const benign = [
    /favicon/i,
    /fonts\.googleapis\.com/i,
    /fonts\.gstatic\.com/i,
    // Supabase client may log benign auth-missing info in some flows
    /AuthSessionMissingError/i,
  ];

  const isBenign = (text: string) => benign.some((re) => re.test(text));

  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error" && !isBenign(msg.text())) {
      errors.push(`console.error: ${msg.text()}`);
    }
  });

  page.on("pageerror", (err: Error) => {
    if (!isBenign(err.message)) {
      errors.push(`pageerror: ${err.message}`);
    }
  });

  return errors;
}
