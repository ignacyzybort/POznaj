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

export function getVenueSlug(placeName: string): string {
  const normalized = placeName.toLowerCase().trim();
  return PLACE_SLUG_MAP[normalized] ?? toSlug(normalized);
}
