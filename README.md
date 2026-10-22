# POznaj

**Co dziś w Poznaniu.** Event discovery platform for Poznań, Poland.

Find the best events happening in Poznań — filtered by district, category, and vibe. Save events, see what friends are going to, get personalized recommendations, and share events with friends.

## Features

- **5 tabs**: Dziś (Home), Mapa (Map), Plan (Calendar), Lista (Saved/Going), Ja (Profile)
- **Event discovery**: Browse, search, and filter by district, category, vibe, budget, date, and outdoor. 50 events per page with infinite scroll
- **Interactive map**: GeoJSON district polygons → Leaflet per-district view with category-colored markers, count-badge clusters that expand into a spiral
- **Score engine**: Real-time freshness + completeness + attendance popularity scoring, drives recommendations
- **Social**: Friends, friend requests, mutual friends, activity feed, going/saved tracking
- **In-app sharing**: Send events to friends — creates notification + push alert
- **Push notifications**: Web Push API (VAPID) for friend activity and event reminders
- **Notifications**: Clickable in-app notifications (links directly to events), mark-all-read, live badge
- **Email magic link**: Resend provider, branded UX, error handling
- **Vibe Quiz**: 4 questions → personalized event recommendations
- **Surprise Me**: Random event picker (slot machine with spring animations)
- **Heat meter**: Animated waveform popularity indicator
- **Per-time saves**: Multi-seance events (cinema) save individual screening times
- **Calendar export**: Download any event as an `.ics` file
- **Venue pages**: `/miejsca/[slug]` with upcoming events, district and category tags
- **Challenges**: 15 daily/weekly/monthly challenges with DB-persisted progress and tier badges
- **Passport**: Interactive 3D district-stamp booklet with swipe/tap page flips
- **Streak**: Weekly event-going tracking
- **POznaj Wrapped**: Spotify-style 7-slide year in review
- **Dark mode**: Full theme toggle
- **PWA**: Installable, offline support, push notifications
- **Real events**: Scraped from PIK Poznań, Kultura Poznań, poznan.pl cinema, Muzeum Narodowe, and PUT — with venue geocoding, TMDB posters, and vibe tagging

## Tech Stack

- **Frontend**: Next.js 16 (App Router + Turbopack), React 19, TypeScript
- **Styling**: pz-* CSS design system (custom properties + CSS animations). No Tailwind.
- **Fonts**: Inter (sans), Instrument Serif (display), JetBrains Mono (mono)
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Prisma 7
- **Auth**: NextAuth.js v5 (Google, Email magic link via Resend)
- **Maps**: Leaflet + OpenStreetMap
- **Scraping**: Axios + Cheerio (pik.poznan.pl, kultura.poznan.pl, poznan.pl cinema, mnp.art.pl, put.poznan.pl) + TMDB posters
- **Push**: web-push + VAPID + service worker
- **Animation**: motion library (page transitions), CSS keyframes (micro-interactions)
- **Deployment**: Vercel (auto-deploy from GitHub)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Auth.js secret (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | For Google auth | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | For Google auth | Google OAuth client secret |
| `AUTH_RESEND_KEY` | For email auth | Resend API key for magic links |
| `AUTH_APPLE_ID` | For Apple auth | Apple Services ID |
| `AUTH_APPLE_SECRET` | For Apple auth | Apple private key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | For push notifications | VAPID public key |
| `VAPID_PRIVATE_KEY` | For push notifications | VAPID private key |
| `VAPID_SUBJECT` | For push notifications | `mailto:...` for VAPID |
| `CRON_SECRET` | For scores | Secret for `/api/cron/recompute-scores` |
| `WEATHER_API_KEY` | Optional | OpenWeatherMap API key |
| `FB_PAGE_ID` | Optional | Facebook page ID for scraping |
| `FB_ACCESS_TOKEN` | Optional | Facebook access token |
| `SUPERMEMORY_API_KEY` | Optional | Supermemory agent memory |

### Database

```bash
npx prisma db push   # Push schema to database
npx prisma generate  # Generate Prisma client
```

### Scrape Events

```bash
npm run scrape           # Scrape events + auto-recompute scores
npm run recompute-scores # Recompute scores standalone
```

## Design System

The app uses a **pz-*** CSS design system — no Tailwind utilities for production UI. All colors, shadows, spacing, and typography flow through CSS custom properties.

| Token | Examples |
|-------|---------|
| Colors | `var(--ink)`, `var(--bg)`, `var(--sage)`, `var(--hot)`, `var(--bg-soft)`, `var(--bg-elev)` |
| Shadows | `var(--shadow-sm/md/lg)` — multi-layer with sage undertones |
| Animation | `var(--ease-spring)`, `var(--ease-out-quart)`, `var(--dur-fast/base/slow)` |
| Typography | `var(--text-xs)` through `var(--text-3xl)` — fluid `clamp()` |
| Radius | Cards 22px, art 18px, small controls 14px |
| Icons | 39 SVG components in `@/components/icons` — never emojis |

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── api/              # Route handlers
│   │   ├── cron/         # Score recompute (CRON_SECRET)
│   │   ├── share/        # In-app event sharing
│   │   ├── friends/      # Friends + going endpoint
│   │   └── ...
│   ├── event/[id]/       # Event detail
│   ├── miejsca/[slug]/   # Venue detail
│   ├── user/[id]/        # External profile
│   ├── profil/           # Own profile
│   ├── mapa/             # Map view
│   ├── plan/             # Calendar
│   ├── lista/            # Saved/Going list
│   ├── login/            # Auth page
│   └── onboarding/       # First-run wizard
├── components/           # React components (35+)
│   ├── tab-bar.tsx       # Bottom nav with sliding pill
│   ├── share-modal.tsx   # Send event to friend
│   ├── nearby-now.tsx    # "Znajomi · idą" rail
│   ├── district-map.tsx  # Leaflet map wrapper
│   ├── passport-*.tsx    # 3D passport booklet + card
│   ├── year-in-review.tsx # Wrapped slides
│   └── ...
├── lib/                  # Utilities
│   ├── scrapers/         # pikpoznan, kultura-poznan, cinema-poznan, mnp, put, facebook
│   ├── scoring.ts        # Event scoring algorithm
│   ├── tmdb.ts           # Movie poster lookup (v3 api_key)
│   ├── vibes.ts          # Shared vibe assignment
│   ├── challenges.ts     # 15 challenge definitions
│   ├── push.ts           # Web push notification sender
│   ├── csrf.ts           # CSRF token helper
│   ├── auth.ts           # NextAuth config
│   └── ...
├── hooks/                # React hooks (focus trap, escape)
└── scripts/              # seed, recompute-scores, supermemory
```

## License

MIT
