export const VENUES: Record<string, { address: string; district: string; lat: number; lon: number }> = {
  "CK Zamek": { address: "Święty Marcin 80/82", district: "Centrum", lat: 52.408, lon: 16.919 },
  "Stary Browar": { address: "Półwiejska 42", district: "StareMiasto", lat: 52.403, lon: 16.926 },
  "Kino Muza": { address: "Święty Marcin 30", district: "Centrum", lat: 52.406, lon: 16.920 },
  "Teatr Polski": { address: "27 Grudnia 8/10", district: "StareMiasto", lat: 52.407, lon: 16.935 },
  "Teatr Nowy": { address: "Dąbrowskiego 5", district: "Centrum", lat: 52.407, lon: 16.930 },
  "Teatr Wielki": { address: "Fredry 9", district: "Centrum", lat: 52.409, lon: 16.928 },
  "Teatr Animacji": { address: "Św. Marcin 80/82", district: "Centrum", lat: 52.407, lon: 16.918 },
  "Polski Teatr Tańca": { address: "Taczaka 8", district: "Centrum", lat: 52.405, lon: 16.925 },
  "Blue Note": { address: "Kościuszki 79", district: "Jezyce", lat: 52.413, lon: 16.900 },
  "Klub B17": { address: "Bułgarska 17", district: "Jezyce", lat: 52.418, lon: 16.895 },
  "Klub Pod Minogą": { address: "Nowowiejskiego 8", district: "Jezyce", lat: 52.415, lon: 16.898 },
  "Tama": { address: "Niepodległości 12", district: "Jezyce", lat: 52.410, lon: 16.895 },
  "2progi": { address: "Kutrzeby 6", district: "Jezyce", lat: 52.414, lon: 16.892 },
  "MTP": { address: "Głogowska 14", district: "Grunwald", lat: 52.396, lon: 16.898 },
  "Sala Ziemi": { address: "Głogowska 14", district: "Grunwald", lat: 52.396, lon: 16.899 },
  "Aula UAM": { address: "Wieniawskiego 1", district: "Centrum", lat: 52.406, lon: 16.927 },
  "Aula Artis": { address: "Święty Marcin 40", district: "Centrum", lat: 52.407, lon: 16.922 },
  "Aula Nova": { address: "Święty Marcin 40", district: "Centrum", lat: 52.407, lon: 16.923 },
  "Cuba Libre": { address: "Wrocławska 21", district: "StareMiasto", lat: 52.405, lon: 16.935 },
  "Galeria Miejska Arsenał": { address: "Stary Rynek 6", district: "Centrum", lat: 52.407, lon: 16.934 },
  "Galeria Ego": { address: "Wyspiańskiego 41", district: "Centrum", lat: 52.404, lon: 16.928 },
  "Collegium Da Vinci": { address: "Kutrzeby 10", district: "Grunwald", lat: 52.397, lon: 16.895 },
  "CK Zamek - Sala Wielka": { address: "Święty Marcin 80/82", district: "Centrum", lat: 52.408, lon: 16.919 },
  "Scena Wspólna": { address: "Brandstaettera 1", district: "StareMiasto", lat: 52.425, lon: 16.940 },
  "Scena na Piętrze": { address: "Masztalarska 8", district: "StareMiasto", lat: 52.408, lon: 16.933 },
  "Teatr Ósmego Dnia": { address: "Ratajczaka 44", district: "StareMiasto", lat: 52.403, lon: 16.921 },
  "Park Cytadela": { address: "Aleja Armii Poznań", district: "StareMiasto", lat: 52.430, lon: 16.938 },
  "Scena nad Rusałką": { address: "Rusałka", district: "StareMiasto", lat: 52.432, lon: 16.928 },
  "Klub Dragon": { address: "Zamkowa 3", district: "StareMiasto", lat: 52.409, lon: 16.930 },
  "Zamek Cesarski": { address: "Św. Marcin 80/82", district: "Centrum", lat: 52.408, lon: 16.922 },
  "POSiR Rataje": { address: "Piłsudskiego 30", district: "NoweMiasto", lat: 52.380, lon: 16.963 },
  "POSiR Malta": { address: "Wiankowa 2", district: "NoweMiasto", lat: 52.401, lon: 16.960 },
  "Jezioro Strzeszyńskie": { address: "Kosowska", district: "StareMiasto", lat: 52.444, lon: 16.842 },
};

// Keywords → venue fallback for when venue name doesn't appear verbatim
const KEYWORD_VENUES: [string, string][] = [
  ["zamek", "CK Zamek"],
  ["stary browar", "Stary Browar"],
  ["muza", "Kino Muza"],
  ["teatr polski", "Teatr Polski"],
  ["teatr nowy", "Teatr Nowy"],
  ["teatr wielki", "Teatr Wielki"],
  ["teatr animacji", "Teatr Animacji"],
  ["blue note", "Blue Note"],
  ["klub b17", "Klub B17"],
  ["pod minogą", "Klub Pod Minogą"],
  ["mtp", "MTP"],
  ["sala ziemi", "Sala Ziemi"],
  ["aula uam", "Aula UAM"],
  ["aulą uam", "Aula UAM"],
  ["aula artis", "Aula Artis"],
  ["cuba libre", "Cuba Libre"],
  ["galeria miejska", "Galeria Miejska Arsenał"],
  ["arsenał", "Galeria Miejska Arsenał"],
  ["galeria ego", "Galeria Ego"],
  ["stary rynek", "Stary Rynek"],
  ["rynek łazarski", "Rynek Łazarski"],
  ["plac wolności", "Plac Wolności"],
  ["ostrów tumski", "Ostrów Tumski"],
  ["cytadela", "Park Cytadela"],
  ["malta", "Malta"],
  ["termy", "Termy Maltańskie"],
  ["stadion", "Enea Stadion"],
  ["arena", "Arena"],
  ["rusałka", "Scena nad Rusałką"],
  ["barak kultury", "Barak Kultury"],
  ["browar", "Stary Browar"],
  ["kino muza", "Kino Muza"],
  ["teatr animacji", "Teatr Animacji"],
  // JSON-LD name variants from pikpoznan.pl
  ["klub blue note", "Blue Note"],
  ["blue note poznań", "Blue Note"],
  ["klub b17", "Klub B17"],
  ["ck zamek poznań", "CK Zamek"],
  ["centrum kultury zamek", "CK Zamek"],
  ["zamek poznań", "CK Zamek"],
  ["kino muza poznań", "Kino Muza"],
  ["teatr polski poznań", "Teatr Polski"],
  ["teatr nowy poznań", "Teatr Nowy"],
  ["teatr wielki poznań", "Teatr Wielki"],
  ["aula uam poznań", "Aula UAM"],
  ["uniwersytet im. adama mickiewicza", "Aula UAM"],
  ["mtp poznań", "MTP"],
  ["międzynarodowe targi poznańskie", "MTP"],
  ["sala ziemi poznań", "Sala Ziemi"],
  ["stary browar poznań", "Stary Browar"],
  ["galeria malta", "Malta"],
  ["termy maltańskie", "Termy Maltańskie"],
  ["stadion poznań", "Enea Stadion"],
  ["stadion miejski", "Enea Stadion"],
  ["collegium da vinci", "Collegium Da Vinci"],
  ["klub b17", "Klub B17"],
  ["letnia strefa", "Klub B17"],
  ["klub pod minogą", "Klub Pod Minogą"],
  ["blue note poznań", "Blue Note"],
];

export function matchVenue(text: string): { address: string; district: string; lat: number; lon: number } | null {
  const lower = text.toLowerCase();

  // First try exact venue name match
  for (const [name, data] of Object.entries(VENUES)) {
    if (lower.includes(name.toLowerCase())) {
      return data;
    }
  }

  // Then try keyword match
  for (const [keyword, venueName] of KEYWORD_VENUES) {
    if (lower.includes(keyword)) {
      return VENUES[venueName] ?? null;
    }
  }

  return null;
}
