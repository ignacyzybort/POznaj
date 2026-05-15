import { Scraper, ScrapedEvent } from "./base";
import axios from "axios";
import * as cheerio from "cheerio";
import { matchVenue } from "@/lib/venues";
import { districtFallback } from "./geocode";

const CAT_MAP: Record<string, string> = {
  kino: "Kino", film: "Kino",
  muzyka: "Muzyka", koncert: "Muzyka",
  teatr: "Teatr", spektakl: "Teatr",
  sztuka: "Sztuka", wystawa: "Sztuka", wernisaż: "Sztuka",
  sport: "Sport", bieg: "Sport",
  warsztaty: "Warsztaty", warsztat: "Warsztaty",
  konferencja: "Konferencje", wykład: "Konferencje",
  jedzenie: "Jedzenie", kulinaria: "Jedzenie",
};

// Category-based coordinate fallback — same approach as pikpoznan
const categoryVenues: Record<string, { address: string; district: string; lat: number; lon: number }[]> = {
  Muzyka: [
    { address: "Kościuszki 79", district: "Jezyce", lat: 52.413, lon: 16.900 },
    { address: "Bułgarska 17", district: "Jezyce", lat: 52.418, lon: 16.895 },
    { address: "Nowowiejskiego 8", district: "Jezyce", lat: 52.415, lon: 16.898 },
    { address: "Niepodległości 12", district: "Jezyce", lat: 52.410, lon: 16.895 },
    { address: "Święty Marcin 30", district: "Centrum", lat: 52.406, lon: 16.920 },
    { address: "Święty Marcin 80/82", district: "Centrum", lat: 52.408, lon: 16.919 },
    { address: "Fredry 9", district: "Centrum", lat: 52.409, lon: 16.928 },
    { address: "Półwiejska 42", district: "StareMiasto", lat: 52.403, lon: 16.926 },
  ],
  Teatr: [
    { address: "27 Grudnia 8/10", district: "StareMiasto", lat: 52.407, lon: 16.935 },
    { address: "Dąbrowskiego 5", district: "Centrum", lat: 52.407, lon: 16.930 },
    { address: "Św. Marcin 80/82", district: "Centrum", lat: 52.407, lon: 16.918 },
    { address: "Taczaka 8", district: "Centrum", lat: 52.405, lon: 16.925 },
  ],
  Kino: [
    { address: "Święty Marcin 30", district: "Centrum", lat: 52.406, lon: 16.920 },
    { address: "Półwiejska 42", district: "StareMiasto", lat: 52.403, lon: 16.926 },
  ],
  Sztuka: [
    { address: "Stary Rynek 6", district: "Centrum", lat: 52.407, lon: 16.934 },
    { address: "Wyspiańskiego 41", district: "Centrum", lat: 52.404, lon: 16.928 },
    { address: "Święty Marcin 40", district: "Centrum", lat: 52.407, lon: 16.921 },
    { address: "Wieniawskiego 1", district: "Centrum", lat: 52.406, lon: 16.927 },
  ],
  Inne: [
    { address: "Plac Wolności", district: "StareMiasto", lat: 52.407, lon: 16.928 },
    { address: "Stary Rynek", district: "StareMiasto", lat: 52.408, lon: 16.934 },
    { address: "Park Cytadela", district: "StareMiasto", lat: 52.430, lon: 16.938 },
    { address: "Malta", district: "NoweMiasto", lat: 52.398, lon: 16.960 },
  ],
};

function guessCategory(title: string, text: string): string {
  const lower = (title + " " + text).toLowerCase();
  for (const [key, val] of Object.entries(CAT_MAP)) {
    if (lower.includes(key)) return val;
  }
  return "Inne";
}

function relDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export class PoznanPlScraper implements Scraper {
  name = "poznanpl";

  async scrape(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];

    // Scrape next 7 days
    for (let day = 0; day < 7; day++) {
      const dateStr = relDate(day);
      let foundOnDay = 0;

      for (let offset = 0; offset < 40; offset += 10) {
        try {
          const res = await axios.get(
            `https://www.poznan.pl/mim/kultura/events/${dateStr},calendarPage.html?offset=${offset}&limit=10`,
            {
              headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                Accept: "text/html,application/xhtml+xml",
              },
              timeout: 15000,
            }
          );

          const $ = cheerio.load(res.data);
          let found = 0;

          $("[class*='event'], .calendar-event, .calendar-events-list > div, .events-list > div, .event-item, tr.event, .day-has-event, .day-has-events").each((_, el) => {
            const title = $(el).find("a, .title, .event-title, h3, h4").first().text().trim();
            if (!title || title.length < 3) return;

            const link = $(el).find("a").first().attr("href") || "";
            const fullLink = link.startsWith("http") ? link : `https://www.poznan.pl${link.startsWith("/") ? "" : "/"}${link}`;

            const text = $(el).text();
            const img = $(el).find("img").first().attr("src") || "";

            const startDate = new Date(dateStr);
            let endDate = new Date(dateStr);

            const timeMatch = text.match(/(\d{1,2})[.:](\d{2})/);
            const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : undefined;

            const placeMatch = text.match(/(?:miejsce|gdzie|venue)[:\s]+([^\n,]+)/i);
            let placeName = placeMatch ? placeMatch[1].trim() : "";

            // Fallback: find the best venue-like word in the text
            if (!placeName) {
              const tokens = text.split(/[\s,]+/);
              const knownVenues = ["CK Zamek", "Stary Browar", "Kino Muza", "Tama", "Blue Note", "MTP", "Cytadela", "Concordia", "POSiR", "Aula UAM", "Teatr Polski", "Teatr Wielki", "Filharmonia", "Estrada"];
              for (const v of knownVenues) {
                if (text.includes(v)) { placeName = v; break; }
              }
            }
            if (!placeName) placeName = "Poznań";

            // Match venue for district + coords
            const venue = matchVenue(placeName);
            const category = guessCategory(title, text);

            let district = venue?.district ?? "Inny";
            let coordsX: number | undefined = venue?.lat;
            let coordsY: number | undefined = venue?.lon;

            // District center fallback for unknown venues
            if (!coordsX) {
              const guess = district !== "Inny" ? district : "Centrum";
              const fallback = districtFallback(guess);
              coordsX = fallback.lat;
              coordsY = fallback.lon;
              district = fallback.district;
            }

            events.push({
              title,
              imageUrl: img.startsWith("http") ? img : undefined,
              sourceUrl: fullLink,
              startDate,
              endDate,
              time,
              placeName,
              district,
              category,
              vibes: ["Kulturalne"],
              source: "poznanpl",
              sourceId: `poznanpl-${Buffer.from(title).toString("base64").slice(0, 24)}-${dateStr}`,
              coordsX,
              coordsY,
            });
            found++;
            foundOnDay++;
          });

          if (found === 0) break;
        } catch {
          break;
        }
      }
      console.log(`[PoznanPl] ${dateStr}: ${foundOnDay} events`);
    }

    return events;
  }
}
