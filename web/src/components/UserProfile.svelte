<script lang="ts">
  import { onMount } from 'svelte';
  import { createClient, type SupabaseClient } from "@supabase/supabase-js";
  import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/env";

  let session: any = null;
  let loading = true;
  let userRoles: string[] = [];
  let supabase: SupabaseClient;

  onMount(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data } = await supabase.auth.getSession();
    session = data.session;

    if (session) {
      await fetchRoles();
    }
    loading = false;

    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      session = newSession;
      if (session) {
        fetchRoles();
      } else {
        userRoles = [];
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  });

  async function fetchRoles() {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .is('revoked_at', null);
        
      if (!error && data) {
        userRoles = data.map(r => r.role);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function login() {
    await supabase.auth.signInWithOAuth({
      provider: 'github', // Matches the dashboard provider
      options: {
        redirectTo: window.location.origin + '/auth/callback'
      }
    });
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }
</script>

<div class="profile-wrapper">
  {#if loading}
    <p class="loading-state">Loading profile...</p>
  {:else if !session}
    <div class="alert-box">
      <h2>Please log in</h2>
      <p>You need to be logged in to view your profile.</p>
      <button class="btn-primary" on:click={login}>Log in</button>
    </div>
  {:else}
    <div class="profile-card">
      <div class="profile-header">
        <div class="avatar">
          {session.user.email?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2>Account Details</h2>
          <p class="email">{session.user.email}</p>
        </div>
      </div>
      
      <div class="profile-details">
        <div class="detail-row">
          <span class="label">User ID:</span>
          <code class="value">{session.user.id}</code>
        </div>
        <div class="detail-row">
          <span class="label">Account Type:</span>
          <span class="value">{session.user.app_metadata?.account_type || 'human_user'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Roles:</span>
          <div class="roles">
            {#if userRoles.length > 0}
              {#each userRoles as role}
                <span class="role-badge {role === 'admin' ? 'role-admin' : role === 'developer' ? 'role-dev' : ''}">{role}</span>
              {/each}
            {:else}
              <span class="role-badge role-standard">Standard User</span>
            {/if}
          </div>
        </div>
      </div>

      <div class="profile-actions">
        {#if userRoles.includes('admin') || userRoles.includes('developer')}
          <a href="/dashboard" class="btn-outline">Developer Dashboard</a>
        {/if}
        <button class="btn-danger" on:click={logout}>Sign Out</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .profile-wrapper {
    max-width: 600px;
    margin: 40px auto;
    font-family: var(--font, sans-serif);
    color: var(--text, #333);
  }
  .loading-state {
    text-align: center;
    color: var(--muted, #888);
  }
  .alert-box {
    text-align: center;
    padding: 3rem;
    background: var(--surface, #1e1e2e);
    border: 1px solid var(--border, #333);
    border-radius: 12px;
  }
  .alert-box h2 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: var(--text, #fff);
  }
  .alert-box p {
    color: var(--muted, #888);
    margin-bottom: 2rem;
  }
  .profile-card {
    background: var(--surface, #1e1e2e);
    padding: 2.5rem;
    border-radius: 12px;
    border: 1px solid var(--border, #333);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  }
  .profile-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border, #333);
  }
  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--purple-l, #A8A0D6), var(--purple, #6C63AC));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
  }
  .profile-header h2 {
    margin: 0 0 0.25rem 0;
    font-size: 1.5rem;
    color: var(--text, #fff);
  }
  .email {
    margin: 0;
    color: var(--muted, #888);
    font-size: 1.05rem;
    word-break: break-all;
  }
  .profile-details {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }
  .detail-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .label {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted, #888);
    font-weight: 600;
  }
  .value {
    font-size: 1.05rem;
    color: var(--text-2, #ddd);
  }
  code.value {
    font-family: monospace;
    background: rgba(0, 0, 0, 0.2);
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.05);
    word-break: break-all;
    color: var(--purple-l, #A8A0D6);
  }
  .roles {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .role-badge {
    padding: 0.3rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: capitalize;
  }
  .role-admin {
    background: rgba(232, 132, 92, 0.15);
    color: var(--orange-l, #f0a882);
    border: 1px solid rgba(232, 132, 92, 0.3);
  }
  .role-dev {
    background: rgba(108, 99, 172, 0.15);
    color: var(--purple-l, #A8A0D6);
    border: 1px solid rgba(108, 99, 172, 0.3);
  }
  .role-standard {
    background: rgba(107, 143, 113, 0.15);
    color: var(--green-t, #9BC4A2);
    border: 1px solid rgba(107, 143, 113, 0.3);
  }
  .profile-actions {
    display: flex;
    gap: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border, #333);
  }
  .btn-primary {
    padding: 0.6rem 1.25rem;
    background: var(--purple, #6C63AC);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: filter 0.2s;
  }
  .btn-primary:hover {
    filter: brightness(1.1);
  }
  .btn-outline {
    padding: 0.6rem 1.25rem;
    background: transparent;
    color: var(--text, #fff);
    border: 1px solid var(--border, #333);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .btn-outline:hover {
    background: rgba(255,255,255,0.05);
  }
  .btn-danger {
    padding: 0.6rem 1.25rem;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }
  .btn-danger:hover {
    background: rgba(239, 68, 68, 0.2);
  }
</style>