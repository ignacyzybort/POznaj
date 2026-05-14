# POznaj — agent guidelines

## Agent memory (Supermemory)
- **At session start**: `curl -s -X POST https://api.supermemory.ai/v4/search -H "Authorization: Bearer $SUPERMEMORY_API_KEY" -H "Content-Type: application/json" -d '{"q":"<relevant query>","containerTags":["poznaj"],"searchMode":"hybrid"}'` to load project context.
- **During session**: Save key decisions, gotchas, and state via `POST /v4/memories`. **Do this automatically** — batch memories every ~5 significant actions and always at session end. Do not wait for the user to ask.
- **At session end**: Always save a session summary with type "session_summary" covering what was done, what was decided, and any new gotchas discovered.
- Key in `.env`: `SUPERMEMORY_API_KEY`

## Build & dev
```bash
npm run dev        # dev server with Turbopack
npm run build      # prisma generate + next build (order matters!)
npm run scrape     # scrape events (uses tsx + dotenv/config)
npm run seed       # local DB seeding
```

## Framework quirks

- **Prisma v7 + Neon**: Uses `@prisma/adapter-neon` with connection string from `DATABASE_URL`.
  `prisma generate` must run before `next build` — it's in both `build` and `postinstall` scripts.
- **Next.js 16 + Turbopack**: The `@serwist/next` PWA plugin only works with webpack, not Turbopack.
  It's disabled in dev (`disable: process.env.NODE_ENV !== "production"`).
- **Leaflet SSR guard**: `react-leaflet` must be dynamically imported with `ssr: false`
  (`dynamic(() => import(...), { ssr: false })`). Direct import causes `window is not defined`.
- **TypeScript**: `noImplicitAny: false` (deliberate — Prisma v7 types cause false positives).
  The `scripts/` directory is excluded from type checking.

## Architecture

- **Branch workflow**: All changes go to `pre-prod` first, tested, then merged to `main` on approval.
- **CSS**: Uses `pz-*` utility classes (`.pz-card`, `.pz-chip`, `.pz-eyebrow`, `.pz-scroll`, `.pz-heat`,
  `.pz-tabbar`) defined in `globals.css`. Components use inline `style={}` objects referencing
  CSS variables (`var(--bg)`, `var(--ink)`, `var(--line)`). Not pure Tailwind.
- **Path aliases**: `@/*` maps to `./src/*`.
- **Auth**: Auth.js v5 via `@/lib/auth`, providers: Google, Apple, email magic link.
  Prisma adapter connects to User model.

## Key routes

| Path | Type | Purpose |
|------|------|---------|
| `/` | page | Home (event feed, hero, filters) |
| `/event/[id]` | page | Event detail overlay |
| `/mapa` | page | Interactive Poznań map (SVG districts → Leaflet) |
| `/plan` | page | 14-day calendar |
| `/lista` | page | Saved/Going event list |
| `/profil` | page | User profile (personalized) |
| `/user/[id]` | page | Public user profile |
| `/login` | page | Auth |
| `/onboarding` | page | First-run flow |
| `/settings` | page | Preferences |
| `/api/events` | API | Event listing with district/category/vibe filters |
| `/api/attendance` | API | Going/saved tracking |
| `/api/friends` | API | Friend system (send/accept/search) |
| `/api/notifications` | API | Notification inbox + accept/reject friends |
| `/api/user/preferences` | API | User profile CRUD |
| `/api/upload` | API | Image upload (Vercel Blob, public store) |
| `/api/weather` | API | OpenWeatherMap 5-day forecast proxy |
| `/api/auth/[...nextauth]` | API | Auth.js handlers |

## Scraper

- Two-pass: first scrapes listing pages, then follows individual event URLs for JSON-LD venue data.
- Batch concurrency: max 5 parallel requests during enrichment (avoids rate limiting).
- Venue matching via `src/lib/venues.ts` (40+ Poznań venues + keyword fallback).
- Description cleanup: `container.find("script, style, noscript, iframe").remove()` —
  **extract JSON-LD venue data BEFORE removing scripts**.

## Data

- PostgreSQL via **Neon** (serverless). Env: `DATABASE_URL`.
- User model has `handle`, `bio`, `image`, `coverImage`, `district` for personalization.
- Event model has `coordsX`, `coordsY` for map positions (assigned during scrape via category+venue matching).
- Multi-vibe support via `EventVibe` junction table.

## Vercel

- `@vercel/analytics` + `@vercel/speed-insights` active in root layout.
- Image uploads use Vercel Blob (public store, `access: "public"`).
- Environment variables must be set for both Production and Preview deployments.
