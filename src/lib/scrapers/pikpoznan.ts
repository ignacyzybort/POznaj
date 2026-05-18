import { Scraper, ScrapedEvent } from "./base";
import axios from "axios";
import * as cheerio from "cheerio";
import { matchVenue } from "@/lib/venues";
import { geocodeVenue, districtFallback } from "./geocode";

function guessDistrict(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("stary rynek") || lower.includes("centrum") || lower.includes("śródmieście")) return "Centrum";
  if (lower.includes("jeżyce") || lower.includes("jezyce") || lower.includes("rynek jeżycki")) return "Jezyce";
  if (lower.includes("grunwald") || lower.includes("łazarz") || lower.includes("lazarz") || lower.includes("rynek łazarski")) return "Grunwald";
  if (lower.includes("wilda")) return "Wilda";
  if (lower.includes("rataje") || lower.includes("malta")) return "NoweMiasto";
  if (lower.includes("piątkowo") || lower.includes("piatkowo") || lower.includes("winogrady") || lower.includes("cytadela")) return "StareMiasto";
  if (lower.includes("malta") || lower.includes("nowe miasto") || lower.includes("śródka") || lower.includes("ostrów tumski")) return "NoweMiasto";
  return "Inny";
}

// Parse recurring movie/screening sub-events: "DD.MM.YYYY, godz. HH:MM – Title"
function parseScreenings(description: string): { date: Date; title: string }[] {
  const screenings: { date: Date; title: string }[] = [];
  const pattern = /(\d{1,2}\.\d{2}\.\d{4}),\s*godz\.\s*(\d{1,2}:\d{2})\s*[–\-]\s*(.+)/g;
  let match;
  while ((match = pattern.exec(description)) !== null) {
    const [_, dateStr, time, title] = match;
    const parts = dateStr.split(".");
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12);
    if (!isNaN(d.getTime())) {
      screenings.push({ date: d, title: title.trim() });
    }
  }
  return screenings;
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
      const title = titleEl.first().text().trim()
        .replace(/\s*[–\u2013\u2014\-—]\s*[Bb]ilety\s*$/g, "")
        .replace(/\s*\|\s*[Bb]ilety\s*$/g, "")
        .replace(/&#8211;\s*Bilety/gi, "")
        .trim();
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

      const searchText = title + " " + description + " " + placeName + " " + text.slice(0, 500);
      const venueData = matchVenue(searchText);

      let district = guessDistrict(title + " " + description + " " + placeName + " " + addressStr);
      let finalAddress = addressStr || undefined;
      let coordsX: number | undefined;
      let coordsY: number | undefined;

      if (venueData) {
        district = venueData.district;
        finalAddress = finalAddress || venueData.address;
        coordsX = venueData.lat;
        coordsY = venueData.lon;
      }

      const category = parseCategory(url, title, text);

      const vibeList = guessVibes(title, description, category);

      const fullLink = link.startsWith("http") ? link : `https://pik.poznan.pl${link.startsWith("/") ? "" : "/"}${link}`;
      const imgUrl = img.startsWith("http") ? img : (img ? `https://pik.poznan.pl${img.startsWith("/") ? "" : "/"}${img}` : "");

      const now = new Date();
      const daysUntil = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntil < -1) return;

      // Skip Twitter/X entries — usually broken duplicates with no real data
      if (fullLink.startsWith("https://x.com/") || fullLink.startsWith("https://twitter.com/")) return;

      events.push({
        title,
        description: description || undefined,
        imageUrl: imgUrl || undefined,
        sourceUrl: fullLink,
        startDate,
        endDate,
        time,
        placeName,
        address: finalAddress,
        district,
        category,
        vibes: vibeList,
        source: "pikpoznan",
        sourceId: `pikpoznan-${Buffer.from(title).toString("base64").slice(0, 24)}`,
        coordsX,
        coordsY,
      });
    });

    // Second pass: enrich each event with venue data (5 at a time to avoid rate limiting)
    for (let i = 0; i < events.length; i += 5) {
      const batch = events.slice(i, i + 5);
      await Promise.all(
        batch.map(async (ev) => {
          if (!ev.sourceUrl?.includes("pik.poznan.pl")) return;
          try {
            const article = await axios.get(ev.sourceUrl, {
              headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
              timeout: 10000,
            });
            const $$ = cheerio.load(article.data);

            // Extract venue from JSON-LD (do this BEFORE removing scripts!)
            let venueFromLd: string | null = null;
            let addrFromLd: string | null = null;
            let priceFromLd: string | null = null;
            $$('script[type="application/ld+json"]').each((_, el) => {
              try {
                const data = JSON.parse($$(el).html() || "{}");
                if (data.location?.name) {
                  venueFromLd = data.location.name;
                  addrFromLd = data.location.address?.streetAddress || null;
                }
                if (data.offers?.price) {
                  const p = parseFloat(data.offers.price);
                  priceFromLd = isNaN(p) ? null : `${Math.round(p)} zł`;
                }
              } catch {}
            });

            // Clean description (strip script/style tags from the content area)
            const contentEl = $$(".entry-content, .post-content, article").first();
            contentEl.find("script, style, noscript, iframe").remove();
            const desc = contentEl.text().trim();
            if (desc.length > 50) ev.description = desc.slice(0, 2000);
            if (venueFromLd) {
              ev.placeName = venueFromLd;
              if (addrFromLd) ev.address = addrFromLd;
              const matched = matchVenue(venueFromLd);
              if (matched) {
                ev.district = matched.district;
                ev.coordsX = matched.lat;
                ev.coordsY = matched.lon;
              }
            }
            if (priceFromLd) ev.price = priceFromLd;
            // Fallback: extract price from description text
            if (!ev.price && ev.description) {
              const pMatch = ev.description.match(/(?:bilety?\s*(?:od\s*[\-\u2013]?\s*)?|cena\s*(?:od\s*[\-\u2013]?\s*)?)\s*(\d+(?:\s*[\.\,]\s*\d{2})?)\s*(?:zł|PLN)/i);
              if (pMatch) ev.price = `${pMatch[1].replace(/\s/g, "")} zł`;
              else if (ev.description.match(/(?:wstęp|udział)\s+(?:wolny|bezpłatn)/i)) ev.price = "0 zł";
            }
          } catch {}
        })
      );
    }

    // Post-loop: geocode any event without coordinates from venue match
    for (const ev of events) {
      if (ev.coordsX) continue;
      const geo = await geocodeVenue(ev.placeName, ev.title, ev.address);
      if (geo) {
        ev.coordsX = geo.lat;
        ev.coordsY = geo.lon;
        ev.district = geo.district;
      }
    }

    // Final fallback: events still without coords get district center
    for (const ev of events) {
      if (ev.coordsX) continue;
      const d = ev.district !== "Inny" ? ev.district : guessDistrict(ev.placeName);
      const center = districtFallback(d);
      ev.coordsX = center.lat;
      ev.coordsY = center.lon;
    }

    // Split recurring screenings (e.g. "Kino plenerowe" with multiple dates)
    const splitEvents: ScrapedEvent[] = [];
    for (let i = events.length - 1; i >= 0; i--) {
      const ev = events[i];
      if (!ev.description) continue;
      const screenings = parseScreenings(ev.description);
      if (screenings.length >= 3) {
        events.splice(i, 1);
        for (const s of screenings) {
          splitEvents.push({
            title: s.title,
            description: `${ev.title} — ${s.title}`,
            imageUrl: ev.imageUrl,
            sourceUrl: ev.sourceUrl,
            startDate: s.date,
            endDate: s.date,
            time: undefined,
            placeName: ev.placeName,
            address: ev.address,
            district: ev.district,
            category: "Kino",
            vibes: ["Kulturalne"],
            source: ev.source,
            sourceId: `${ev.sourceId}-${s.title.slice(0, 20)}`,
            coordsX: ev.coordsX,
            coordsY: ev.coordsY,
            price: ev.price,
          });
        }
      }
    }
    events.push(...splitEvents);

    return events;
  }
}
