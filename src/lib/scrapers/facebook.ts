import { Scraper, ScrapedEvent } from "./base";
import axios from "axios";

/**
 * Facebook Events scraper using Facebook Graph API.
 * Requires a Page Access Token with `pages_read_engagement` permission.
 * Set FB_PAGE_ID and FB_ACCESS_TOKEN in environment variables.
 */
export class FacebookScraper implements Scraper {
  name = "facebook";

  private pageId: string;
  private accessToken: string;

  constructor() {
    this.pageId = process.env.FB_PAGE_ID ?? "";
    this.accessToken = process.env.FB_ACCESS_TOKEN ?? "";

    if (!this.pageId || !this.accessToken) {
      console.warn(
        "[FacebookScraper] FB_PAGE_ID and FB_ACCESS_TOKEN not configured. Scraper will be inactive."
      );
    }
  }

  async scrape(): Promise<ScrapedEvent[]> {
    if (!this.pageId || !this.accessToken) return [];

    const events: ScrapedEvent[] = [];
    let url = `https://graph.facebook.com/v22.0/${this.pageId}/events?access_token=${this.accessToken}&fields=id,name,description,start_time,end_time,place,cover&limit=50`;

    try {
      while (url) {
        const res = await axios.get(url);
        const data = res.data;

        for (const fbEvent of data.data ?? []) {
          const parsed = this.parseEvent(fbEvent);
          if (parsed) events.push(parsed);
        }

        url = data.paging?.next ?? null;
      }
    } catch (e) {
      console.error("[FacebookScraper] Error fetching events:", e);
    }

    return events;
  }

  private parseEvent(fbEvent: any): ScrapedEvent | null {
    try {
      const startDate = fbEvent.start_time ? new Date(fbEvent.start_time) : null;
      const endDate = fbEvent.end_time ? new Date(fbEvent.end_time) : startDate;

      if (!startDate || !endDate) return null;

      const placeName = fbEvent.place?.name ?? "Poznań";
      const location = fbEvent.place?.location ?? {};
      const address = [
        location.street,
        location.city,
      ]
        .filter(Boolean)
        .join(", ");

      return {
        title: fbEvent.name ?? "Bez tytułu",
        description: fbEvent.description,
        imageUrl: fbEvent.cover?.source,
        sourceUrl: `https://www.facebook.com/events/${fbEvent.id}`,
        startDate,
        endDate,
        time: startDate
          ? `${startDate.getHours().toString().padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}`
          : undefined,
        placeName,
        address: address || undefined,
        district: this.guessDistrict(address || placeName),
        category: "Inne",
        vibes: ["Kulturalne"],
        source: "facebook",
        sourceId: fbEvent.id,
      };
    } catch {
      return null;
    }
  }

  private guessDistrict(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes("stary rynek") || lower.includes("stare miasto") || lower.includes("śródmieście")) return "StareMiasto";
    if (lower.includes("jeżyce") || lower.includes("jezyce")) return "Jezyce";
    if (lower.includes("grunwald") || lower.includes("łazarz") || lower.includes("lazarz")) return "Grunwald";
    if (lower.includes("wilda")) return "Wilda";
    if (lower.includes("piątkowo") || lower.includes("piatkowo") || lower.includes("winogrady")) return "StareMiasto";
    if (lower.includes("rataje") || lower.includes("nowe miasto") || lower.includes("malta")) return "NoweMiasto";
    return "Inny";
  }
}
