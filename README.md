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

Database schema lives in [ease-deployment](https://github.com/ease-org/ease-deployment) — connected to Supabase for automatic migrations.

## Closed trial

`/trial/` is a key gate: a tester enters an `EASE-XXXX-XXXX` key, it is checked
against the separate **ease-trial** Supabase project, and the download appears.

The Android APK is **not** a file in this repo. This repo is public, so anything
under `web/public/` is downloadable by anyone who knows the path, and the gate is
client-side JavaScript that only reveals a link. The APK therefore lives in the
private `trial-builds` bucket of the ease-trial project, and `/trial/download`
(`web/api/trial-download.js`, rewritten in `web/vercel.json`) re-checks the key
server-side and redirects to a signed URL that expires after a minute.

Publishing a new build, once it is built and signed in
[ease-kotlin](https://github.com/ease-org/ease-kotlin):

```bash
SK=<ease-trial service key>          # supabase projects api-keys --project-ref yolwyazckiqdjhepjiex
curl -X POST "https://yolwyazckiqdjhepjiex.supabase.co/storage/v1/object/trial-builds/ease-android.apk"   -H "Authorization: Bearer $SK" -H "apikey: $SK" -H "x-upsert: true"   -H "Content-Type: application/vnd.android.package-archive"   --data-binary @app-release.apk
```

Nothing in this repo changes when the app does, and every build must be signed
with the same ease-trial keystore or Android refuses to install it over the
previous one.

`TRIAL_SUPABASE_SECRET` (the ease-trial service key) must be set on the Vercel
project; without it `/trial/download` answers 503 and the rest of the site is
unaffected.

## Deploy to Vercel

```bash
cd web
vercel --prod
```

Set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` in Vercel project settings.
