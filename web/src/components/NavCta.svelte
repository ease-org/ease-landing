<script lang="ts">
  import { createClient } from "@supabase/supabase-js";
  import { onMount } from "svelte";
  import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/env";
  import { ui, defaultLang, type Lang } from "../i18n/ui";

  export let lang: Lang = defaultLang;

  let authed = false;

  $: m = ui[lang].navCta;

  onMount(async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { session } } = await supabase.auth.getSession();
    authed = !!session;
  });
</script>

{#if authed}
  <a href="/beta" class="nav-cta nav-cta-member">{m.privateBeta}</a>
{:else}
  <a href="#beta" class="nav-cta">{m.joinBeta}</a>
{/if}
