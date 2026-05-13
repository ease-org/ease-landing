/**
 * Environment configuration for the landing page.
 *
 * DEV: defaults to local Supabase (supabase start).
 * PROD: set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in Vercel dashboard.
 */

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? "https://lxzukgjularihhbcycdc.supabase.co";
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4enVrZ2p1bGFyaWhoYmN5Y2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTE1MzEsImV4cCI6MjA5MzU4NzUzMX0.-hnwOjggNHuAg67HFTuw9D1iqZocFuHnaXIa_kT4n5E";

export const SUPABASE_URL: string = supabaseUrl;
export const SUPABASE_ANON_KEY: string = supabaseAnonKey;
