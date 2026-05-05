/**
 * Environment configuration for the landing page.
 *
 * DEV: defaults to local Supabase (supabase start).
 * PROD: set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel dashboard.
 */

const supabaseUrl = import.meta.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRIt5LITiyGZ6G7bYkjXb3V8e2_7J8c5k6yRP4G6n7k";

export const SUPABASE_URL: string = supabaseUrl;
export const SUPABASE_ANON_KEY: string = supabaseAnonKey;
