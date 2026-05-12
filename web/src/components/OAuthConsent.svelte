<script lang="ts">
  import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
  import { onMount } from "svelte";
  import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../lib/env";
  import OAuthButtons from "./OAuthButtons.svelte";

  type ViewState = "loading" | "login" | "consent" | "submitting" | "link-sent" | "error";

  type AuthorizationDetails = {
    client: {
      name?: string;
    };
    redirect_uri?: string;
    scope?: string;
  };

  let supabase: SupabaseClient;
  let state: ViewState = "loading";
  let email = "";
  let password = "";
  let errorMessage = "";
  let infoMessage = "";
  let authorizationId = "";
  let authDetails: AuthorizationDetails | null = null;
  let session: Session | null = null;

  onMount(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await bootstrap();
  });

  function oauthApi() {
    return (supabase.auth as unknown as {
      oauth?: {
        getAuthorizationDetails: (authorizationId: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
        approveAuthorization: (authorizationId: string) => Promise<{ data: { redirect_to: string } | null; error: { message: string } | null }>;
        denyAuthorization: (authorizationId: string) => Promise<{ data: { redirect_to: string } | null; error: { message: string } | null }>;
      };
    }).oauth;
  }

  async function bootstrap() {
    try {
      const currentUrl = new URL(window.location.href);
      authorizationId = currentUrl.searchParams.get("authorization_id") ?? "";

      if (!authorizationId) {
        throw new Error("Missing authorization request. Start the login flow again from MLflow.");
      }

      const code = currentUrl.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          throw error;
        }
        currentUrl.searchParams.delete("code");
        currentUrl.searchParams.delete("type");
        window.history.replaceState({}, "", `${currentUrl.pathname}?${currentUrl.searchParams.toString()}`);
      }

      const {
        data: { session: activeSession },
      } = await supabase.auth.getSession();

      session = activeSession;

      if (!session) {
        state = "login";
        return;
      }

      await loadAuthorizationDetails();
    } catch (error) {
      fail(error);
    }
  }

  async function loadAuthorizationDetails() {
    const oauth = oauthApi();
    if (!oauth) {
      throw new Error("Supabase OAuth client helpers are unavailable in this build.");
    }

    const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
    if (error || !data) {
      throw new Error(error?.message ?? "Could not load authorization details.");
    }

    authDetails = data;
    state = "consent";
    errorMessage = "";
    infoMessage = "";
  }

  async function signInWithPassword() {
    if (!email || !password) {
      errorMessage = "Enter both email and password.";
      return;
    }

    state = "submitting";
    errorMessage = "";
    infoMessage = "";

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      fail(error ?? new Error("Sign-in failed."), "login");
      return;
    }

    session = data.session;
    await loadAuthorizationDetails();
  }

  async function sendMagicLink() {
    if (!email) {
      errorMessage = "Enter your email address first.";
      return;
    }

    state = "submitting";
    errorMessage = "";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.href,
      },
    });

    if (error) {
      fail(error, "login");
      return;
    }

    state = "link-sent";
    infoMessage = "Check your email for a sign-in link, then return here to approve MLflow access.";
  }

  async function handleDecision(decision: "approve" | "deny") {
    const oauth = oauthApi();
    if (!oauth) {
      fail(new Error("Supabase OAuth client helpers are unavailable in this build."));
      return;
    }

    state = "submitting";
    errorMessage = "";

    const response = decision === "approve"
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);

    if (response.error || !response.data?.redirect_to) {
      fail(new Error(response.error?.message ?? `Could not ${decision} authorization.`), "consent");
      return;
    }

    window.location.href = response.data.redirect_to;
  }

  async function signOut() {
    await supabase.auth.signOut();
    session = null;
    authDetails = null;
    password = "";
    state = "login";
  }

  function fail(error: unknown, fallback: ViewState = "error") {
    errorMessage = error instanceof Error ? error.message : "Something went wrong.";
    state = fallback;
  }

  $: scopes = authDetails?.scope?.trim() ? authDetails.scope.trim().split(/\s+/) : [];
</script>

<div class="wrap">
  <div class="panel">
    <div class="badge">Supabase OAuth Server</div>

    {#if state === "loading" || state === "submitting"}
      <div class="status-block">
        <div class="spinner" aria-hidden="true"></div>
        <div>
          <h1>{state === "loading" ? "Preparing consent" : "Working on it"}</h1>
          <p>{state === "loading" ? "Checking your session and loading the OAuth request." : "Please wait while we finish the current step."}</p>
        </div>
      </div>
    {:else if state === "login" || state === "link-sent"}
      <div class="copy-block">
        <h1>Sign in to continue</h1>
        <p>
          MLflow is requesting access through your Ease account. Sign in below, then review the requested permissions.
        </p>
      </div>

      {#if errorMessage}
        <p class="message error">{errorMessage}</p>
      {/if}

      {#if infoMessage}
        <p class="message info">{infoMessage}</p>
      {/if}

      <form class="auth-form" on:submit|preventDefault={signInWithPassword}>
        <OAuthButtons
          redirectTo={window.location.href}
        />
        <div class="divider"><span>or sign in with email</span></div>
        <label>
          <span>Email</span>
          <input bind:value={email} type="email" autocomplete="email" placeholder="you@ease-health.org" required />
        </label>

        <label>
          <span>Password</span>
          <input bind:value={password} type="password" autocomplete="current-password" placeholder="Enter your password" />
        </label>

        <div class="button-row">
          <button type="submit" class="primary">Sign in</button>
          <button type="button" class="secondary" on:click={sendMagicLink}>Email me a magic link</button>
        </div>
      </form>

      <p class="hint">
        The magic link returns you straight back to this consent screen with the pending authorization request intact.
      </p>
    {:else if state === "consent" && authDetails}
      <div class="copy-block">
        <h1>Authorize {authDetails.client.name ?? "MLflow"}</h1>
        <p>
          This app wants to use your Ease account to authenticate. Review the requested access before continuing.
        </p>
      </div>

      <div class="details-card">
        <div>
          <span class="label">Client</span>
          <strong>{authDetails.client.name ?? "MLflow"}</strong>
        </div>
        <div>
          <span class="label">Redirect</span>
          <strong class="mono">{authDetails.redirect_uri ?? "Unknown"}</strong>
        </div>
        <div>
          <span class="label">Signed in as</span>
          <strong>{session?.user.email ?? "Unknown user"}</strong>
        </div>
      </div>

      <div class="scope-card">
        <span class="label">Requested scopes</span>
        {#if scopes.length}
          <ul>
            {#each scopes as scope}
              <li>{scope}</li>
            {/each}
          </ul>
        {:else}
          <p>No scopes were requested.</p>
        {/if}
      </div>

      {#if errorMessage}
        <p class="message error">{errorMessage}</p>
      {/if}

      <div class="button-row">
        <button type="button" class="primary" on:click={() => handleDecision("approve")}>Approve access</button>
        <button type="button" class="secondary" on:click={() => handleDecision("deny")}>Deny</button>
      </div>

      <button type="button" class="link" on:click={signOut}>Use a different account</button>
    {:else}
      <div class="copy-block">
        <h1>Consent screen unavailable</h1>
        <p>We could not complete this OAuth request automatically.</p>
      </div>
      <p class="message error">{errorMessage}</p>
    {/if}
  </div>
</div>

<style>
  .wrap {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 112px 24px 64px;
  }

  .panel {
    background: rgba(255, 255, 255, 0.045);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 32px;
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    box-shadow: 0 12px 54px rgba(0, 0, 0, 0.28);
  }

  .badge {
    display: inline-flex;
    margin-bottom: 18px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid rgba(108, 99, 172, 0.28);
    background: rgba(108, 99, 172, 0.14);
    color: #c0b8e8;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .copy-block h1 {
    font-size: clamp(30px, 5vw, 44px);
    line-height: 1.05;
    letter-spacing: -0.04em;
    margin-bottom: 12px;
  }

  .copy-block p,
  .hint,
  .scope-card p,
  .status-block p {
    color: #7a7690;
    font-size: 14px;
    line-height: 1.65;
  }

  .status-block {
    display: flex;
    align-items: center;
    gap: 16px;
    min-height: 180px;
  }

  .spinner {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.15);
    border-top-color: #a8a0d6;
    animation: spin 0.9s linear infinite;
    flex-shrink: 0;
  }

  .auth-form {
    display: grid;
    gap: 16px;
    margin-top: 24px;
  }

  label {
    display: grid;
    gap: 8px;
  }

  label span,
  .label {
    color: #7a7690;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  input {
    width: 100%;
    padding: 14px 16px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #edeaf2;
    font: inherit;
  }

  input:focus {
    outline: none;
    border-color: rgba(108, 99, 172, 0.55);
    box-shadow: 0 0 0 3px rgba(108, 99, 172, 0.14);
  }

  .button-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 8px;
  }

  button {
    appearance: none;
    border: 0;
    border-radius: 14px;
    padding: 13px 18px;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s ease, background 0.2s ease, color 0.2s ease;
  }

  button:hover {
    transform: translateY(-1px);
  }

  .primary {
    background: #6c63ac;
    color: #fff;
  }

  .primary:hover {
    background: #7b73be;
  }

  .secondary {
    background: rgba(255, 255, 255, 0.06);
    color: #edeaf2;
    border: 1px solid rgba(255, 255, 255, 0.09);
  }

  .link {
    margin-top: 18px;
    padding: 0;
    background: none;
    color: #a8a0d6;
  }

  .message {
    margin-top: 18px;
    border-radius: 14px;
    padding: 12px 14px;
    font-size: 13px;
    line-height: 1.55;
  }

  .message.error {
    background: rgba(220, 82, 82, 0.12);
    border: 1px solid rgba(220, 82, 82, 0.24);
    color: #ffb0b0;
  }

  .message.info {
    background: rgba(107, 143, 113, 0.12);
    border: 1px solid rgba(107, 143, 113, 0.24);
    color: #b9d7bf;
  }

  .details-card,
  .scope-card {
    margin-top: 24px;
    padding: 18px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
  }

  .details-card {
    display: grid;
    gap: 16px;
  }

  .details-card strong,
  .scope-card li,
  .scope-card p {
    display: block;
    margin-top: 4px;
    color: #edeaf2;
    font-size: 14px;
    line-height: 1.6;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    word-break: break-word;
  }

  .scope-card ul {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    list-style: none;
    margin-top: 12px;
  }

  .scope-card li {
    margin-top: 0;
    padding: 7px 12px;
    border-radius: 999px;
    background: rgba(107, 143, 113, 0.12);
    border: 1px solid rgba(107, 143, 113, 0.22);
    color: #b9d7bf;
    font-size: 12px;
    font-weight: 600;
  }

  .hint {
    margin-top: 14px;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0 4px;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
  }

  .divider span {
    font-size: 11px;
    font-weight: 500;
    color: #7a7690;
    white-space: nowrap;
    letter-spacing: 0.03em;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 640px) {
    .wrap {
      padding: 96px 16px 48px;
    }

    .panel {
      padding: 24px;
    }

    .button-row {
      flex-direction: column;
    }

    .button-row button {
      width: 100%;
    }
  }
</style>
