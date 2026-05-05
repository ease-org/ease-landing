/**
 * Environment configuration for the landing page.
 *
 * DEV: defaults to local Supabase (supabase start).
 * PROD: set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in Vercel dashboard.
 */

declare const process: { env: Record<string, string | undefined> };

// Supabase project URL — default to local dev instance
export const SUPABASE_URL: string =
  typeof process !== 'undefined' && process.env?.PUBLIC_SUPABASE_URL
    ? process.env.PUBLIC_SUPABASE_URL
    : 'http://127.0.0.1:54321';

// Supabase anonymous (anon) key — safe to expose in client bundles
// Default local key from `supabase status` when running `supabase start`
export const SUPABASE_ANON_KEY: string =
  typeof process !== 'undefined' && process.env?.PUBLIC_SUPABASE_ANON_KEY
    ? process.env.PUBLIC_SUPABASE_ANON_KEY
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRIt5LITiyGZ6G7bYkjXb3V8e2_7J8c5k6yRP4G6n7k';
