import { Scraper, ScrapedEvent } from "./base";
import axios from "axios";
import * as cheerio from "cheerio";

export class PoznanPlScraper implements Scraper {
  name = "poznanpl";

  async scrape(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];

    for (let offset = 0; offset < 40; offset += 10) {
      try {
        const res = await axios.get(
          `https://www.poznan.pl/mim/kultura/events/2026-05-12,calendarPage.html?offset=${offset}&limit=10`,
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

          const now = new Date();
          let startDate: Date;
          let endDate: Date;

          const dateMatch = text.match(/(\d{1,2})[.\\-](\d{1,2})[.\\-](\d{4})/);
          if (dateMatch) {
            startDate = new Date(parseInt(dateMatch[3]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[1]));
          } else {
            startDate = now;
          }

          endDate = startDate;

          const timeMatch = text.match(/(\d{1,2})[.:](\d{2})/);
          const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : undefined;

          const placeMatch = text.match(/(?:miejsce|gdzie|venue)[:\s]+([^\n,]+)/i);
          const placeName = placeMatch ? placeMatch[1].trim() : "Poznań";

          const catMap: Record<string, string> = {
            kino: "Kino", film: "Kino",
            muzyka: "Muzyka", koncert: "Muzyka",
            teatr: "Teatr", spektakl: "Teatr",
            sztuka: "Sztuka", wystawa: "Sztuka", wernisaż: "Sztuka",
            sport: "Sport", bieg: "Sport",
            warsztaty: "Warsztaty", warsztat: "Warsztaty",
            konferencja: "Konferencje", wykład: "Konferencje",
            jedzenie: "Jedzenie", kulinaria: "Jedzenie",
          };
          const lower = (title + " " + text).toLowerCase();
          let category = "Inne";
          for (const [key, val] of Object.entries(catMap)) {
            if (lower.includes(key)) { category = val; break; }
          }

          const imgUrl = img.startsWith("http") ? img : "";

          events.push({
            title,
            imageUrl: imgUrl || undefined,
            sourceUrl: fullLink,
            startDate,
            endDate,
            time,
            placeName,
            district: "Inny",
            category,
            vibes: ["Kulturalne"],
            source: "poznanpl",
            sourceId: `poznanpl-${Buffer.from(title).toString("base64").slice(0, 24)}`,
          });
          found++;
        });

        console.log(`[PoznanPl] offset=${offset}: ${found} events`);
        if (found === 0) break;
      } catch (e) {
        console.error(`[PoznanPl] offset=${offset}: error, stopping`);
        break;
      }
    }

    return events;
  }
}
