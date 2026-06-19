# QuitPorn – Reclaim Your Life

A shame-free, neuroscience-based porn addiction recovery tool. Private, anonymous, and built for real change.

## Features

- **Streak Counter** — Track your clean days with a visual circular counter
- **Encrypted Journal** — Client-side AES-GCM-256 encryption. Zero-knowledge. Your entries are yours alone.
- **AI Relapse Autopsy** — 3-question guided reflection + AI-powered pattern analysis (via OpenRouter / Llama 3.3 70B)
- **Trigger Pattern Detection** — Automatically identifies high-risk day/time/emotion combinations
- **10 Urge Intervention Techniques** — Science-backed micro-moments (Box Breathing, Urge Surfing, etc.)
- **Content Blocker** — Service Worker blocks ~94 known NSFW domains (plus custom additions)
- **Push Notifications** — Milestone reminders every 7 clean days
- **Honest Analytics Dashboard** — Streak, journal count, technique success rate, mood trends, relapse history
- **Installable PWA** — Add to home screen on iOS, Android, and desktop
- **Offline-First** — All data stored locally. Works without internet.

## Architecture

```
quitporn/
├── src/
│   ├── app/           # Next.js App Router pages + API routes
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Data layer (IndexedDB, encryption, auth, push)
│   └── data/          # Static data (techniques, blocklist)
├── supabase/
│   ├── migrations/    # Database schema
│   └── functions/     # Edge Functions (Web Push)
├── public/
│   ├── sw.js          # Service Worker (cache, blocklist, push)
│   ├── manifest.json  # PWA manifest
│   └── icons/         # App icons
└── ...
```

**Key design decisions:**
- **Local-first**: All user data (streak, journal, settings) stored in localStorage + IndexedDB. No server required for core features.
- **Zero-knowledge**: Journal encrypted client-side with AES-GCM-256. Encryption key never leaves the device.
- **Anonymous**: No email, no signup. One-click anonymous auth via Supabase.
- **PWA**: Installable on any platform. Works offline for cached pages.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database (client) | IndexedDB via `idb` |
| Database (server) | Supabase Postgres |
| Auth | Supabase Anonymous Auth + WebAuthn |
| Encryption | Web Crypto API (AES-GCM-256) |
| AI | OpenRouter (Llama 3.3 70B) |
| Push | VAPID Web Push |
| Payments | Paddle (optional) |

## Prerequisites

- Node.js 18+
- npm
- A Supabase project (free tier works)
- An OpenRouter API key (free tier available)
- VAPID keys for push notifications (optional)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd quitporn
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
# Supabase — create a project at https://supabase.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter — get a key at https://openrouter.ai/keys
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-your-key

# VAPID keys — generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

### 3. Run database migrations

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### 4. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy Supabase Edge Function (for push)

```bash
npx supabase functions deploy send-push
```

Set the VAPID secrets in Supabase dashboard:
```
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Add all environment variables from `.env.local`
4. Deploy

The PWA will be live at your Vercel URL. Test with Lighthouse to verify PWA score.

## Database Schema

The Supabase migration creates 6 tables:

- `profiles` — User settings and premium expiry
- `journal_entries` — Server-synced encrypted journal blobs
- `relapse_logs` — Anonymized pattern data
- `push_subscriptions` — Web Push endpoints
- `user_blocklist` — Custom blocked domains
- `recovery_milestones` — Milestone tracking

Apply migrations with:
```bash
npx supabase db push
```

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/push/subscribe` | POST | Save push subscription |
| `/api/push/subscribe` | DELETE | Remove push subscription |
| `/api/paddle/checkout` | POST | Create Paddle checkout URL |
| `/api/paddle/webhook` | POST | Handle Paddle subscription events |

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `NEXT_PUBLIC_OPENROUTER_API_KEY` | Yes | OpenRouter API key for AI autopsy |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | VAPID public key for push |
| `VAPID_PRIVATE_KEY` | No | VAPID private key (server-side) |
| `PADDLE_CLIENT_SIDE_TOKEN` | No | Paddle client token for checkout |

## License

Private. All rights reserved.
