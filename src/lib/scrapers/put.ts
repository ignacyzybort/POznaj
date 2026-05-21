import { Scraper, ScrapedEvent } from "./base";
import axios from "axios";
import * as cheerio from "cheerio";
import { matchVenue } from "@/lib/venues";
import { districtFallback } from "./geocode";

const URL = "https://www.put.poznan.pl/wydarzenia";
const SOURCE = "put";

const MONTHS: Record<string, number> = {
  sty: 0, lut: 1, mar: 2, kwi: 3, maj: 4, cze: 5,
  lip: 6, sie: 7, wrz: 8, paź: 9, lis: 10, gru: 11,
};

export class PutScraper implements Scraper {
  name = "put";

  async scrape(): Promise<ScrapedEvent[]> {
    console.log("[PUT] Fetching...");
    const { data } = await axios.get(URL, { headers: { "User-Agent": "POznaj/1.0" }, timeout: 15000 });
    const $ = cheerio.load(data);

    const events: ScrapedEvent[] = [];
    const seen = new Set<string>();
    const fallback = districtFallback("Centrum");

    // The calendar page has a month grid. Event titles appear in day cells.
    // Look for patterns like "Nazwa wydarzenia" inside calendar-day divs or table cells.
    // The text I found earlier: "Szkolenie: Zarządzanie projektami", "Noc Muzeów - Twórczość Profesora Mariana Fikusa"
    // These are inside day cells with links.

    // Strategy: find all links inside calendar-like containers
    // Target selects: calendar day cells that contain event links
    const dayCells = $("td, [class*='day'], [class*='calendar'], [class*='dzien']").toArray();

    // Find the current month/year from the page heading
    const headingText = $("h1, h2, [class*='heading'], [class*='title']").text();
    const monthMatch = headingText.match(/(styczeń|luty|marzec|kwiecień|maj|czerwiec|lipiec|sierpień|wrzesień|październik|listopad|grudzień)\s+(\d{4})/i);
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    if (monthMatch) {
      const monthNames = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"];
      const idx = monthNames.indexOf(monthMatch[1].toLowerCase());
      if (idx >= 0) currentMonth = idx;
      currentYear = parseInt(monthMatch[2]);
    }

    for (const cell of dayCells) {
      const $cell = $(cell);

      // Skip empty cells
      const cellText = $cell.text().trim();
      if (!cellText || cellText.length < 5) continue;

      // Find event links inside the cell
      const links = $cell.find("a").toArray();
      for (const link of links) {
        const title = $(link).text().trim();
        if (title.length < 5 || title.length > 150) continue;

        // Extract day number from nearby text (e.g., "25" in the day cell)
        const dayMatch = cellText.match(/^(\d{1,2})\b/);
        if (!dayMatch) continue;
        const day = parseInt(dayMatch[1]);
        if (isNaN(day) || day < 1 || day > 31) continue;

        const startDate = new Date(currentYear, currentMonth, day, 12);
        const endDate = new Date(startDate);
        endDate.setHours(17);

        const key = `${title}|${startDate.toISOString().slice(0, 10)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // Try to extract time from the cell
        const timeMatch = cellText.match(/(\d{1,2}:\d{2})/);
        const time = timeMatch?.[1];

        // Determine the specific building/venue
        let placeName = "Politechnika Poznańska";
        const locationMatch = cellText.match(/(Aula|Audytorium|Sala|Budynek|Centrum|Biblioteka)\s+[^,\n]+/i);
        if (locationMatch) placeName = locationMatch[0].trim();

        const venue = matchVenue(placeName);

        events.push({
          title,
          description: `Wydarzenie — Politechnika Poznańska`,
          sourceUrl: URL,
          startDate,
          endDate,
          time,
          placeName,
          district: venue?.district || fallback.district,
          category: "Konferencje",
          vibes: [],
          source: SOURCE,
          sourceId: `put/${key}`,
          coordsX: venue?.lat || fallback.lat,
          coordsY: venue?.lon || fallback.lon,
          outdoor: false,
        });
      }
    }

    return events;
  }
}
