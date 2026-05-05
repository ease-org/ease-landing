# Ease Landing Page
<!-- SPDX-License: MIT -->
<!-- Copyright (c) 2026 Ease Health -->

Public landing page for Ease — Your Personal Health Companion.

## Tech Stack

- **Astro** with Svelte components
- **Supabase** for authentication (magic link) and data storage
- **Vercel** for deployment

## Local Development

```bash
cd web
npm install
npm run dev
```

## Environment Variables

Set these in Vercel or `.env.local`:

| Variable | Description |
|----------|-------------|
| `PUBLIC_SUPABASE_URL` | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

## How It Works

1. User enters email → clicks "Get Early Access"
2. Supabase sends magic link to email
3. User clicks link → redirected back to page
4. Beta signup recorded in `beta_signups` table

## Supabase Setup

Run the migration in `ease-ios/supabase/migrations/0004_add_beta_signups.sql` to create the `beta_signups` table.

## Deploy to Vercel

```bash
cd web
vercel --prod
```

Set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` in Vercel project settings.
