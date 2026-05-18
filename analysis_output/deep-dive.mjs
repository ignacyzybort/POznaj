import axios from "axios";
import * as cheerio from "cheerio";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

async function deepDive() {
  let res, $;
  
  // 1. mnp.art.pl
  console.log("=== MNP.ART.PL JSON-LD ===\n");
  res = await axios.get("https://mnp.art.pl/event/poznanska-boznanska-pokaz-prac-artystki-z-kolekcji-mnp", { headers: {"User-Agent": UA}, timeout: 15000 });
  $ = cheerio.load(res.data);
  $('script[type="application/ld+json"]').each((i, el) => {
    const raw = $(el).html() || "";
    try {
      const parsed = JSON.parse(raw);
      console.log(`LD#${i}: ` + JSON.stringify(parsed, null, 2).slice(0, 3000));
    } catch(e) { console.log(`LD#${i} parse error: ${e.message.slice(0,100)}`); }
  });
  console.log("Tribe Events single:", $(".tribe-events-single").length > 0);
  console.log("Event date:", $(".tribe-events-schedule, .tribe-event-date-start, .tribe-event-date-end").text().trim().slice(0,200));
  console.log("Venue:", $(".tribe-events-venue, .tribe-events-venue-details").text().trim().slice(0,200));
  console.log("Date meta:", $('meta[itemprop="startDate"]').attr("content") || "none");
  console.log("Location meta:", $('[itemprop="location"]').attr("content") || $('[itemprop="location"] meta[itemprop="name"]').attr("content") || "none");

  // 2. filharmoniapoznanska.pl
  console.log("\n\n=== FILHARMONIA POZNANSKA ===\n");
  res = await axios.get("https://filharmoniapoznanska.pl/koncerty-miesiac/styczen-2026/", { headers: {"User-Agent": UA}, timeout: 15000 });
  $ = cheerio.load(res.data);
  $('script[type="application/ld+json"]').each((i, el) => {
    const raw = $(el).html() || "";
    try {
      const parsed = JSON.parse(raw);
      console.log(`LD#${i} type=${parsed["@type"]}: ` + JSON.stringify(parsed, null, 2).slice(0, 2000));
    } catch(e) {}
  });
  console.log("Concert cards:", $(".concert-card, .event-item, .concert-item, [class*=concert], [class*=event-card]").length);

  // 3. amadeus.pl
  console.log("\n\n=== AMADEUS.PL ===\n");
  res = await axios.get("https://amadeus.pl/pl/", { headers: {"User-Agent": UA}, timeout: 15000 });
  $ = cheerio.load(res.data);
  console.log("Page title:", $("title").text().trim());
  console.log("Event blocks:", $(".event, .concert, .calendar-event, [class*=kalendar]").length);
  console.log("Navigation links:", $("nav a, .menu a").length);

  // 4. filharmoniapoznanska.pl event detail
  console.log("\n\n=== FILHARMONIA EVENT DETAIL ===\n");
  try {
    res = await axios.get("https://filharmoniapoznanska.pl/wydarzenie/koncert-noworoczny-1-01-2026/", { headers: {"User-Agent": UA}, timeout: 15000, maxRedirects: 5 });
    $ = cheerio.load(res.data);
    $('script[type="application/ld+json"]').each((i, el) => {
      const raw = $(el).html() || "";
      try {
        const parsed = JSON.parse(raw);
        console.log(`LD#${i} type=${parsed["@type"]}: ` + JSON.stringify(parsed, null, 2).slice(0, 2000));
      } catch(e) {}
    });
    console.log("OG title:", $('meta[property="og:title"]').attr("content") || "none");
    console.log("OG desc:", ($('meta[property="og:description"]').attr("content") || "none").slice(0,200));
    console.log("OG image:", $('meta[property="og:image"]').attr("content") || "none");
  } catch(e) { console.log("Detail page failed:", e.message.slice(0,100)); }

  // 5. Check WP REST API on filharmoniapoznanska.pl
  console.log("\n\n=== WP REST API test ===\n");
  try {
    const wpApi = await axios.get("https://filharmoniapoznanska.pl/wp-json/wp/v2/posts?per_page=3", { headers: {"User-Agent": UA}, timeout: 10000 });
    const posts = wpApi.data;
    console.log("WP REST posts found:", posts.length);
    if (posts.length > 0) {
      const first = posts[0];
      console.log("Post title:", first.title?.rendered);
      console.log("Has acf?", !!first.acf);
      const keys = Object.keys(first).filter(k => first[k] != null).join(", ");
      console.log("Available fields:", keys.slice(0, 300));
    }
  } catch(e) { console.log("WP REST failed or not open:", e.message.slice(0,100)); }

  // 6. mnp.art.pl - WP REST API
  console.log("\n\n=== MNP.ART.PL WP REST ===\n");
  try {
    const wpApi = await axios.get("https://mnp.art.pl/wp-json/wp/v2/tribe_events?per_page=3", { headers: {"User-Agent": UA}, timeout: 10000 });
    console.log("tribe_events found:", wpApi.data.length);
    if (wpApi.data.length > 0) {
      console.log("First event:", JSON.stringify(wpApi.data[0], null, 2).slice(0, 2000));
    }
  } catch(e) {
    console.log("tribe_events REST failed:", e.message.slice(0,100));
    try {
      const wpApi2 = await axios.get("https://mnp.art.pl/wp-json/wp/v2/posts?per_page=1", { headers: {"User-Agent": UA}, timeout: 10000 });
      console.log("posts found:", wpApi2.data.length);
    } catch(e2) { console.log("posts REST also failed:", e2.message.slice(0,100)); }
  }

  // 7. wmn.poznan.pl WP REST
  console.log("\n\n=== WMN.POZNAN.PL WP REST ===\n");
  try {
    const wpApi = await axios.get("https://www.wmn.poznan.pl/wp-json/wp/v2/posts?per_page=1", { headers: {"User-Agent": UA}, timeout: 10000 });
    console.log("posts found:", wpApi.data.length);
  } catch(e) { console.log("WP REST failed:", e.message.slice(0,100)); }

  // 8. Single-appearance festival domains with potential
  console.log("\n\n=== SINGLE-APPEARANCE FESTIVALS ===\n");
  const singles = [
    "https://pyrkon.pl/",
    "https://malta-festival.pl/",
    "https://ethnoport.pl/",
    "https://enterfestival.pl/",
    "https://nextfest.pl/",
  ];
  for (const url of singles) {
    try {
      res = await axios.get(url, { headers: {"User-Agent": UA}, timeout: 12000, maxRedirects: 5 });
      $ = cheerio.load(res.data);
      const ogTitle = $('meta[property="og:title"]').attr("content") || "none";
      const ogDesc = ($('meta[property="og:description"]').attr("content") || "none").slice(0,100);
      const wp = res.data.includes("wp-content") ? "WP" : "?";
      const ldCount = $('script[type="application/ld+json"]').length;
      console.log(`${url} | ${ldCount} LD | OG: ${ogTitle.slice(0,60)} | CMS: ${wp}`);
    } catch(e) { console.log(`${url} | FAILED: ${e.message.slice(0,60)}`); }
  }
}

deepDive().catch(console.error);
