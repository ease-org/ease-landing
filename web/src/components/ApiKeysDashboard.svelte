<script lang="ts">
  import { onMount } from 'svelte';
  import { createClient, type SupabaseClient } from "@supabase/supabase-js";
  import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/env";

  let session: any = null;
  let loading = true;
  let keys: any[] = [];
  let loadingKeys = false;
  let newKeyToken = '';
  let supabase: SupabaseClient;

  const AUTH_SERVICE_URL = import.meta.env.PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3100';

  onMount(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data } = await supabase.auth.getSession();
    session = data.session;
    loading = false;

    if (session) {
      loadKeys();
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      session = newSession;
      if (session) {
        loadKeys();
      } else {
        keys = [];
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  });

  async function login() {
    await supabase.auth.signInWithOAuth({
      provider: 'github', // Or google, etc.
      options: {
        redirectTo: window.location.origin + '/auth/callback'
      }
    });
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function loadKeys() {
    loadingKeys = true;
    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/v1/api-keys`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        keys = data.keys || [];
      }
    } catch (e) {
      console.error('Failed to load keys', e);
    } finally {
      loadingKeys = false;
    }
  }

  async function createKey(purpose: string, scopes: string[]) {
    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/v1/api-keys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          purpose,
          scope_names: scopes
        })
      });
      if (res.ok) {
        const data = await res.json();
        newKeyToken = data.full_token;
        await loadKeys();
      } else {
        alert('Failed to create key');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating key');
    }
  }

  async function revokeKey(keyId: string) {
    if (!confirm('Are you sure you want to revoke this key?')) return;
    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/v1/api-keys/${keyId}/revoke`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'User revoked via UI' })
      });
      if (res.ok) {
        await loadKeys();
      } else {
        alert('Failed to revoke key');
      }
    } catch (e) {
      console.error(e);
    }
  }
</script>

<div class="dashboard-wrapper">
  {#if loading}
    <p>Loading...</p>
  {:else if !session}
    <div class="login-container">
      <h2>Welcome to Ease Auth</h2>
      <p>Log in to manage your API keys for MLflow and Docker Registry.</p>
      <button on:click={login} class="btn-primary">Log in</button>
    </div>
  {:else}
    <div class="dashboard">
      <div class="header-row">
        <h2>Your API Keys</h2>
        <button class="logout" on:click={logout}>Log out</button>
      </div>

      <p class="user-email">Logged in as {session.user.email}</p>

      {#if newKeyToken}
        <div class="alert">
          <strong>Key Created!</strong>
          <p>Copy this secret now. It will never be shown again.</p>
          <code>{newKeyToken}</code>
          <button class="btn-outline" on:click={() => (newKeyToken = '')}>I have copied it</button>
        </div>
      {/if}

      <div class="actions">
        <button class="btn-primary" on:click={() => createKey('registry', ['registry:pull', 'registry:push'])}>
          + Create Registry Key
        </button>
        <button class="btn-primary" on:click={() => createKey('mlflow', ['mlflow:read', 'mlflow:write', 'mlflow:model-registry'])}>
          + Create MLflow Key
        </button>
      </div>

      {#if loadingKeys}
        <p>Loading keys...</p>
      {:else if keys.length === 0}
        <p class="empty-state">You don't have any active API keys.</p>
      {:else}
        <div class="table-container">
          <table class="keys-table">
            <thead>
              <tr>
                <th>Key ID</th>
                <th>Purpose</th>
                <th>Hint</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each keys as key}
                <tr>
                  <td><code>{key.key_id}</code></td>
                  <td>{key.purpose}</td>
                  <td><code>{key.secret_hint}</code></td>
                  <td>{new Date(key.created_at).toLocaleDateString()}</td>
                  <td>
                    <span class={key.revoked_at ? 'status-revoked' : 'status-active'}>
                      {key.revoked_at ? 'Revoked' : 'Active'}
                    </span>
                  </td>
                  <td>
                    {#if !key.revoked_at}
                      <button class="btn-danger" on:click={() => revokeKey(key.key_id)}>Revoke</button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .dashboard-wrapper {
    max-width: 900px;
    margin: 40px auto;
    font-family: var(--font, sans-serif);
    color: var(--text, #333);
  }
  .login-container {
    text-align: center;
    padding: 3rem;
    background: var(--surface, #1e1e2e);
    border: 1px solid var(--border, #333);
    border-radius: 12px;
  }
  .login-container h2 {
    margin-bottom: 1rem;
    color: var(--text);
  }
  .login-container p {
    color: var(--muted, #888);
    margin-bottom: 2rem;
  }
  
  .dashboard {
    background: var(--surface, #1e1e2e);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid var(--border, #333);
  }
  
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .header-row h2 {
    margin: 0;
    color: var(--text);
  }
  
  .user-email {
    color: var(--muted, #888);
    margin-bottom: 2rem;
    font-size: 0.9rem;
  }

  .btn-primary {
    padding: 0.5rem 1rem;
    background: var(--purple, #6C63AC);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: filter 0.2s;
  }
  .btn-primary:hover {
    filter: brightness(1.1);
  }
  
  .logout {
    background: transparent;
    color: var(--muted, #888);
    border: 1px solid var(--border, #333);
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    cursor: pointer;
  }
  .logout:hover {
    color: var(--text);
    border-color: var(--muted);
  }
  
  .btn-danger {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
  }
  .btn-danger:hover {
    background: rgba(239, 68, 68, 0.2);
  }
  
  .btn-outline {
    background: transparent;
    border: 1px solid var(--border, #333);
    color: var(--text);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 1rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin: 2rem 0;
  }
  
  .alert {
    background: rgba(108, 99, 172, 0.1);
    border: 1px solid var(--purple, #6C63AC);
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }
  .alert code {
    display: block;
    margin: 1rem 0;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border, #333);
    padding: 0.75rem;
    border-radius: 4px;
    word-break: break-all;
    color: var(--text);
  }
  
  code {
    background: rgba(0, 0, 0, 0.2);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: monospace;
    color: var(--purple-l, #A8A0D6);
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  .keys-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border, #333);
    color: var(--text);
  }
  
  th {
    font-weight: 600;
    color: var(--muted, #888);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .status-active {
    color: var(--green-t, #9BC4A2);
    font-size: 0.85rem;
  }
  
  .status-revoked {
    color: #ef4444;
    font-size: 0.85rem;
  }
  
  .empty-state {
    color: var(--muted, #888);
    font-style: italic;
  }
</style>