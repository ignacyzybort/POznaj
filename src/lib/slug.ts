export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9ąćęłńóśźż-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const PLACE_SLUG_MAP: Record<string, string> = {
  "ck zamek": "ck-zamek",
  "ck zamek - sala wielka": "ck-zamek",
  "stary browar": "stary-browar",
  "kino muza": "kino-muza",
  "teatr polski": "teatr-polski",
  "teatr nowy": "teatr-nowy",
  "teatr wielki": "teatr-wielki",
  "teatr animacji": "teatr-animacji",
  "polski teatr tańca": "polski-teatr-tanca",
  "blue note": "blue-note",
  "klub b17": "klub-b17",
  "klub pod minogą": "klub-pod-minoga",
  "tama": "tama",
  "2progi": "2progi",
  "mtp": "mtp",
  "sala ziemi": "sala-ziemi",
  "aula uam": "aula-uam",
  "aula artis": "aula-artis",
  "aula nova": "aula-nova",
  "cuba libre": "cuba-libre",
  "galeria miejska arsenał": "galeria-miejska-arsenal",
  "galeria ego": "galeria-ego",
  "collegium da vinci": "collegium-da-vinci",
  "scena wspólna": "scena-wspolna",
  "scena na piętrze": "scena-na-pietrze",
  "teatr ósmego dnia": "teatr-osmego-dnia",
  "park cytadela": "park-cytadela",
  "scena nad rusałką": "scena-nad-rusalka",
  "klub dragon": "klub-dragon",
  "zamek cesarski": "zamek-cesarski",
  "posir rataje": "posir-rataje",
  "posir malta": "posir-malta",
  "jezioro strzeszyńskie": "jezioro-strzeszynskie",
  "enea stadion": "enea-stadion",
  "kino apollo": "kino-apollo",
  "port lotniczy poznań ławica": "port-lotniczy-poznan-lawica",
  "malta": "malta",
  "termy maltańskie": "termy-maltanskie",
  "arena": "arena",
  "stary rynek": "stary-rynek",
  "rynek łazarski": "rynek-lazarski",
  "plac wolności": "plac-wolnosci",
  "ostrów tumski": "ostrow-tumski",
  "barak kultury": "barak-kultury",
  "filharmonia poznańska": "filharmonia-poznanska",
  "pawilon": "pawilon",
  "meskalina": "meskalina",
  "dom tramwajarza": "dom-tramwajarza",
  "scena robocza": "scena-robocza",
  "kontenerart": "kontenerart",
  "nocny targ towarzyski": "nocny-targ-towarzyski",
  "muzeum narodowe": "muzeum-narodowe",
  "brama poznania": "brama-poznania",
  "rogalowe muzeum": "rogalowe-muzeum",
};

// Exact placeName overrides for venues whose name contains punctuation that
// cannot survive the slug→search round-trip (dashes, pipes, slashes, "im.",
// HTML entities left in scraped data, non-breaking spaces). toSlug() collapses
// those runs, so the reverse search string no longer matches the stored
// placeName and the venue page would silently show zero events.
// Keys are the exact lowercased/trimmed placeName as stored in the DB.
const PLACE_NAME_OVERRIDES: Record<string, string> = {
  "aula artis – collegium da vinci": "aula-artis-collegium-da-vinci", // 6 upcoming events
  "cinema city poznań - kinepolis": "cinema-city-poznań-kinepolis", // 79 upcoming events
  "cinema city poznań - plaza": "cinema-city-poznań-plaza", // 66 upcoming events
  "dom kultury &#8222;orle gniazdo&#8221;": "dom-kultury-8222orle-gniazdo8221", // 1 event
  "fancy cocktail, food &#038; party": "fancy-cocktail-food-038-party", // 2 events
  "kino helios | poznań": "kino-helios-poznań", // 1 event
  "międzynarodowe targi poznańskie – sala ziemi – pawilon 2 – hala 3a": "międzynarodowe-targi-poznańskie-sala-ziemi-pawilon-2-hala-3a", // 5 events
  "muzeum sztuk użytkowych w\u00a0zamku": "muzeum-sztuk-użytkowych-w-zamku", // 12 events
  "muzyka na nowo / muchos": "muzyka-na-nowo-muchos", // 2 events
  "stary browar | park starego browaru | galeria na dziedzińcu": "stary-browar-park-starego-browaru-galeria-na-dziedzińcu", // 2 events
  "słodownia | pub": "słodownia-pub", // 1 event
  "tama | klub": "tama-klub", // 5 events
  "teatr nowy im. izabelli cywińskiej w poznaniu": "teatr-nowy-im-izabelli-cywińskiej-w-poznaniu", // 1 event
  "teatr wielki – opera w poznaniu": "teatr-wielki-opera-w-poznaniu", // 1 event
  "w_sercu": "wsercu", // 1 event
  "wieża\u00a0zegarowa ck zamek": "wieża-zegarowa-ck-zamek", // 1 event
  "x-demon poznań": "x-demon-poznań", // 2 events
  "zamek cesarski w poznaniu – ck zamek w poznaniu": "zamek-cesarski-w-poznaniu-ck-zamek-w-poznaniu", // 1 event
};

export function getVenueSlug(placeName: string): string {
  const normalized = placeName.toLowerCase().trim();
  return PLACE_NAME_OVERRIDES[normalized] ?? PLACE_SLUG_MAP[normalized] ?? toSlug(normalized);
}

const SLUG_TO_SEARCH: Record<string, string> = {};
for (const [name, slug] of Object.entries(PLACE_SLUG_MAP)) {
  if (!SLUG_TO_SEARCH[slug] || name.length < SLUG_TO_SEARCH[slug].length) {
    SLUG_TO_SEARCH[slug] = name;
  }
}
// Exact overrides win: for these slugs only the full stored placeName is a
// valid `contains` match, so the shorter canonical mapping must not shadow it.
for (const [name, slug] of Object.entries(PLACE_NAME_OVERRIDES)) {
  SLUG_TO_SEARCH[slug] = name;
}

// Next.js App Router hands over dynamic route params still percent-encoded
// (e.g. "cinema-city-pozna%C5%84-kinepolis" for a slug containing "ń").
// Venue slugs may contain Polish diacritics, so always decode before lookup —
// without this every /miejsca/<slug> with a diacritic rendered an empty page.
function decodeSlugParam(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug; // malformed %-escape: treat as already decoded
  }
}

export function getVenueSearch(slug: string): string {
  const decoded = decodeSlugParam(slug);
  return SLUG_TO_SEARCH[decoded] ?? decoded.replace(/-/g, " ").trim();
}

export function getVenueLabel(slug: string): string | null {
  const name = SLUG_TO_SEARCH[decodeSlugParam(slug)];
  if (!name) return null;
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
}
