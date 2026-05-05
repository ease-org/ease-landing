<script lang="ts">
  import { createClient } from "@supabase/supabase-js";
  import { onMount } from "svelte";
  import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/env";

  let authed = false;

  onMount(async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { session } } = await supabase.auth.getSession();
    authed = !!session;
  });
</script>

{#if authed}
  <a href="/beta" class="nav-cta nav-cta-member">Private Beta</a>
{:else}
  <a href="#beta" class="nav-cta">Join Beta</a>
{/if}
