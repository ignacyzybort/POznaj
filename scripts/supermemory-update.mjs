import Supermemory from 'supermemory';

const client = new Supermemory({ apiKey: 'sm_DguiyMYbEunvdTxdAWHR3R_2FXYGSEpEBlyRcMApB4YHOrITN4rGJXYBwm2iEODOcLDIzEhVULNvdSHVlJxlJB9' });

const updates = [
  {
    customId: 'poznaj-auth',
    metadata: { domain: 'auth', severity: 'critical' },
    content: [
      'AUTH & API CONSTRAINTS (updated 2026-05-20):',
      '1. CSRF middleware blocks POST/PUT/DELETE to /api/*. Use getCsrfToken() from lib/csrf.ts — centralized utility, no more copy-pasted cookie parsing across 5 files.',
      '2. Middleware skips /api/auth and /api/cron routes. Cron endpoint uses Bearer auth (CRON_SECRET env var).',
      '3. Auth.js v5 beta breaks if session config block added. Config: adapter + providers + callbacks + pages only.',
      '4. EMAIL LOGIN WORKING: Resend provider with noreply@po-znaj.pl. Env var is AUTH_RESEND_KEY (not RESEND_API_KEY). verifyRequest: /login for branded UX. signIn() awaited with redirect:false + error handling. Apple sign-in button removed from login UI.',
      '5. CRON_SECRET guard: if env var missing -> 501. If Bearer mismatch -> 401. Cron endpoint bypasses CSRF middleware.',
      '6. Onboarding gate: SessionProvider receives server-side session via async auth() in layout.tsx — eliminates async loading window that broke Google OAuth redirect.',
      '7. REST pattern: try/catch -> typeof validation -> auth() -> Prisma -> 500 generic error.',
    ].join('\n')
  },
  {
    customId: 'poznaj-schema',
    metadata: { domain: 'schema' },
    content: [
      'SCHEMA & DATA MODEL (updated 2026-05-20):',
      '1. Notification has optional eventId -> clickable in-app notifications via Link to /event/{id}. EVENT_SHARE and FRIEND_ATTENDING types. Push via web-push with event URL.',
      '2. Score engine: calculateBaseScore 0-60 (freshness tiers + completeness). calculateAttendanceScore 0-40 (tiers: 6+/21+/101+/501+). recomputeAllScores uses prisma.$transaction batch. Attendance POST triggers recomputeEventScore.',
      '3. ActivityType enum: GOING, SAVED, REVIEWED. attendance route uses finalStatus — only GOING/SAVED create activity records (was hardcoded GOING bug, now fixed).',
      '4. TOCTOU race on double-tap attendance fixed — catches Prisma P2002 (duplicate create) and P2025 (record not found) -> returns success instead of 500.',
      '5. Budget filter in events API uses where.AND instead of spreading into where.OR. Search + budget now AND together, not conflated.',
      '6. Reverse-PENDING friendship: if B sent request to A and A sends to B -> auto-accepts. No duplicate PENDING rows.',
      '7. Friendship model with PENDING/ACCEPTED/REJECTED. Mutual friends via intersection. Friend count on profile uses accepted-only. Friend button has 4 states.',
      '8. Going count + friendsGoing in events API serialization. EventCard displays both. Avatar stack renders friend avatars.',
    ].join('\n')
  },
  {
    customId: 'poznaj-scrapers',
    metadata: { domain: 'scrapers' },
    content: [
      'SCRAPER ARCHITECTURE (updated 2026-05-20):',
      '1. PikPoznan (64 events, JSON-LD, sub-events + screenings) + KulturaPoznan (12 monthly pages, .dc-content HTML). FacebookStub. poznanpl removed (dead JS shell).',
      '2. Dedup: exact title+placeName -> sourceId -> containment -> Jaccard >0.6. Twitter/x.com filtered at scraper level.',
      '3. Three-tier coords: matchVenue() -> geocodeVenue(strips ul. prefix, Nominatim, Poznan bounds) -> districtFallback() -> pointInDistrict() GeoJSON ray-cast.',
      '4. saveEvents guard: coordsX AND coordsY both checked (was just coordsX, now fixed). District Inny skipped. title/startDate/placeName/description updatable. calculateBaseScore wired into createData/updateData.',
      '5. Post-scrape recompute: run.ts calls recomputeAllScores after all scrapers finish. Standalone npm run recompute-scores script also available.',
      '6. Venue DB: 46 entries + 73 keyword fallbacks. New venues auto-resolve via Nominatim.',
      '7. Category: Muzyka before Teatr (koncert w Teatrze = Muzyka). Post-enrichment re-check.',
    ].join('\n')
  },
  {
    customId: 'poznaj-design',
    metadata: { domain: 'design', severity: 'critical' },
    content: [
      'DESIGN SYSTEM (updated 2026-05-20 — comprehensive UI/UX audit, 100 of 104 issues fixed):',
      '1. pz-* CSS classes only. Colors via var(--ink/bg/sage/hot/bg-soft/bg-elev/ink-2/3/4). NEVER raw hex. NEVER Tailwind. 39 SVG icons (added SendIcon). NEVER emojis as structural icons.',
      '2. Core fixes: --ink-4 fixed (0.72->0.48, was same as --ink-3). Duplicate .pz-card-lift:hover removed (was killing translateY hover lift). --online-green token added for Nearby Now live dots.',
      '3. HEX PURGE: 35+ raw hex -> var(--c-*) in av-stack, nearby-now, data.ts, invite-modal, year-in-review. categoryColors source-of-truth now uses CSS vars.',
      '4. TAILWIND PURGE: 11 classNames -> inline styles in invite-modal, edit-profile, crop-modal.',
      '5. EMOJI->SVG: CloseIcon replaces close x everywhere. ArrowIcon replaces -> arrows. SendIcon replaces mail emoji.',
      '6. CORNER RADII standardized: tonight-hero 26->22, streak-card 6->8, passport 12->14, search-overlay 16+12->14, vibe-quiz 12->14, year-in-review 32->28.',
      '7. ANIMATION: raw 0.2s ease -> var(--dur-fast) var(--ease-out-quart) across 5 files. btn-ripple uses --dur-reveal.',
      '8. A11Y: focus-visible -> sage green. aria-label on 5 modal dialogs. Share-modal focus trap + 44px close + search label. error.tsx + not-found.tsx created (Polish).',
      '9. DATE: toLocaleDateString -> fmtFullDate in user/[id] and lista. District raw value -> label in plan.',
      '10. DEAD CODE: visuals.ts — removed 46 lines of unused Tailwind/emoji exports. DUR module marked deprecated.',
      '11. Corner radius: 22px cards, 18px art, 14px controls. Polish throughout. ease-spring for transforms, ease-out-quart for opacity. Fluid typography via clamp(). Inter/Instrument Serif/JetBrains Mono.',
    ].join('\n')
  },
  {
    customId: 'poznaj-ui-profile',
    metadata: { domain: 'ui/profile' },
    content: [
      'PROFILE PAGE (updated 2026-05-20):',
      '1. Two-column grid: left (challenges -> activity stats -> streak -> tune-up -> wrapped with flex:1). Right: passport.',
      '2. Tune-up nastroju button: 38px gradient icon, full name restored from main branch, subtitle "4 pytania · odpalimy swiezy feed".',
      '3. POznaj wrapped button: "POznaj wrapped / Twoj 2026 / N wydarzen · N dzielnic · N osob". Purple/pink gradient fills column via flex:1.',
      '4. Rich copy preserved — not stripped-down version. Same personality as main branch.',
      '5. Wordmark is span, user name is h1. Friend count from server (not capped friendsList.length).',
      '6. BellIcon and SparkIcon replace inline SVG tags. In-app notifications clickable when eventId present.',
      '7. Mutual friends: overlapping avatars + label. Friend button 4 states. Onboarding gate active.',
    ].join('\n')
  },
  {
    customId: 'poznaj-ui-home',
    metadata: { domain: 'ui/home' },
    content: [
      'HOME PAGE (updated 2026-05-20):',
      '1. Znajomi · ida (renamed from Blisko Ciebie · teraz). GET /api/friends/going deduplicates by userId. Shows "idzie na {eventTitle}". No fake distances.',
      '2. toggleSave fix: auto-redirect to /lista after save REMOVED. User stays on home page. Toast shown inline.',
      '3. getCsrfToken() imported from lib/csrf.ts. SendIcon SVG replaces emoji in event detail share button.',
      '4. Event cards: going count from API + friendsGoing avatar stack. TiltCard wrapper with stagger animation.',
      '5. onRemind UX fixed: removed fake immediate Notification(). Honest toast "Przypomnienie wlaczone".',
      '6. Clean home: TonightHero + Znajomi ida -> BudgetChips -> Surprise CTA -> Polecane dla Ciebie -> event grid.',
    ].join('\n')
  },
  {
    customId: 'poznaj-ui-tabbar',
    metadata: { domain: 'ui/tabbar' },
    content: [
      'TAB BAR PILL (updated 2026-05-20):',
      '1. ResizeObserver on nav container remeasures pill on viewport resize/rotation.',
      '2. CSS left + width transitions with ease-spring for slide+morph between tabs.',
      '3. SSR-safe: percentage-based position (activeIdx*20% for 5 tabs) until first measurement.',
      '4. measured flag gates opacity — invisible until .measured class sets opacity:1, preventing initial flash.',
      '5. Floating depth: box-shadow 0.5px white inset + 2px 8px rgba shadow. Dark mode: darker drops + lighter sage glow.',
      '6. Single navRef + querySelector replaces old 5 individual refs.',
      '7. Notification badge fetched with AbortController, shows count with 9+ overflow.',
      '8. Tabs: Dzis, Mapa, Plan, Lista, Ja. Hidden on /event/*, /login, /onboarding.',
    ].join('\n')
  },
  {
    customId: 'poznaj-ui-map',
    metadata: { domain: 'ui/map' },
    content: [
      'DISTRICT MAP (2026-05-20):',
      '1. Dark background, canvas renderer, maxBounds to Poznan area, minZoom 10.',
      '2. District polygons: HSL per-district hues. Tooltip labels with event counts, var(--text-sm/xs) tokens.',
      '3. Floating event card stack when district selected. +N indicator now focusable. Lazy-loaded images.',
      '4. Back button with safe-l (calc(14px + var(--safe-l))).',
      '5. Markers: category-colored circles, iconSize [44,44], touch target 44px.',
      '6. Zoom controls: 44px targets, project shadows. Horizontal scroll: touch-action pan-x.',
      '7. Tiles lazy-loaded on district select. flyTo with smooth easing 1.2s.',
      '8. Empty state: "Brak wydarzen w tej dzielnicy" pill. Wordmark + heading with clamp().',
    ].join('\n')
  }
];

for (const doc of updates) {
  const result = await client.add({
    customId: doc.customId,
    containerTag: 'poznaj',
    entityContext: 'POznaj Next.js event discovery PWA for Poznan. Session 2026-05-20 comprehensive work across all domains.',
    metadata: doc.metadata,
    content: doc.content
  });
  console.log('Updated:', doc.customId, '->', result.id);
  await new Promise(r => setTimeout(r, 500));
}

console.log('\nDone. 8 domain docs updated.');
