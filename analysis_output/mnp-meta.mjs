import axios from "axios";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const mnp = await axios.get("https://mnp.art.pl/wp-json/wp/v2/tribe_events?per_page=1", {
  headers: {"User-Agent": UA}, timeout: 10000
});
const ev = mnp.data[0];
console.log("=== MNP tribe_events META ===");
console.log("meta:", JSON.stringify(ev.meta, null, 2).slice(0, 2000));
console.log("\ntribe_events_cat:", JSON.stringify(ev.tribe_events_cat));
// Check _links for venue/organizer
console.log("\n_links keys:", Object.keys(ev._links || {}).join(", "));
// Check content for date patterns
const content = (ev.content?.rendered || "").replace(/<[^>]*>/g, " ").trim();
console.log("\nContent excerpt:", content.slice(0, 500));
// Extract date from content
const datePatterns = [
  /(\d{1,2})\s+(?:stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+(\d{4})/gi,
  /(\d{4})-(\d{2})-(\d{2})/g,
  /Godziny.*?(\d{1,2}:\d{2})/gi,
];
for (const pat of datePatterns) {
  const matches = [...content.matchAll(pat)];
  if (matches.length) console.log("Dates found:", matches.map(m => m[0]).join(", "));
}

// Now check WMN cpt_kalendarium for dates in ACF
console.log("\n\n=== WMN cpt_kalendarium meta ===");
try {
  const wmn = await axios.get("https://www.wmn.poznan.pl/wp-json/wp/v2/cpt_kalendarium?per_page=1", {
    headers: {"User-Agent": UA}, timeout: 10000
  });
  const wev = wmn.data[0];
  console.log("meta:", JSON.stringify(wev.meta, null, 2).slice(0, 1000));
  console.log("acf:", JSON.stringify(wev.acf, null, 2).slice(0, 1000));
  // The ACF was empty array but might be stored in meta
} catch(e) { console.log("Failed:", e.message); }

// Check zamek.poznan.pl event structure more carefully
console.log("\n\n=== ZAMEK event structure ===");
import * as cheerio from "cheerio";
try {
  const zr = await axios.get("http://zamek.poznan.pl", {
    headers: {"User-Agent": UA}, timeout: 10000
  });
  const $ = cheerio.load(zr.data);
  const eventItems = $(".eventsList__container, .eventsList__item, .event-item, .kalendarium-item");
  console.log("Event container items:", eventItems.length);
  if (eventItems.length > 0) {
    const firstItem = eventItems.first();
    console.log("First item HTML:", firstItem.html()?.slice(0, 600));
    console.log("First item text:", firstItem.text().trim().slice(0, 400));
  }
  // Check for links to event detail pages
  const eventLinks = $('a[href*="/wydarzenie/"], a[href*="/event/"], a[href*="/kalendarium/"]');
  console.log("Event detail links:", eventLinks.length);
  eventLinks.each((i, el) => {
    if (i >= 3) return false;
    console.log(`  ${$(el).attr('href')} — ${$(el).text().trim().slice(0, 60)}`);
  });
} catch(e) { console.log("Failed:", e.message); }
