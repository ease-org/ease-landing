import { test, expect } from "@playwright/test";
import { installSupabaseMock } from "./support/supabase-mock";

test.describe("Beta signup / waitlist flow", () => {
  test.beforeEach(async ({ page }) => {
    await installSupabaseMock(page);
    await page.goto("/");
  });

  test("submitting a valid email reaches the 'check your email' state", async ({ page }) => {
    // Capture the OTP request to prove (a) the submit fired and (b) it was
    // intercepted by the mock — no real magic-link email is ever sent.
    let otpBody: any = null;
    await page.route("**/auth/v1/otp**", async (route) => {
      try {
        otpBody = route.request().postDataJSON();
      } catch {
        otpBody = route.request().postData();
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    });

    // Wait for the Svelte island to hydrate: onMount creates the Supabase
    // client, and handleSubmit no-ops until it exists. The OAuth buttons
    // hydrating from the same onMount is a reliable readiness signal.
    await expect(
      page.getByRole("button", { name: /sign in with google/i }),
    ).toBeEnabled();

    const email = page.getByPlaceholder("your@email.com");
    await email.fill("e2e-tester@example.com");
    await page.getByRole("button", { name: /get early access/i }).click();

    // Success ("sent") state copy from BetaSignupForm.
    await expect(
      page.getByText(/check your email for a magic sign-in link/i),
    ).toBeVisible();
    await expect(
      page.getByText(/click the link in your email to complete sign-up/i),
    ).toBeVisible();

    // The request was intercepted and carried our test email — not a real send.
    expect(otpBody).toBeTruthy();
    expect(JSON.stringify(otpBody)).toContain("e2e-tester@example.com");
  });

  test("empty submit is blocked by native required validation", async ({ page }) => {
    const email = page.getByPlaceholder("your@email.com");
    await expect(email).toHaveAttribute("required", "");

    await page.getByRole("button", { name: /get early access/i }).click();

    // The form must NOT advance to the sent state on an empty email.
    await expect(
      page.getByText(/check your email/i),
    ).toHaveCount(0);
    // Native constraint validation rejects the empty required field.
    const valid = await email.evaluate(
      (el: HTMLInputElement) => el.checkValidity(),
    );
    expect(valid).toBe(false);
  });

  test("an invalid email is rejected by the email input type", async ({ page }) => {
    const email = page.getByPlaceholder("your@email.com");
    await expect(email).toHaveAttribute("type", "email");
    await email.fill("not-an-email");

    const valid = await email.evaluate(
      (el: HTMLInputElement) => el.checkValidity(),
    );
    expect(valid).toBe(false);
  });
});
