/**
 * Environment configuration for the landing page.
 *
 * DEV: defaults to local Supabase (supabase start).
 * PROD: set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in Vercel dashboard.
 */

// Astro exposes PUBLIC_ prefixed vars via import.meta.env on the client
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRIt5LITiyGZ6G7bYkjXb3V8e2_7J8c5k6yRP4G6n7k";

export const SUPABASE_URL: string = supabaseUrl;
export const SUPABASE_ANON_KEY: string = supabaseAnonKey;
