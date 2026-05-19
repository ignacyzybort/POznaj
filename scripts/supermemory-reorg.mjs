import Supermemory from 'supermemory';

const client = new Supermemory({ apiKey: 'sm_DguiyMYbEunvdTxdAWHR3R_2FXYGSEpEBlyRcMApB4YHOrITN4rGJXYBwm2iEODOcLDIzEhVULNvdSHVlJxlJB9' });

// Step 1: Delete old doc
await client.documents.delete('jY5j5uZThebM3eJrnwZbtx');
console.log('1. Deleted old doc');

// Step 2: Seed 7 domain-grouped documents

const docs = [
  {
    customId: 'poznaj-auth',
    metadata: { domain: 'auth', severity: 'critical' },
    content: `AUTH & API CONSTRAINTS (do not violate):
1. CSRF middleware blocks POST/PUT/DELETE to /api/*. All client fetch calls MUST use getCsrfToken() from lib/csrf.ts which parses the httpOnly:false csrf-token cookie.
2. Middleware must early-return for /api/auth and /api/cron routes. Both handle their own auth. Adding CSRF to them silently breaks OAuth callback flow and cron Bearer auth.
3. Auth.js v5 beta silently breaks session persistence if you add explicit session config block (strategy, maxAge) to auth.ts. Config must be: adapter + providers + callbacks + pages only. Related: AUTH_RESEND_KEY naming.
4. Email magic link: Resend provider with noreply@po-znaj.pl, verifyRequest page set to /login for branded UX, signIn() awaited with redirect:false and error handling. AUTH_RESEND_KEY env var name (not RESEND_API_KEY).
5. CRON_SECRET env var must be set and checked before Bearer comparison in /api/cron/recompute-scores. Returns 501 if missing, 401 if wrong. Cron endpoint bypasses CSRF middleware.
6. REST route pattern: try/catch → typeof validation → auth() check → Prisma query → NextResponse generic 500 error. Related: saveEvents guard protects coords/district from scraper regression. Score recompute triggered by attendance POST.
7. SessionProvider in layout.tsx now receives server-side session via async auth() call, eliminating async loading window that broke Google OAuth onboarding redirect.`
  },
  {
    customId: 'poznaj-scrapers',
    metadata: { domain: 'scrapers' },
    content: `SCRAPER ARCHITECTURE:
1. Two active scrapers: PikPoznan (64 events, JSON-LD enrichment, sub-events + screenings parsers) and KulturaPoznan (12 monthly pages from kultura.poznan.pl, .dc-content HTML blocks, ul>li>strong titles, p body with Data/Miejsce/Więcej fields). FacebookScraper stub. poznanpl scraper removed — its calendar endpoint returned JS-rendered empty shell.
2. Dedup: exact title+placeName match → sourceId match → containment check (all tokens of shorter title in longer) → Jaccard similarity above 0.6 on same-day events. Twitter/x.com duplicates filtered at scraper level.
3. Three-tier coordinate resolution: matchVenue() in venues.ts → geocodeVenue() strips ul. prefix before Nominatim (free OSM, 1 req/sec, Poznan bounds validation) → districtFallback() with hardcoded district centers → pointInDistrict() ray-casts GeoJSON for geometric correction.
4. saveEvents guard: never overwrite valid coords or district. Both coordsX AND coordsY checked together. District Inny skipped. title/startDate/placeName/description now updatable in updateData. calculateBaseScore() from scoring.ts wired into createData/updateData.
5. Venue database: 46 entries in VENUES dict, 73 keyword fallbacks. New venues auto-resolve via Nominatim with zero code changes.
6. Data quality pipeline in saveEvents pre-processing: decodeEntities, cleanTitle (Bilety suffix removal), cleanPlaceName (strips junk suffixes), cleanDescription (splits at metadata boundary).
7. Category detection: Muzyka checks before Teatr (koncert w Teatrze = Muzyka). Post-enrichment category re-check using enriched description.`
  },
  {
    customId: 'poznaj-schema',
    metadata: { domain: 'schema' },
    content: `SCHEMA & DATA MODEL:
1. Notification model now has optional eventId field linked to Event (onDelete: SetNull). Enables clickable in-app notifications — profile wraps notification with eventId in Link to /event/{id}. Used for EVENT_SHARE and FRIEND_ATTENDING types. Push notifications via web-push also include event URL.
2. Score engine: calculateBaseScore returns 0-60 from freshness tiers (7d=40, 21d=35, 60d=25, 180d=10) plus completeness from 4 fields (image/description/time/address, 0-20). calculateAttendanceScore returns 0-40 from going count tiers (6+=10, 21+=20, 101+=30, 501+=40). recomputeAllScores uses prisma.$transaction batch UPDATE. Attendance POST triggers recomputeEventScore. Scores drive recommendations and sorting.
3. ActivityType enum: GOING, SAVED, REVIEWED. attendance route uses finalStatus for activity creation — only GOING and SAVED create activity records. INTERESTED does not. Previously had hardcoded GOING bug.
4. Friendship model: senderId + receiverId with PENDING/ACCEPTED/REJECTED status. Mutual friends via intersection of both users accepted friendships. Friend count on external profile uses accepted-only count, not sentFriendships. Friend button has 4 states.
5. Attendance model SAVED status overlaps with separate SavedEvent table — potential future consolidation.`
  },
  {
    customId: 'poznaj-ui-profile',
    metadata: { domain: 'ui/profile' },
    content: `PROFILE PAGE:
1. Two-column grid: left column (challenges → activity stats → streak card → tune-up quiz → POznaj wrapped with flex:1). Right column: passport stamp card. Wrapped button stretches its purple/pink gradient to fill remaining height matching passport height via flex:1.
2. Tune-up quiz button compact in-column: 38px gradient icon, label Tune-up, 4 pytania subtitle. Wrapped: stacked text Wrapped / Twoj 2026 / N wydarzen stats.
3. Friend button 4 states: null = Dodaj znajomego, PENDING_SENT = Zaproszenie wyslane, PENDING_RECEIVED = Zaakceptuj, ACCEPTED = Znajomi checkmark. Unfriend action on /api/friends.
4. Mutual friends: API intersection of accepted friendships, returns mutualFriendCount + mutualFriends (first 5 with id/name/image). Displayed as overlapping avatar chips with label.
5. In-app notifications clickable: if eventId exists, wrapped in Link. Friend requests have inline accept/reject buttons.
6. Onboarding gate loads from localStorage poznaj-onboarded flag, skips /onboarding /login /api paths.`
  },
  {
    customId: 'poznaj-ui-tabbar',
    metadata: { domain: 'ui/tabbar' },
    content: `TAB BAR PILL:
1. ResizeObserver on nav container remeasures pill on viewport resize/rotation.
2. CSS left and width transitions with ease-spring for smooth slide+morph between tabs.
3. SSR-safe init: percentage-based position (activeIdx * 20% for 5 tabs) until first measurement.
4. measured flag gates opacity — pill invisible (opacity:0) until .measured class sets opacity:1, preventing initial flash.
5. Floating depth via box-shadow: 0.5px white inset + 2px 8px rgba shadow. Dark mode: darker drops + lighter sage glow.
6. Single navRef with querySelector for active tab, replaced old 5 individual refs.
7. Notification badge on profile tab: fetched with AbortController, shows count with 9+ overflow.
8. Tab bar hidden on /event/*, /login, /onboarding paths. Tabs: Dzis, Mapa, Plan, Lista, Ja.`
  },
  {
    customId: 'poznaj-ui-home',
    metadata: { domain: 'ui/home' },
    content: `HOME PAGE:
1. Komponent Znajomi ida renamed from misleading Blisko Ciebie teraz. Uses GET /api/friends/going.
2. Friends/going API deduplicates by userId via Set, fetches up to 30 attendances, returns max 10 unique friends. Each entry has name, image, placeName, eventTitle.
3. Subtitle: idzie na {eventTitle} with fallback to placeName. No fake X min stad distances.
4. Event cards show going count from API serialization plus friendsGoing avatar stack.
5. toggleSave fix: removed if-isSaved guard so API call fires for both save and unsave.
6. getCsrfToken() imported from lib/csrf.ts — no more copy-pasted cookie parsing.
7. Clean home layout: TonightHero + Znajomi ida section → BudgetChips → Surprise CTA → Polecane dla Ciebie rail → main event grid.`
  },
  {
    customId: 'poznaj-design',
    metadata: { domain: 'design', severity: 'critical' },
    content: `DESIGN SYSTEM (permanent constraints):
1. pz-prefix CSS classes only (pz-card, pz-chip, pz-btn, pz-h, pz-eyebrow, pz-scroll). Never Tailwind utilities for new UI.
2. Colors via CSS custom properties: var(--ink), var(--bg), var(--sage), var(--hot), var(--bg-soft/--bg-elev), var(--ink-2/3/4). Never raw hex.
3. 38 SVG icons in @/components/icons. Never emojis as structural icons.
4. Corner radius: 22px cards, 18px art, 14px small controls.
5. Polish language throughout UI. Date helpers: plMidnight(Europe/Warsaw), relDay, fmtFullDate. Never English UI strings.
6. Animations: ease-spring (cubic-bezier 0.32,0.72,0,1) for transforms. ease-out-quart for opacity. dur-slow=400ms, dur-base=250ms, dur-fast=150ms.
7. Shadows multi-layer with sage undertones (rgba 61,90,64 low opacity) plus 0.5px white inner highlight. Dark mode adapts.
8. Fluid typography via clamp() on all text size tokens. Desktop zero-impact from mobile changes.
9. Fonts: Inter sans, Instrument Serif display, JetBrains Mono numbers.
10. Logo wordmark: Inter bold with sage dot, used on login/home/profile pages.`
  }
];

for (const doc of docs) {
  const result = await client.add({
    customId: doc.customId,
    containerTag: 'poznaj',
    entityContext: `POznaj Next.js event discovery PWA for Poznan, Poland. Domain group: ${doc.metadata.domain}. Related domains: auth, scrapers, schema, ui.`,
    metadata: doc.metadata,
    content: doc.content
  });
  console.log(`  Added: ${doc.customId} → ${result.id} (${result.status})`);
  await new Promise(r => setTimeout(r, 500));
}

// Verify
const list = await client.documents.list({ containerTags: ['poznaj'], limit: 20 });
console.log(`\n3. Total documents: ${list.pagination?.totalItems ?? list.memories.length}`);
list.memories.forEach(d => console.log(`   ${d.id.slice(0,12)} | ${d.metadata?.domain || '-'} | ${d.status}`));
