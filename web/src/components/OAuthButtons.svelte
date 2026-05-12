<script lang="ts">
  import { createClient, type SupabaseClient } from "@supabase/supabase-js";
  import { onMount } from "svelte";
  import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/env";

  export let redirectTo: string = `${window.location.origin}/beta`;
  export let compact: boolean = false;

  let supabase: SupabaseClient;

  onMount(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  async function signInWith(provider: "google" | "github") {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: false,
      },
    });
  }

  function signInWithAppleDisabled() {
    // Apple Developer account not yet configured — button is visual only
  }
</script>

<div class="oauth-buttons" class:compact>
  <button
    type="button"
    class="btn-oauth btn-google"
    on:click={() => signInWith("google")}
    aria-label="Sign in with Google"
  >
    <!-- Google logo SVG -->
    <svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
    {#if !compact}<span>Continue with Google</span>{/if}
  </button>

  <button
    type="button"
    class="btn-oauth btn-apple"
    disabled
    aria-label="Sign in with Apple (Coming Soon)"
    title="Coming soon — Apple Developer account not yet configured"
  >
    <!-- Apple logo SVG -->
    <svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .8-3.3.82-1.31.02-2.32-1.16-3.28-2.26-1.95-2.2-3.37-5.85-1.39-8.39C8.2 8.18 9.9 7.83 11.46 7.89c1.56.06 2.62.75 3.85.75.98 0 2.36-.54 3.71-.54 1.65 0 2.58.68 3.77.84.85.12 1.58.75 1.58 1.95 0 1.14-.86 2.65-1.34 3.3-.15.2-.26.44-.26.74 0 .24-.13.47-.42.47-.97 0-1.62-.85-3.31-.85-.77 0-1.59.21-2.36.35-.3.05-.64.11-.85.12-.19.01-.38-.07-.45-.23-.08-.19-.17-.4-.25-.61-.07-.19-.16-.34-.28-.52-.06-.09-.15-.17-.25-.24h-.01c-.14-.09-.28-.17-.43-.25-.23-.13-.46-.26-.7-.38h-.01c-.12-.06-.24-.12-.38-.16-.23-.07-.47-.14-.72-.19-.12-.03-.25-.05-.39-.07-.34-.05-.69-.08-1.08-.08-.19 0-.38.01-.56.03h-.01c-.22.02-.43.06-.63.1-.19.04-.38.09-.56.15-.29.09-.55.22-.8.36-.17.1-.33.21-.48.33-.24.19-.45.4-.64.64-.07.08-.13.17-.18.27-.11.2-.2.42-.27.65-.05.15-.09.31-.11.48-.03.24-.05.49-.05.75 0 .19.01.38.03.58.01.13.04.26.06.4.03.21.08.42.14.63.04.15.1.29.16.43.09.21.19.41.3.61.08.15.17.29.27.42.14.2.3.38.46.56.12.13.24.26.37.38.18.17.36.33.55.48.14.11.29.22.44.32.2.13.41.26.63.37.17.09.35.17.53.24.23.09.46.18.7.25.18.05.37.1.56.14.25.05.5.09.76.12.2.02.4.04.61.05.27.02.55.03.83.03.37 0 .73-.02 1.08-.06.22-.02.43-.06.64-.1.3-.06.6-.14.88-.23.2-.07.4-.15.59-.24.25-.12.49-.25.72-.4.17-.11.33-.23.49-.36.21-.17.41-.35.59-.55.14-.15.27-.31.39-.48.17-.22.33-.46.47-.71.1-.18.19-.37.27-.56.1-.24.2-.5.27-.77.05-.19.1-.39.14-.6.05-.27.08-.55.1-.84.01-.22.02-.44.02-.67 0-.35-.02-.7-.06-1.04-.03-.22-.07-.44-.12-.66-.06-.26-.14-.51-.22-.76-.07-.21-.15-.42-.24-.62-.1-.23-.22-.45-.35-.67-.11-.19-.23-.37-.36-.55-.15-.21-.31-.41-.48-.6-.15-.17-.31-.33-.47-.49-.18-.17-.37-.34-.57-.5-.18-.14-.37-.28-.56-.41-.21-.14-.43-.27-.65-.4-.2-.12-.41-.23-.62-.34-.22-.11-.44-.22-.68-.32-.24-.1-.49-.19-.74-.27-.26-.08-.53-.15-.8-.22-.26-.06-.53-.11-.8-.16-.28-.05-.57-.08-.87-.11-.25-.02-.51-.04-.77-.05-.3-.01-.61-.01-.92-.01z" fill="currentColor"/>
    </svg>
    {#if !compact}<span>Continue with Apple</span>{/if}
    <span class="badge-soon">Coming Soon</span>
  </button>

  <button
    type="button"
    class="btn-oauth btn-github"
    on:click={() => signInWith("github")}
    aria-label="Sign in with GitHub"
  >
    <!-- GitHub logo SVG -->
    <svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
    {#if !compact}<span>Continue with GitHub</span>{/if}
  </button>
</div>

<style>
  .oauth-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .oauth-buttons.compact {
    flex-direction: row;
    gap: 8px;
  }

  .btn-oauth {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 12px 18px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    color: var(--text, #EDEAF2);
    cursor: pointer;
    transition:
      background 0.2s,
      border-color 0.2s,
      box-shadow 0.2s,
      transform 0.15s;
  }

  .btn-oauth:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.16);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
    transform: translateY(-1px);
  }

  .btn-oauth:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-oauth:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    position: relative;
  }

  .provider-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .btn-google .provider-icon {
    color: #4285F4;
  }

  .btn-apple .provider-icon {
    color: var(--text, #EDEAF2);
  }

  .btn-github .provider-icon {
    color: var(--text, #EDEAF2);
  }

  .badge-soon {
    position: absolute;
    top: -6px;
    right: -6px;
    padding: 2px 8px;
    background: var(--purple, #6C63AC);
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border-radius: 999px;
    white-space: nowrap;
  }

  /* compact: small square buttons */
  .compact .btn-oauth {
    flex: 1;
    padding: 11px 12px;
    gap: 0;
  }

  .compact .btn-oauth span:not(.badge-soon) {
    display: none;
  }
</style>