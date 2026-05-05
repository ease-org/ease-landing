<script lang="ts">
  import { createClient, type SupabaseClient } from "@supabase/supabase-js";
  import { onMount } from "svelte";
  import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/env";

  let email = "";
  let status: "idle" | "loading" | "sent" | "signed_in" | "success" | "error" = "idle";
  let message = "";
  let supabase: SupabaseClient;

  onMount(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    checkAuthCallback();
  });

  async function checkAuthCallback() {
    // Supabase magic link: tokens come via query string (?access_token=...)
    // OAuth-style flows may use hash (#), so check both
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    if (searchParams.has("access_token") || searchParams.has("type") ||
        hash.includes("access_token") || hash.includes("type=signup") || hash.includes("type=login")) {
      status = "loading";
      message = "Completing sign in...";

      const { data: { user }, error } = await supabase.auth.getUser();

      if (user) {
        status = "signed_in";
        await createBetaSignup(user.id, user.email);
      } else if (error) {
        status = "error";
        message = error.message;
      }
      // Clean up URL (remove auth params) but stay on current page
      const cleanUrl = new URL(window.location.href);
      cleanUrl.search = "";
      cleanUrl.hash = "";
      window.history.replaceState({}, "", cleanUrl.pathname);
    }
  }

  async function createBetaSignup(userId: string, userEmail: string | null) {
    const { error } = await supabase
      .from("beta_signups")
      .insert({ user_id: userId, email: userEmail })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        status = "success";
        message = "You're already on the list! We'll be in touch soon.";
      } else {
        status = "error";
        message = error.message;
      }
    } else {
      status = "success";
      message = "You're on the list! We'll be in touch soon.";
    }
    window.history.replaceState({}, "", window.location.pathname);
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!email || status === "loading") return;

    status = "loading";
    message = "";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/beta`,
      },
    });

    if (error) {
      status = "error";
      message = error.message;
    } else {
      status = "sent";
      message = "Check your email for a magic sign-in link.";
    }
  }
</script>

<div class="signup">
  {#if status === "success"}
    <div class="state-card success">
      <svg class="s-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
      <p>{message}</p>
    </div>

  {:else if status === "signed_in"}
    <div class="state-card loading">
      <svg class="s-icon spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      <p>Completing sign in…</p>
    </div>

  {:else if status === "sent"}
    <div class="state-card sent">
      <svg class="s-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      <div>
        <p>{message}</p>
        <p class="hint">Click the link in your email to complete sign-up.</p>
      </div>
    </div>

  {:else}
    <form on:submit={handleSubmit}>
      <div class="row">
        <input
          type="email"
          bind:value={email}
          placeholder="your@email.com"
          required
          disabled={status === "loading"}
          autocomplete="email"
        />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Sending…" : "Get early access"}
        </button>
      </div>
      {#if message && status === "error"}
        <p class="error">{message}</p>
      {/if}
    </form>
  {/if}
</div>

<style>
  .signup { width: 100%; }

  form { width: 100%; }

  .row {
    display: flex;
    gap: 8px;
    max-width: 460px;
    margin: 0 auto;
  }

  input {
    flex: 1;
    min-width: 0;
    padding: 13px 16px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 400;
    color: var(--text, #EDEAF2);
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  input::placeholder { color: var(--dim, #5A5770); }
  input:focus {
    outline: none;
    border-color: rgba(108,99,172,0.65);
    background: rgba(255,255,255,0.08);
    box-shadow: 0 0 0 3px rgba(108,99,172,0.14);
  }
  input:disabled { opacity: 0.45; cursor: not-allowed; }

  button {
    padding: 13px 22px;
    background: var(--purple, #6C63AC);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.01em;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
  }
  button:hover:not(:disabled) {
    background: #7a72bc;
    box-shadow: 0 4px 22px rgba(108,99,172,0.45);
    transform: translateY(-1px);
  }
  button:active:not(:disabled) { transform: translateY(0); }
  button:disabled { opacity: 0.55; cursor: not-allowed; }

  .state-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 14px;
    max-width: 460px;
    margin: 0 auto;
    text-align: left;
  }
  .success {
    background: rgba(107,143,113,0.12);
    border: 1px solid rgba(107,143,113,0.28);
  }
  .sent {
    background: rgba(108,99,172,0.1);
    border: 1px solid rgba(108,99,172,0.28);
  }
  .loading {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    align-items: center;
  }

  .state-card p {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-2, #E0DDE6);
    margin: 0;
    line-height: 1.5;
  }
  .hint {
    font-size: 12px !important;
    color: var(--muted, #7A7690) !important;
    margin-top: 4px !important;
  }

  .s-icon {
    flex-shrink: 0;
    width: 17px;
    height: 17px;
    margin-top: 1px;
  }
  .success .s-icon { color: var(--green-t, #9BC4A2); }
  .sent    .s-icon { color: var(--purple-l, #A8A0D6); }
  .loading .s-icon { color: var(--muted, #7A7690); }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .spin { animation: spin 1s linear infinite; }

  .error {
    font-size: 12px;
    color: #f08080;
    text-align: center;
    margin-top: 10px;
  }

  @media (max-width: 520px) {
    .row { flex-direction: column; }
    button { width: 100%; }
  }
</style>
