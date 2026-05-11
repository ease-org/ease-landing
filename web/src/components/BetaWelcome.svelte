<script lang="ts">
  import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
  import { onMount } from "svelte";
  import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/env";

  let supabase: SupabaseClient;
  let user: User | null = null;
  let memberSince = "";
  let status: "checking" | "ready" = "checking";

  onMount(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let session = null;

    // PKCE flow: magic link delivers ?code=... — must be exchanged explicitly
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        window.location.replace("/#beta");
        return;
      }
      session = data.session;
      // Remove the code from the URL so refreshing the page doesn't re-use it
      window.history.replaceState({}, "", window.location.pathname);
    } else {
      // Returning user: check for an existing session
      const { data } = await supabase.auth.getSession();
      session = data.session;
    }

    if (!session) {
      window.location.replace("/#beta");
      return;
    }

    user = session.user;
    memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });

    // Ensure beta_signups record exists (idempotent)
    await supabase
      .from("beta_signups")
      .upsert({ user_id: user.id, email: user.email }, { onConflict: "user_id" });

    status = "ready";
  });

  async function signOut() {
    await supabase.auth.signOut();
    window.location.replace("/");
  }
</script>

{#if status === "checking"}
  <div class="checking" aria-label="Loading">
    <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  </div>

{:else if user}
  <div class="dashboard">

    <!-- Confirmation card -->
    <div class="confirm-card">
      <div class="confirm-badge">
        <span class="pulse-dot" aria-hidden="true"></span>
        PRIVATE BETA · CONFIRMED
      </div>
      <h1 class="welcome-title">You're in.<br /><span class="accent">We'll be in touch.</span></h1>
      <div class="user-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        <span class="user-email">{user.email}</span>
        <span class="member-since">Member since {memberSince}</span>
      </div>
    </div>

    <!-- Next steps -->
    <div class="steps-section">
      <p class="section-label">WHAT HAPPENS NEXT</p>
      <div class="steps">

        <div class="step done">
          <div class="step-num done-num">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="step-body">
            <span class="step-title">Email verified</span>
            <span class="step-desc">Your spot in the private beta is confirmed.</span>
          </div>
          <span class="step-tag tag-green">Done</span>
        </div>

        <div class="step">
          <div class="step-num">2</div>
          <div class="step-body">
            <span class="step-title">Receive your invite</span>
            <span class="step-desc">We onboard beta users in small waves. You'll get an email at <strong>{user.email}</strong> when your slot is ready.</span>
          </div>
          <span class="step-tag tag-dim">Pending</span>
        </div>

        <div class="step">
          <div class="step-num">3</div>
          <div class="step-body">
            <span class="step-title">Start tracking</span>
            <span class="step-desc">Install Ease, connect Apple HealthKit, and start logging. Your data helps calibrate the predictive models.</span>
          </div>
          <span class="step-tag tag-dim">Soon</span>
        </div>

      </div>
    </div>

    <!-- Phase status -->
    <div class="phase-section">
      <p class="section-label">CURRENT PHASE</p>
      <div class="phases">
        <div class="phase-item phase-active">
          <span class="phase-dot dot-green" aria-hidden="true"></span>
          <div>
            <span class="phase-name">Phase 1 · Private Beta</span>
            <span class="phase-desc">Migraine logging, trigger tracking, Apple HealthKit sync</span>
          </div>
          <span class="phase-badge badge-green">Active</span>
        </div>
        <div class="phase-item">
          <span class="phase-dot dot-orange" aria-hidden="true"></span>
          <div>
            <span class="phase-name">Phase 2 · Predictive Intelligence</span>
            <span class="phase-desc">Bayesian risk model, 12h/24h scores, uncertainty quantification</span>
          </div>
          <span class="phase-badge badge-orange">In development</span>
        </div>
        <div class="phase-item">
          <span class="phase-dot dot-dim" aria-hidden="true"></span>
          <div>
            <span class="phase-name">Phase 3 → 4 · Clinical Validation &amp; FDA 510(k)</span>
            <span class="phase-desc">Real-world pilot, calibration, ISO 14971, SaMD clearance</span>
          </div>
          <span class="phase-badge badge-dim">Planned</span>
        </div>
      </div>
    </div>

    <button class="sign-out-btn" on:click={signOut}>Sign out</button>

  </div>
{/if}

<style>
  /* ── Loading ─────────────────────────────────────────── */
  .checking {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
  }
  .checking svg {
    width: 32px; height: 32px;
    color: var(--muted, #7A7690);
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }

  /* ── Dashboard ───────────────────────────────────────── */
  .dashboard {
    max-width: 680px;
    margin: 0 auto;
    padding: 100px 24px 80px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    position: relative;
    z-index: 2;
  }

  /* ── Confirmation card ───────────────────────────────── */
  .confirm-card {
    background: var(--surface, rgba(255,255,255,0.035));
    border: 1px solid var(--border, rgba(255,255,255,0.07));
    border-top: 2px solid rgba(107,143,113,0.45);
    border-radius: 20px;
    padding: 36px 36px 32px;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 8px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04);
    position: relative;
    overflow: hidden;
  }
  .confirm-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(107,143,113,0.5), transparent);
  }

  .confirm-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px;
    background: rgba(107,143,113,0.12);
    border: 1px solid rgba(107,143,113,0.28);
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--green-t, #9BC4A2);
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .pulse-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--green-t, #9BC4A2);
    box-shadow: 0 0 6px rgba(107,143,113,0.6);
    animation: pulse-glow 2s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes pulse-glow {
    0%,100% { opacity: 0.6; box-shadow: 0 0 4px rgba(107,143,113,0.4); }
    50%      { opacity: 1;   box-shadow: 0 0 10px rgba(107,143,113,0.7); }
  }

  .welcome-title {
    font-size: clamp(32px, 5vw, 52px);
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 1.1;
    color: var(--text, #EDEAF2);
    margin-bottom: 20px;
  }
  .accent {
    color: var(--purple-l, #A8A0D6);
  }

  .user-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .user-row svg {
    width: 15px; height: 15px;
    color: var(--muted, #7A7690);
    flex-shrink: 0;
  }
  .user-email {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-2, #E0DDE6);
  }
  .member-since {
    font-size: 12px;
    color: var(--dim, #5A5770);
  }
  .member-since::before { content: '·'; margin-right: 10px; }

  /* ── Section label ───────────────────────────────────── */
  .section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.13em;
    color: var(--dim, #5A5770);
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  /* ── Steps ───────────────────────────────────────────── */
  .steps-section, .phase-section {
    background: var(--surface, rgba(255,255,255,0.035));
    border: 1px solid var(--border, rgba(255,255,255,0.07));
    border-radius: 18px;
    padding: 24px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .steps {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .step {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 0;
    border-bottom: 1px solid var(--border, rgba(255,255,255,0.07));
  }
  .step:last-child { border-bottom: none; padding-bottom: 0; }
  .step:first-child { padding-top: 0; }

  .step-num {
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 1px solid var(--border, rgba(255,255,255,0.07));
    background: rgba(255,255,255,0.03);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: var(--dim, #5A5770);
    flex-shrink: 0;
    margin-top: 1px;
  }
  .done-num {
    background: rgba(107,143,113,0.15);
    border-color: rgba(107,143,113,0.35);
    color: var(--green-t, #9BC4A2);
  }
  .done-num svg { width: 13px; height: 13px; }

  .step-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .step-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text, #EDEAF2);
    letter-spacing: -0.01em;
  }
  .step.done .step-title { color: var(--muted, #7A7690); }
  .step-desc {
    font-size: 12px;
    line-height: 1.6;
    color: var(--muted, #7A7690);
  }
  .step-desc strong { color: var(--text-2, #E0DDE6); font-weight: 600; }

  .step-tag {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 20px;
    flex-shrink: 0;
    white-space: nowrap;
    margin-top: 2px;
  }
  .tag-green  { background: rgba(107,143,113,0.14); border: 1px solid rgba(107,143,113,0.28); color: var(--green-t, #9BC4A2); }
  .tag-orange { background: rgba(232,132,92,0.12);  border: 1px solid rgba(232,132,92,0.25);  color: var(--orange-l, #f0a882); }
  .tag-dim    { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: var(--dim, #5A5770); }

  /* ── Phase status ────────────────────────────────────── */
  .phases {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .phase-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 13px 0;
    border-bottom: 1px solid var(--border, rgba(255,255,255,0.07));
  }
  .phase-item:last-child { border-bottom: none; padding-bottom: 0; }
  .phase-item:first-child { padding-top: 0; }

  .phase-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 5px;
  }
  .dot-green  { background: var(--green, #6B8F71);  box-shadow: 0 0 6px rgba(107,143,113,0.5); }
  .dot-orange { background: var(--orange, #E8845C); box-shadow: 0 0 6px rgba(232,132,92,0.4); }
  .dot-dim    { background: var(--dim, #5A5770); }

  .phase-item > div {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .phase-name {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-2, #E0DDE6);
    letter-spacing: -0.01em;
  }
  .phase-desc {
    font-size: 11px;
    line-height: 1.5;
    color: var(--dim, #5A5770);
  }

  .phase-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 20px;
    flex-shrink: 0;
    white-space: nowrap;
    margin-top: 2px;
  }
  .badge-green  { background: rgba(107,143,113,0.14); border: 1px solid rgba(107,143,113,0.28); color: var(--green-t, #9BC4A2); }
  .badge-orange { background: rgba(232,132,92,0.12);  border: 1px solid rgba(232,132,92,0.25);  color: var(--orange-l, #f0a882); }
  .badge-dim    { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: var(--dim, #5A5770); }

  /* ── Sign out ────────────────────────────────────────── */
  .sign-out-btn {
    align-self: center;
    background: none;
    border: none;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    color: var(--dim, #5A5770);
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 8px;
    transition: color 0.2s, background 0.2s;
  }
  .sign-out-btn:hover {
    color: var(--muted, #7A7690);
    background: rgba(255,255,255,0.04);
  }

  /* ── Responsive ──────────────────────────────────────── */
  @media (max-width: 520px) {
    .dashboard { padding: 90px 16px 60px; }
    .confirm-card { padding: 24px 20px; }
    .step-tag, .phase-badge { display: none; }
    .user-row { flex-direction: column; align-items: flex-start; gap: 4px; }
    .member-since::before { display: none; }
  }
</style>
