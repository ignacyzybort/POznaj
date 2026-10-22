import Supermemory from "supermemory";

const client = new Supermemory({ apiKey: process.env.SUPERMEMORY_API_KEY });

const docs = [
  {
    customId: "poznaj-auth",
    metadata: { domain: "auth", severity: "critical" },
    content: [
      "AUTH & API CONSTRAINTS (do not violate, verified 2026-10-22):",
      "1. CSRF middleware blocks POST/PUT/DELETE to /api/*. All client fetch calls MUST use getCsrfToken() from lib/csrf.ts which parses the httpOnly:false csrf-token cookie.",
      "2. Middleware must early-return for /api/auth and /api/cron routes. Both handle their own auth. Adding CSRF to them silently breaks OAuth callback flow and cron Bearer auth.",
      "3. Auth.js v5 beta silently breaks session persistence if you add an explicit session config block (strategy, maxAge) to auth.ts. Config must be: adapter + providers + callbacks + pages only.",
      "4. Email magic link: Resend provider with noreply@po-znaj.pl, verifyRequest page set to /login, signIn() awaited with redirect:false and error handling. Env var is AUTH_RESEND_KEY (not RESEND_API_KEY). Apple sign-in button removed from login UI.",
      "5. CRON_SECRET must be set and checked before Bearer comparison in /api/cron/recompute-scores. Returns 501 if missing, 401 if wrong. Cron endpoint bypasses CSRF middleware.",
      "6. REST route pattern: try/catch → typeof validation → auth() check → Prisma query → generic 500 error.",
      "7. SessionProvider in layout.tsx receives server-side session via async auth(), eliminating the loading window that broke Google OAuth onboarding redirect.",
    ].join("\n"),
  },
  {
    customId: "poznaj-schema",
    metadata: { domain: "schema" },
    content: [
      "SCHEMA & DATA MODEL (updated 2026-10-22):",
      "1. Notification has optional eventId → clickable in-app notifications (Link to /event/{id}). EVENT_SHARE and FRIEND_ATTENDING types. Push notifications include the event URL. onDelete: SetNull.",
      "2. Score engine: calculateBaseScore 0-60 (freshness tiers 7d=40, 21d=35, 60d=25, 180d=10 plus completeness 0-20 from image/description/time/address). calculateAttendanceScore 0-40 (6+=10, 21+=20, 101+=30, 501+=40). recomputeAllScores uses prisma.$transaction. Attendance POST and the scrape pipeline trigger recompute.",
      "3. ActivityType enum: GOING, SAVED only (REVIEWED removed). Attendance route creates activity records only for GOING/SAVED via finalStatus.",
      "4. Attendance has timeSlot for multi-seance events; @@unique([userId, eventId, timeSlot]) allows saving individual screening times. Lista shows timeSlot next to the title.",
      "5. SavedEvent table removed — SAVED status on Attendance is the single source of truth.",
      "6. UserChallenge model: challengeKey, tier, progress, maxProgress, done, completedAt, resetAt; @@unique([userId, challengeKey, resetAt]) enforces time-bound resets. Progress is upserted server-side on profile visit.",
      "7. User has preferredCategories String[] and preferredVibes String[] saved via PUT /api/user/preferences; consumed by getRecommendations() scoring.",
      "8. Friendship: senderId + receiverId, PENDING/ACCEPTED/REJECTED. REJECTED is persisted (row not deleted). Reverse-PENDING auto-accepts. Mutual friends via intersection; profile count uses accepted-only.",
      "9. TOCTOU double-tap attendance fixed: catches Prisma P2002/P2025 and returns success instead of 500.",
      "10. Budget filter uses where.AND (search + budget combined), not where.OR.",
      "11. Going count + friendsGoing serialized in events API; EventCard shows both plus an avatar stack.",
    ].join("\n"),
  },
  {
    customId: "poznaj-scrapers",
    metadata: { domain: "scrapers" },
    content: [
      "SCRAPER ARCHITECTURE (updated 2026-10-22):",
      "1. Active scrapers in run.ts: PikPoznan (JSON-LD, sub-events + screenings), KulturaPoznan (monthly pages, .dc-content HTML), PoznanCinema (poznan.pl/mim seances), MNP (mnp.art.pl), PUT (put.poznan.pl), plus FacebookScraper stub (needs FB_PAGE_ID + FB_ACCESS_TOKEN).",
      "2. poznanpl.ts remains in the tree but is NOT in run.ts — its calendar endpoint returned a JS-rendered empty shell. Dead file kept intentionally; do not re-enable without a new data source.",
      "3. Cinema: scrapes poznan.pl/mim/events/seances/YYYY-MM-DD for 7 days and groups screenings by film+cinema+date into one event with comma-separated times. ~695 events.",
      "4. MNP: mnp.art.pl wystawy-i-wydarzenia, ~34 events. PUT: calendar parsing currently yields 0 events — selectors still need tuning.",
      "5. TMDB posters: src/lib/tmdb.ts fetchMoviePoster() uses v3 auth via the api_key query param (NOT Bearer) and caches per unique film title. ~612/695 cinema events got real posters.",
      "6. Vibes: shared guessVibes()/guessVibesForCategory() in src/lib/vibes.ts; all scrapers assign vibes (~818/830 events). Multi-vibe per event is supported.",
      "7. Outdoor: detectOutdoor() in base.ts with word-boundary matching; ~20 events tagged. Exposed via the ?outdoor=true API param.",
      "8. Dedup: exact title+placeName → sourceId → containment → Jaccard >0.6 on same-day events. Twitter/x.com filtered at scraper level.",
      "9. Three-tier coords: matchVenue() → geocodeVenue(strips the 'ul.' prefix, Nominatim, Poznan bounds) → districtFallback() → pointInDistrict() GeoJSON ray-cast.",
      "10. saveEvents guard: never overwrite valid coords or district; both coordsX AND coordsY checked. District Inny skipped. calculateBaseScore wired into create/update data.",
      "11. Venue DB: 110 entries + 73 keyword fallbacks (all cinemas, museums, theatres, universities, parks, hotels). New venues auto-resolve via Nominatim.",
      "12. Data quality: decodeEntities, cleanTitle (Bilety suffix), cleanPlaceName, cleanDescription (splits at metadata boundary). Category: Muzyka checked before Teatr.",
      "13. Post-scrape: run.ts calls recomputeAllScores after all scrapers finish. Standalone npm run recompute-scores also exists.",
    ].join("\n"),
  },
  {
    customId: "poznaj-design",
    metadata: { domain: "design", severity: "critical" },
    content: [
      "DESIGN SYSTEM (permanent constraints, updated 2026-10-22):",
      "1. pz-* CSS classes only. Never Tailwind for production UI. Never raw hex — colors via CSS custom properties.",
      "2. 39 SVG icons in @/components/icons. Never emojis as structural icons.",
      "3. Corner radius: 22px cards, 18px art, 14px small controls.",
      "4. Polish UI throughout. Date helpers: plMidnight(Europe/Warsaw), relDay, fmtFullDate. Never English UI strings.",
      "5. Animations: ease-spring for transforms, ease-out-quart for opacity. dur-slow=400ms, dur-base=250ms, dur-fast=150ms.",
      "6. Multi-layer shadows with sage undertones (rgba 61,90,64 low opacity) plus a 0.5px white inner highlight. Dark mode adapts.",
      "7. Fluid typography via clamp() on all text size tokens. Desktop must never break from mobile changes.",
      "8. Fonts: Inter sans, Instrument Serif display, JetBrains Mono numbers.",
      "9. Wordmark: lowercase 'poznaj' with a sage-colored dot. Present in all 6 instances (home, profil, profil page, login, mapa, lista) plus favicon and PWA icons. The sage dot is a required brand element.",
      "10. Light-mode ink tokens: --ink-3 rgba(20,19,15,0.76), --ink-4 rgba(20,19,15,0.62). These are the readability floor — do not lower. Dark mode: --ink-3 0.78, --ink-4 0.58.",
      "11. A11y: sage focus-visible outlines, aria-labels on modals, error.tsx/not-found.tsx in Polish. --online-green token for live dots.",
    ].join("\n"),
  },
  {
    customId: "poznaj-ui-home",
    metadata: { domain: "ui/home" },
    content: [
      "HOME PAGE (updated 2026-10-22):",
      "1. Znajomi · idą section (old 'Blisko Ciebie') uses GET /api/friends/going, deduped by userId, subtitle 'idzie na {eventTitle}', no fake distances.",
      "2. Layout: TonightHero → Znajomi idą → BudgetChips → Surprise CTA → Polecane dla Ciebie rail → main event grid.",
      "3. Pagination: initial limit 50; infinite scroll via IntersectionObserver on a sentinel div; offset ref switches append/replace mode.",
      "4. Polecane: full-width section, CSS scroll-snap, wider cards min(312px, 85vw), symmetric 18px padding, no 'Zobacz wszystko' button.",
      "5. Equal card heights: title line-clamp 2, EventCard height:100% flex column, TiltCard/stagger wrappers height:100%. Main-grid tilt maxTilt=4 (Polecane keeps 12).",
      "6. Event cards: going count + friendsGoing avatar stack; multi-seance time chips are individually saveable via timeSlot.",
      "7. toggleSave never redirects; the user stays on the page with an inline toast.",
      "8. Outdoor filter: 'Na świeżym' chip → ?outdoor=true.",
      "9. Student filter: matches student price keywords (studen/ulgow/ulga) and title/desc keywords (juwenalia/akademicki/uczelnia). No free-price catch-all.",
      "10. Event detail: 'Powiadom mnie' reminder toggles on/off ('✔️ Ustawione' → off), client-side state only. iCal .ics download in the calendar popover.",
    ].join("\n"),
  },
  {
    customId: "poznaj-ui-map",
    metadata: { domain: "ui/map" },
    content: [
      "DISTRICT MAP (updated 2026-10-22):",
      "1. Dark background, canvas renderer, maxBounds to the Poznan area, minZoom 10.",
      "2. District polygons hue-coded; tooltip labels with event counts, var(--text-sm/xs) tokens.",
      "3. Floating event-card rail when a district is selected; all events shown (no 8-cap); scrollable popup with wider cards.",
      "4. Same-location events cluster into a count badge (dark circle); click expands into a spiral of category-colored markers; click again collapses.",
      "5. Rail padding clears the tab bar (90px + safe-b); back button positioned at 230px + safe-b.",
      "6. Markers and zoom controls are 44px touch targets; zoom controls sit bottom-right above the tab bar.",
      "7. Tiles lazy-load on district select; flyTo ~1.2s.",
      "8. Empty state: 'Brak wydarzeń w tej dzielnicy' pill with wordmark + clamp() heading.",
    ].join("\n"),
  },
  {
    customId: "poznaj-ui-profile",
    metadata: { domain: "ui/profile" },
    content: [
      "PROFILE PAGE (updated 2026-10-22):",
      "1. Two-column grid: left (challenges → activity stats → streak → tune-up → wrapped flex:1); right: passport.",
      "2. Friend button 4 states (add / sent / accept / friends); mutual friends as overlapping avatars; friend count from server, accepted-only.",
      "3. In-app notifications: full row clickable with arrow; 'Przeczytaj wszystkie' marks all read; bell badge updates via polling + notif-refetch event.",
      "4. Challenges 2.0: 15 challenges — 3 daily, 6 weekly, 5 monthly. Tabbed UI, tier badges bronze/silver/gold/diamond. Progress persisted in UserChallenge and upserted on profile visit.",
      "5. Wrapped: Spotify-style 7-slide auto-advancing modal, tap to skip, pz-slide-up animation. Data filtered to the current calendar year; real stats include monthly heatmap, category/vibe breakdown, top venue, streak.",
      "6. Passport booklet: burgundy #5C0A1E cover + grain texture, gold gradient text, spine. 3D page flip via CSS perspective + rotateY(-180deg), cream pages with SVG noise, oval ink stamps. Swipe/tap navigation.",
      "7. Passport card: miniature cover with gold emblem, 6 gold district dots (filled=visited), vertical 'POZNAJ' spine.",
      "8. Tune-up quiz: 4 questions → personalized feed; subtitle '4 pytania · odpalimy świeży feed'.",
      "9. Lista shows the saved timeSlot for multi-seance events.",
    ].join("\n"),
  },
  {
    customId: "poznaj-ui-tabbar",
    metadata: { domain: "ui/tabbar" },
    content: [
      "TAB BAR PILL (updated 2026-10-22):",
      "1. ResizeObserver remeasures the pill on resize/rotation; CSS left+width transitions with ease-spring.",
      "2. SSR-safe: percentage position (activeIdx*20%) until first measurement; measured flag gates opacity to prevent the initial flash.",
      "3. Floating depth: 0.5px white inset + soft drop shadow; dark mode adapts.",
      "4. Tabs: Dziś, Mapa, Plan, Lista, Ja. Hidden on /event/*, /login, /onboarding.",
      "5. Notification badge: AbortController fetch, 9+ overflow, polls every 10s and listens for the 'notif-refetch' custom event for instant updates. All notification POSTs include the CSRF token.",
    ].join("\n"),
  },
];

const strayIds = [
  "X7mBx5Fkv6pkxV4yMzbPz7",
  "n7BGuDzgn1vxtMq82W8G8M",
  "HQ5mwURPqbMA8pE9UBRbkT",
  "ErJvdyd8wJ2Q2ZwWn1PwdE",
  "XcrYbWWJ8SPaY1UjDLHvpe",
  "yHcj3yu4nRDpuqhMJwCKpU",
  "aFVmtBhi56V7y9rzrMukSp",
];

const existing = await client.documents.list({ containerTags: ["poznaj"], limit: 100 });
const idByCustomId = new Map(
  (existing.memories ?? []).filter((d) => d.customId).map((d) => [d.customId, d.id])
);

for (const doc of docs) {
  const id = idByCustomId.get(doc.customId);
  if (!id) {
    console.error(`missing doc for ${doc.customId}`);
    continue;
  }
  const result = await client.documents.update(id, {
    containerTag: "poznaj",
    metadata: doc.metadata,
    content: doc.content,
  });
  console.log(`updated ${doc.customId} (${id}) -> ${result.status}`);
  await new Promise((r) => setTimeout(r, 500));
}

for (const id of strayIds) {
  try {
    await client.documents.delete(id);
    console.log(`deleted stray ${id}`);
  } catch (e) {
    console.error(`failed to delete ${id}: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 300));
}

const list = await client.documents.list({ containerTags: ["poznaj"], limit: 100 });
const all = list.memories ?? [];
console.log(`\nTOTAL DOCS: ${all.length}`);
for (const d of all) {
  console.log(`  ${d.customId ?? "(none)"} | ${d.metadata?.domain ?? "?"} | ${d.status}`);
}
