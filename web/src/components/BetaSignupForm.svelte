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
    
    // Check if we're returning from magic link callback
    checkAuthCallback();
  });

  async function checkAuthCallback() {
    const hash = window.location.hash;
    if (hash.includes("access_token") || hash.includes("type=signup") || hash.includes("type=login")) {
      status = "loading";
      message = "Completing sign in...";
      
      // Let Supabase handle the token from URL hash
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user) {
        status = "signed_in";
        await createBetaSignup(user.id, user.email);
      } else if (error) {
        status = "error";
        message = error.message;
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }

  async function createBetaSignup(userId: string, userEmail: string | null) {
    const { data, error } = await supabase
      .from("beta_signups")
      .insert({ 
        user_id: userId,
        email: userEmail 
      })
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

    // Send magic link - this both signs up AND logs in if new user
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Redirect to this page after clicking the link
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
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

<section class="signup-form">
  <h2>Join the Beta</h2>
  <p>Be the first to experience Ease. Enter your email to get early access.</p>

  {#if status === "success"}
    <div class="success-message">
      <span class="checkmark">✓</span>
      <p>{message}</p>
    </div>
  {:else if status === "sent"}
    <div class="sent-message">
      <span class="mail-icon">✉️</span>
      <p>{message}</p>
      <p class="hint">Click the link in your email to complete sign-up.</p>
    </div>
  {:else}
    <form on:submit={handleSubmit}>
      <div class="input-group">
        <input
          type="email"
          bind:value={email}
          placeholder="your@email.com"
          required
          disabled={status === "loading"}
        />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Sending..." : "Get Early Access"}
        </button>
      </div>
      {#if message}
        <p class="error-message">{message}</p>
      {/if}
    </form>
  {/if}
</section>

<style>
  .signup-form {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 2rem;
    backdrop-filter: blur(10px);
  }

  h2 {
    font-size: 1.75rem;
    margin: 0 0 0.5rem 0;
    color: #1f1f1f;
  }

  p {
    color: #666;
    margin: 0 0 1.5rem 0;
  }

  .input-group {
    display: flex;
    gap: 0.5rem;
  }

  input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    background: white;
  }

  input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  button {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    white-space: nowrap;
  }

  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .success-message,
  .sent-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
  }

  .success-message {
    background: #ecfdf5;
    color: #065f46;
  }

  .sent-message {
    background: #eff6ff;
    color: #1e40af;
  }

  .checkmark,
  .mail-icon {
    font-size: 1.5rem;
  }

  .success-message p,
  .sent-message p {
    margin: 0;
  }

  .hint {
    font-size: 0.875rem;
    opacity: 0.8;
  }

  .error-message {
    color: #dc2626;
    margin: 0.75rem 0 0 0;
    font-size: 0.875rem;
  }
</style>
