import { Scraper, ScrapedEvent } from "./base";
import axios from "axios";
import * as cheerio from "cheerio";

function guessDistrict(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("stary rynek") || lower.includes("śródmieście") || lower.includes("centrum")) return "StareMiasto";
  if (lower.includes("jeżyce") || lower.includes("jezyce") || lower.includes("rynek jeżycki")) return "Jezyce";
  if (lower.includes("łazarz") || lower.includes("lazarz") || lower.includes("rynek łazarski")) return "Lazarz";
  if (lower.includes("grunwald")) return "Grunwald";
  if (lower.includes("wilda")) return "Wilda";
  if (lower.includes("rataje")) return "Rataje";
  if (lower.includes("piątkowo") || lower.includes("piatkowo")) return "Piatkowo";
  if (lower.includes("winogrady") || lower.includes("cytadela")) return "Winogrady";
  if (lower.includes("malta") || lower.includes("nowe miasto") || lower.includes("śródka") || lower.includes("ostrów tumski")) return "NoweMiasto";
  return "Inny";
}

function guessVibes(title: string, desc: string, category: string): string[] {
  const t = (title + " " + desc).toLowerCase();
  const vibes: string[] = [];

  if (t.includes("randka") || t.includes("walentynki") || t.includes("romantycz") || t.includes("dla dwojga") || t.includes("we dwoje") || (t.includes("wieczór") && (t.includes("kolacja") || t.includes("muzyka") || t.includes("przy świec")))) vibes.push("Randka");
  if (t.includes("impreza") || t.includes("disco") || t.includes("club") || t.includes("dj") || t.includes("dance") || t.includes("after") || t.includes("tanecz") || t.includes("lata 80") || t.includes("lata 90") || t.includes("party") || t.includes("after party") || category === "Impreza") vibes.push("Impreza");
  if (t.includes("rodzin") || t.includes("dzieci") || t.includes("piknik") || t.includes("rodzinn") || t.includes("dzień dziecka") || t.includes("dla całej") || t.includes("bajk") || t.includes("animac") || t.includes("balon") || t.includes("warsztaty dla dzieci") || t.includes("dziecięcy")) vibes.push("Rodzinne");
  if (t.includes("spacer") || t.includes("spokoj") || t.includes("relaks") || t.includes("medytac") || t.includes("cisza") || t.includes("wycisz") || t.includes("joga") || t.includes("zwiedzanie") || t.includes("herbata") || t.includes("kawiarn") || category === "Spokojne") vibes.push("Spokojne");
  if (t.includes("bieg") || t.includes("sport") || t.includes("aktywn") || t.includes("fitness") || t.includes("triathlon") || t.includes("rower") || t.includes("zawod") || t.includes("bieg") || t.includes("bieg") || t.includes("turniej") || t.includes("aktyw") || t.includes("gimnast") || category === "Sport") vibes.push("Aktywne");
  if (t.includes("znajom") || t.includes("spotkan") || t.includes("grupa") || t.includes("razem") || t.includes("towarzyst") || t.includes("wspólne") || t.includes("after") || t.includes("klub") || t.includes("bar") || category === "WyjscieZeZnajomymi") vibes.push("WyjscieZeZnajomymi");

  if (vibes.length === 0) {
    if (category === "Muzyka") vibes.push("Kulturalne", "Impreza");
    else if (category === "Teatr") vibes.push("Kulturalne");
    else if (category === "Kino") vibes.push("Kulturalne", "Randka");
    else if (category === "Sport") vibes.push("Aktywne", "Rodzinne");
    else if (category === "Jedzenie") vibes.push("WyjscieZeZnajomymi");
    else if (category === "Warsztaty") vibes.push("Spokojne", "WyjscieZeZnajomymi");
    else vibes.push("Kulturalne");
  }

  const unique = [...new Set(vibes)];
  return unique.slice(0, 3);
}

function parseCategory(url: string, title: string, text: string): string {
  const c = (url + " " + title + " " + text).toLowerCase();
  if (c.includes("kino") || c.includes("film") || c.includes("filmow") || c.includes("projekcj") || c.includes("lgtb")) return "Kino";
  if (c.includes("sztuk") || c.includes("wystaw") || c.includes("galeri") || c.includes("wernis") || c.includes("malarstw") || c.includes("rzeźb")) return "Sztuka";
  if (c.includes("teatr") || c.includes("spektakl") || c.includes("musical") || c.includes("stand") || c.includes("komedi") || c.includes("balet")) return "Teatr";
  if (c.includes("muzy") || c.includes("koncer") || c.includes("festiwal") || c.includes("wokal") || c.includes("zestaw piosenek")) return "Muzyka";
  if (c.includes("sport") || c.includes("bieg") || c.includes("aktywn") || c.includes("zawody") || c.includes("turniej") || c.includes("marsz")) return "Sport";
  if (c.includes("warsztat") || c.includes("kurs") || c.includes("szkole") || c.includes("nauka")) return "Warsztaty";
  if (c.includes("konferenc") || c.includes("wykład") || c.includes("spotkan") || c.includes("seminari")) return "Konferencje";
  if (c.includes("jedzeni") || c.includes("kuchni") || c.includes("kulinar") || c.includes("degustac") || c.includes("kawa") || c.includes("piwo") || c.includes("kawiarn") || c.includes("restaurac")) return "Jedzenie";
  return "Inne";
}

export class PikPoznanScraper implements Scraper {
  name = "pikpoznan";

  private sources = [
    { url: "https://pik.poznan.pl/muzyka/", label: "Muzyka" },
    { url: "https://pik.poznan.pl/teatr/", label: "Teatr" },
    { url: "https://pik.poznan.pl/festiwal/", label: "Festiwal" },
    { url: "https://pik.poznan.pl/kino/", label: "Kino" },
    { url: "https://pik.poznan.pl/dzieci/", label: "Dzieci" },
  ];

  async scrape(): Promise<ScrapedEvent[]> {
    const all: ScrapedEvent[] = [];

    for (const source of this.sources) {
      try {
        const events = await this.scrapeSection(source.url);
        all.push(...events);
        console.log(`[PikPoznan] ${source.label}: ${events.length} events`);
      } catch (e) {
        console.error(`[PikPoznan] Error scraping ${source.url}:`, e);
      }
    }

    return all;
  }

  private async scrapeSection(url: string): Promise<ScrapedEvent[]> {
    const res = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      timeout: 15000,
    });

    const $ = cheerio.load(res.data);
    const events: ScrapedEvent[] = [];

    $("article, .post, .entry, .event-item, .card, [class*='post'], .lista-wpisow > div, .grid > div, main > div > div").each((_, el) => {
      const titleEl = $(el).find("h2 a, h3 a, h2, h3, .title a, .entry-title a");
      const title = titleEl.first().text().trim();
      if (!title) return;

      const link = titleEl.attr("href") || $(el).find("a").first().attr("href") || "";

      const descEl = $(el).find("p, .description, .excerpt, .entry-content");
      let description = "";
      descEl.each((_, p) => { const t = $(p).text().trim(); if (t.length > description.length) description = t; });

      const img = $(el).find("img").first().attr("src") || $(el).find("img").first().attr("data-src") || "";
      const text = $(el).text();

      const dateMatch = text.match(/(\d{1,2})\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+(\d{4})/i);
      const monthMap: Record<string, number> = {
        stycznia: 0, lutego: 1, marca: 2, kwietnia: 3, maja: 4, czerwca: 5,
        lipca: 6, sierpnia: 7, września: 8, października: 9, listopada: 10, grudnia: 11,
      };

      let startDate: Date;
      let endDate: Date;

      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = monthMap[dateMatch[2].toLowerCase()] ?? 0;
        const year = parseInt(dateMatch[3]);
        startDate = new Date(year, month, day);

        const rangeMatch = text.match(/–\s*(\d{1,2})\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)(?:\s+(\d{4}))?/i);
        if (rangeMatch) {
          const endDay = parseInt(rangeMatch[1]);
          const endMonth = monthMap[rangeMatch[2].toLowerCase()] ?? month;
          const endYear = rangeMatch[3] ? parseInt(rangeMatch[3]) : year;
          endDate = new Date(endYear, endMonth, endDay);
        } else {
          endDate = startDate;
        }
      } else {
        startDate = new Date();
        endDate = new Date();
      }

      if (startDate.getFullYear() < 2025) return;

      const timeMatch = text.match(/(\d{1,2})[.:](\d{2})/);
      const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : undefined;

      let placeName = "Poznań";
      const venueMatch = text.match(/(?:wystąpi\s+w|w\s+(?:klubie|sali|teatrze|auli|kinie|scenie|kościele))\s+([^,.]+)/i);
      if (venueMatch) placeName = venueMatch[1].trim();

      const addressStr = text.split("\n").filter(l => l.includes("ul.") || l.includes("Pl.") || l.includes("al.")).map(l => l.trim()).join(", ");

      const category = parseCategory(url, title, text);
      const vibeList = guessVibes(title, description, category);

      const fullLink = link.startsWith("http") ? link : `https://pik.poznan.pl${link.startsWith("/") ? "" : "/"}${link}`;
      const imgUrl = img.startsWith("http") ? img : (img ? `https://pik.poznan.pl${img.startsWith("/") ? "" : "/"}${img}` : "");

      const now = new Date();
      const daysUntil = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntil < -1) return;

      events.push({
        title,
        description: description || undefined,
        imageUrl: imgUrl || undefined,
        sourceUrl: fullLink,
        startDate,
        endDate,
        time,
        placeName,
        address: addressStr || undefined,
        district: guessDistrict(title + " " + description + " " + placeName + " " + addressStr),
        category,
        vibes: vibeList,
        source: "pikpoznan",
        sourceId: `pikpoznan-${Buffer.from(title).toString("base64").slice(0, 24)}`,
      });
    });

    return events;
  }
}
