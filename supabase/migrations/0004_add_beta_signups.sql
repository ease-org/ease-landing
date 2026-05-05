-- Beta signup table for landing page waitlist
-- Users must authenticate via Supabase Auth (magic link) to sign up
-- This provides natural rate limiting via auth quotas and prevents spam

create table public.beta_signups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  source text default 'landing_page',
  metadata jsonb not null default '{}'::jsonb
);

alter table public.beta_signups enable row level security;

-- Only authenticated users can sign up
create policy "Authenticated users can sign up for beta"
  on public.beta_signups for insert
  with check (user_id = auth.uid());

-- Users can read their own signup
create policy "Users can read own beta signup"
  on public.beta_signups for select
  using (user_id = auth.uid());

-- Unique index per user (one signup per account)
create unique index beta_signups_user_id on public.beta_signups (user_id);
