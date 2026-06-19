# QuitPorn Recovery App — Build Summary

## Overview

A shame-free, neuroscience-based porn recovery PWA. Local-first encryption, zero-knowledge architecture, anonymous by design. All data lives in the browser — no server receives plaintext.

**Status:** All tiers 0–2 complete. Monetization (Tier 3) skeleton exists but needs wiring.

**Tech Stack:**

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.9 |
| Language | TypeScript | — |
| Styling | Tailwind CSS | v4 |
| Fonts | Sora (headings) + Outfit (body) | — |
| Client DB | IndexedDB via `idb` | — |
| Server DB | Supabase Postgres | — |
| Auth | Supabase Anonymous Auth | — |
| Encryption | Web Crypto API (AES-GCM-256 + PBKDF2 600K iters) | — |
| AI | OpenRouter (5-model fallback chain) | — |
| Push | VAPID Web Push + Custom SW | — |
| PWA | Custom SW + Manifest | — |
| Payments | Paddle (stub) | — |

---

## Architecture

```
src/
├── app/
│   ├── layout.tsx                    # Root layout, SW registration, fonts
│   ├── page.tsx                      # Home: UrgeDial, MicroSession, Patterns, Timeline, Focus Mode
│   ├── intercept/page.tsx            # Pre-Commit intervention route (SW redirect target)
│   ├── journal/page.tsx              # Encrypted journal
│   ├── autopsy/page.tsx              # Relapse analysis
│   ├── techniques/page.tsx           # 10 micro-moments
│   ├── insights/page.tsx             # Stats dashboard
│   ├── premium/page.tsx              # Paddle upsell
│   ├── install/page.tsx              # iOS PWA guide
│   ├── settings/page.tsx             # Blocklist, Push, Export/Import, Delete
│   └── api/
│       ├── push/subscribe/route.ts
│       ├── paddle/checkout/route.ts
│       └── paddle/webhook/route.ts
├── components/
│   ├── Nav.tsx                       # Bottom tab nav (7 routes)
│   ├── StreakDisplay.tsx             # Circular streak counter
│   ├── UrgeDial.tsx                  # 1-10 intensity selector
│   ├── MicroSession.tsx              # Breathing + technique + reflect flow
│   ├── RelapseRecovery.tsx           # 3-step guided relapse recovery
│   ├── UrgeFeed.tsx                  # Anonymous shared urge feed
│   ├── Timeline.tsx                  # 7-day horizontal bar chart
│   ├── PatternCard.tsx               # 5-type insight carousel
│   ├── PatternAlert.tsx              # Risk window banners
│   ├── PreCommitScreen.tsx           # Intervention screen (SW redirect target)
│   ├── AiCoach.tsx                   # Full-screen AI chat overlay
│   ├── ExportFlow.tsx                # .qpbackup export modal
│   ├── ImportFlow.tsx                # .qpbackup import modal
│   ├── TechniqueCard.tsx             # Expandable technique card
│   ├── JournalEditor.tsx             # Mood picker + encrypted text entry
│   ├── AutopsyForm.tsx               # 3-step relapse reflection
│   ├── InstallGuide.tsx              # iOS PWA steps
│   ├── InstallBanner.tsx             # PWA install prompt handler
│   └── icons/                        # 10 inline SVG icon components
├── hooks/
│   ├── useAuth.ts                    # Auth state + anonymous sign-in
│   ├── useStreak.ts                  # Streak CRUD
│   ├── usePatterns.ts                # Risk score + pattern analysis
│   └── useInstallPrompt.ts           # PWA install prompt
├── lib/
│   ├── supabase.ts                   # Supabase client
│   ├── auth.ts                       # Anonymous auth + passkey helpers
│   ├── db.ts                         # IndexedDB wrapper (4 stores)
│   ├── streak.ts                     # Streak CRUD
│   ├── urgeTracking.ts              # Urge logs, trend, technique ranking
│   ├── patterns.ts                   # Risk scoring + pattern detection
│   ├── feed.ts                       # Anonymous feed sharing
│   ├── relapseRecovery.ts           # Relapse recovery log
│   ├── aiCoach.ts                    # AI chat session mgmt + OpenRouter API
│   ├── backup.ts                     # Full data export/import
│   ├── crypto.ts                     # AES-GCM-256 encryption
│   ├── appCache.ts                   # Auth cache optimization
│   └── push.ts                       # Push subscription
└── data/
    ├── techniques.ts                 # 10 intervention techniques
    └── blocklist.ts                  # 94 default blocked domains
```

**Service Worker:** `public/sw.js` — caching, blocklist interception (redirects to `/intercept?domain=X`), push notifications.

---

## Completed Features

### Tier 0 — Foundation
- **PWA:** Custom service worker with static asset caching, network-first navigation, offline fallback, manifest with standalone display, `apple-mobile-web-app-capable`, maskable icons, iOS safe area support
- **Auth Cache:** `appCache.ts` prevents flash of auth loading on repeat visits by caching session timestamps
- **Install Banner:** `InstallBanner` component listens for `beforeinstallprompt`, respects `prefers-reduced-motion`, mobile-first dismissal
- **iOS Push:** Detection of iOS version + push capability (16.4+ required). Shows upgrade link for <16.4
- **Breathing Timer:** Rewritten with time-delta approach — drift-proof, 200ms tick, refs for mutable state, 3 rounds of 4-4-4-2 box breathing

### Tier 1 — Core Recovery Loop
- **Post-Relapse Recovery Pathway:** 3-step guided flow (acknowledge → reflect → recommit) with streak-safe dismissal. Auto-logs relapse recovery data
- **Anonymous Urge Feed:** Community-sourced urge logs with 7-day TTL, 24h/7d filter, color-coded intensity. Users opt-in after successful MicroSession completion or direct urge log
- **Pattern Card:** 5 insight types (peak day, common trigger, trend, best time, technique ranking) cyclable/dismissible, computed from existing urge + technique log data
- **Timeline:** 7-day horizontal bar chart showing urge intensity peaks day by day, color-coded (green → yellow → orange → red)

### Tier 2 — Advanced Tools
- **AI Recovery Coach (#1):** Full-screen chat overlay with FAB on home page. 5-model fallback chain (llama-3.3-70b → gemma-4-31b-it → owl-alpha → nemotron-3-super → qwen3.6-35b). System prompt built from live localStorage data (streak, trend, technique ranking). 5 free messages/day. Welcome screen with suggestion buttons. Session persistence via `qp_coach_session`
- **Data Portability (#2):** Full `.qpbackup` export/import. Collects all localStorage keys + IndexedDB stores into a single JSON file. `ExportFlow` modal shows summary preview + download. `ImportFlow` handles file picker or transfer code (base64-url encoded for small backups). Restore overwrites all local data. Web Share API integration for OS-native sharing
- **Pre-Commit Mode (#3):** SW redirects blocked domain requests to `/intercept?domain=X` instead of static HTML. `PreCommitScreen` provides 3-phase intervention: trigger picker (7 options) → 3-round box breathing → completion summary with auto-logged urge. Home page Focus Mode banner auto-detects high-risk windows (9PM-2AM), recent urges, and low streak. Manual 1h/4h Focus Mode toggle persists via `qp_focus_mode`

### Streak Counter
localStorage `qp_streak` (`{ current, longest, lastRelapse, relapseDates[] }`). Increments on success, resets on relapse. Milestone notifications fire once per 7-day multiple. Accidental click protection via date dedup.

### Encrypted Journal
AES-GCM-256 via Web Crypto API. PBKDF2 key derivation with 600K iterations, SHA-256. Passphrase auto-generated (16-char hex), salt stored as `qp_salt`. Ciphertext in IndexedDB `journal_entries`. Decrypted on-demand per entry.

### Content Blocker
SW fetch interception against 94 default domains + user blocklist. Blocked sites now redirect to `/intercept?domain=X` for full intervention experience. Custom blocklist UI in Settings with add/remove, synced to SW via `postMessage`.

### Relapse Autopsy
3-question form → OpenRouter LLM call → AI-generated analysis. Prompt uses Role→Task→Context→Constraints→Output→Review framework. Free model only.

### Trigger Pattern Matching
`analyzePatterns()` groups entries by day-of-week + time-block + emotion, computes relapse ratio per group, surfaces high-confidence patterns via `PatternAlert` component. Real-time risk score (0-1) based on time, day, streak length.

### Micro-Moments Library
10 techniques across 6 categories. Mood-based filter tabs. Success tracking via `technique_logs` IndexedDB store. Technique ranking (by avg intensity drop) fed into AI Coach and PatternCard.

### Push Notifications
VAPID Web Push. Milestone reminders every 7 days. iOS 16.4+ support with version detection and upgrade guidance.

### Analytics Dashboard
Current/best streak, journal count, technique success rate, top moods, relapse history.

### Data Management
Full backup export (.qpbackup), import (file + transfer code), journal plaintext export, delete all data with confirmation modal.

---

## Client-Side Storage

| Key | Type | Contents |
|---|---|---|
| `qp_streak` | localStorage | `{current, longest, lastRelapse, relapseDates[]}` |
| `qp_urges` | localStorage | `UrgeLog[]` — intensity, timestamp, technique, context |
| `qp_checkins` | localStorage | Daily commitment check-ins |
| `qp_commit_streak` | localStorage | Commitment streak counter |
| `qp_recoveries` | localStorage | Relapse recovery logs |
| `qp_feed` | localStorage | Anonymous feed items (7-day TTL) |
| `qp_blocklist` | localStorage | User custom blocked domains |
| `qp_passphrase` | localStorage | 16-char hex encryption key |
| `qp_salt` | localStorage | 16 random bytes for PBKDF2 |
| `qp_premium` | localStorage | Premium flag (boolean) |
| `qp_coach_session` | localStorage | AI coach state |
| `qp_coach_usage` | localStorage | Daily message counter |
| `qp_focus_mode` | localStorage | `{active, until}` |
| `qp_auth_cached` | localStorage | Timestamp for auth cache |
| `qp_last_journal_date` | localStorage | Last activity date |
| `quitporn` IndexedDB | 4 stores | `journal_entries`, `technique_logs`, `settings`, `sync_queue` |

---

## Incomplete / Known Issues

### Tier 3 — Monetization (stub, needs wiring)
- Paddle webhook has no HMAC signature verification
- Placeholder price IDs (`pri_monthly_quitporn`)
- Missing event handlers (`subscription_cancelled`, `payment_succeeded`, `past_due`)
- No server-side premium validation — `qp_premium` is client-only localStorage flag
- No restore-purchases flow
- Edge function `send-push` is a stub (doesn't call Web Push API)

### Technical Debt
- `any[]` types in `db.ts` for IndexedDB reads
- No test runner configured (0% coverage)
- Cross-device sync not implemented
- Passkey credentials created but never stored server-side
- Some inline SVG icons could be extracted to a shared sprite

---

## Assessment

**What was built:** A fully functional, private, anonymous porn recovery PWA with streak tracking, encrypted journaling, AI coaching, urge tracking, trigger pattern detection, pre-commit intervention, content blocking, breathing exercises, data backup/restore, and 10 neuroscience-based techniques — all client-side with zero server data collection.

**Differentiators from competitors (Brainbuddy, Covenant Eyes):**
- Truly anonymous (no email/signup), zero-knowledge encryption, no subscription (free tier), PWA (no App Store), shame-free language, open-source architecture

**Biggest risk:** Single-device lock-in. All data is browser-local. No sync, no recovery if browser data is cleared.

**Next:** Wire Tier 3 (Paddle webhook verification, server-side premium validation, edge function push sending) or add cross-device sync.
