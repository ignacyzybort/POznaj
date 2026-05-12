# POznaj

**Co dziś w Poznaniu.** Event discovery platform for Poznań, Poland.

Find the most interesting events happening in Poznań — filtered by district, category, and vibe. Save events, see what friends are going to, and get personalized recommendations.

## Features

- **5 tabs**: Dziś (Home), Mapa (Map), Plan (Calendar), Lista (Saved/Going), Ja (Profile)
- **Event discovery**: Browse, search, and filter events by district, category, and vibe
- **Heat meter**: Visual popularity indicator for every event
- **Vibe Quiz**: Answer 4 questions to get personalized event recommendations
- **Surprise Me**: Random event picker (slot machine style)
- **Social**: Friend system, activity feed, going/saved tracking
- **Notifications**: Browser notification reminders for events
- **Passport**: District stamp collection gamification
- **Streak**: Weekly event-going streak tracking
- **Year in Review**: Annual event recap (Spotify Wrapped style)
- **Dark mode**: Full theme toggle
- **Scraped events**: Real events from pik.poznan.pl and poznan.pl

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS + custom CSS variables
- **Fonts**: Inter (sans), Instrument Serif (display), JetBrains Mono (mono)
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Prisma 7
- **Auth**: NextAuth.js v5 (Google, Apple, Email magic link)
- **Deployment**: Vercel

## Getting Started

```bash
npm install
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Auth.js secret (generate with `openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | For Google auth | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | For Google auth | Google OAuth client secret |
| `AUTH_APPLE_ID` | For Apple auth | Apple Services ID |
| `AUTH_APPLE_SECRET` | For Apple auth | Apple private key |
| `RESEND_API_KEY` | For email auth | Resend API key for magic links |
| `FB_PAGE_ID` | Optional | Facebook page ID for event scraping |
| `FB_ACCESS_TOKEN` | Optional | Facebook access token |

### Database

```bash
npx prisma db push   # Push schema to database
npx prisma generate  # Generate Prisma client
```

### Scrape Events

```bash
npm run scrape        # Scrape events from Poznań sources
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── api/          # API routes (events, auth, friends, attendance)
│   ├── event/        # Event detail page
│   ├── login/        # Auth page
│   ├── onboarding/   # First-run onboarding flow
│   ├── mapa/         # Map view
│   ├── plan/         # Calendar view
│   ├── lista/        # Saved/Going list
│   └── profil/       # User profile
├── components/       # React components
│   ├── event-card.tsx
│   ├── heat-meter.tsx
│   ├── event-art.tsx
│   ├── tonight-hero.tsx
│   ├── filters-sheet.tsx
│   ├── search-overlay.tsx
│   ├── vibe-quiz.tsx
│   ├── surprise-modal.tsx
│   └── ...
├── lib/              # Utilities, data, scraping
│   ├── scrapers/     # Event scrapers (pikpoznan, poznanpl, facebook)
│   ├── data.ts       # Constants and mock data
│   └── scoring.ts    # Interest scoring algorithm
└── generated/        # Generated Prisma types
```

## License

MIT
