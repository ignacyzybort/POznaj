import axios from "axios";
import * as cheerio from "cheerio";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

async function check(url, label) {
  try {
    const res = await axios.get(url, { headers: {"User-Agent": UA}, timeout: 12000, maxRedirects: 5 });
    const $ = cheerio.load(res.data);
    const ldCount = $('script[type="application/ld+json"]').length;
    const ldTypes = [];
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const d = JSON.parse($(el).html() || "{}");
        if (d["@type"]) ldTypes.push(d["@type"]);
        if (d["@graph"]) d["@graph"].forEach(g => { if (g["@type"]) ldTypes.push(g["@type"]); });
      } catch {}
    });
    const ogTitle = $('meta[property="og:title"]').attr("content") || "✗";
    const ogDesc = $('meta[property="og:description"]').attr("content") || "✗";
    const ogImg = $('meta[property="og:image"]').attr("content") || "✗";
    const wp = res.data.includes("wp-content") ? "WP" : res.data.includes("joomla") ? "Joomla" : res.data.includes("drupal") ? "Drupal" : "?";
    const eventDate = /\d{1,2}[./]\d{1,2}[./]\d{2,4}/.test($("body").text()) ? "✓" : "✗";
    const size = Buffer.byteLength(res.data, "utf8").toLocaleString();
    console.log(`${label.padEnd(30)} | LD:${String(ldCount).padEnd(2)} ${[...new Set(ldTypes)].slice(0,3).join(",").padEnd(35)} | OG:${ogTitle.slice(0,30).padEnd(31)} | ${wp.padEnd(6)} | date:${eventDate} | ${size}B`);
  } catch(e) {
    console.log(`${label.padEnd(30)} | ❌ ${e.message.slice(0,70)}`);
  }
}

console.log("DOMAIN".padEnd(30) + " | " + "JSON-LD".padEnd(40) + " | " + "OG Title".padEnd(32) + " | " + "CMS".padEnd(7) + " | date");
console.log("─".repeat(130));

// Ranks 11-25 from domain frequency
await check("https://www.estrada.poznan.pl/", "estrada.poznan.pl (4)");
await check("http://www.teatr-polski.pl/", "teatr-polski.pl (3)");
await check("https://teatranimacji.pl/pl", "teatranimacji.pl (3)");
await check("https://betlejempoznanskie.pl/", "betlejempoznanskie.pl (2)");
await check("https://opera.poznan.pl/pl/koncert-noworoczny", "opera.poznan.pl (2)");
await check("http://www.wilniuki.pl/", "wilniuki.pl (2)");
await check("https://entereneafestival.pl/", "entereneafestival.pl (2)");
await check("https://www.wieniawski.pl/bezsennosc.html", "wieniawski.pl (2)");
await check("http://enterfestival.pl", "enterfestival.pl (2)");

// Also check a few single-appearance but important ones
await check("https://pyrkon.pl/", "pyrkon.pl (1)");
await check("https://malta-festival.pl/", "malta-festival.pl (1)");
await check("https://ethnoport.pl/", "ethnoport.pl (1)");
await check("https://nextfest.pl/", "nextfest.pl (1)");
await check("https://animator-festival.com/", "animator-festival.com (1)");

// Check mnp.art.pl tribe_events endpoint more thoroughly
console.log("\n\n=== MNP.ART.PL Tribe Events REST API ===\n");
try {
  const api = await axios.get("https://mnp.art.pl/wp-json/wp/v2/tribe_events?per_page=5&_fields=id,title,link,start_date,end_date,venue,featured_media,yoast_head_json", { headers: {"User-Agent": UA}, timeout: 10000 });
  console.log("Total events:", api.headers["x-wp-total"] || "unknown");
  console.log("Returned:", api.data.length);
  for (const ev of api.data.slice(0, 3)) {
    console.log(`\n  Event: ${ev.title?.rendered || ev.id}`);
    console.log(`    Link: ${ev.link}`);
    console.log(`    Start: ${ev.start_date || "?"} End: ${ev.end_date || "?"}`);
    console.log(`    Venue: ${JSON.stringify(ev.venue).slice(0, 100)}`);
    console.log(`    OG title: ${ev.yoast_head_json?.og_title || "✗"}`);
    console.log(`    OG desc: ${(ev.yoast_head_json?.og_description || "✗").slice(0, 100)}`);
    console.log(`    OG image: ${ev.yoast_head_json?.og_image?.[0]?.url || "✗"}`);
  }
} catch(e) { console.log("API failed:", e.message.slice(0,100)); }

// Check filharmoniapoznanska.pl for event calendar REST 
console.log("\n\n=== FILHARMONIA POZNANSKA REST API CHECK ===\n");
try {
  // Check if they have a custom events endpoint
  const types = await axios.get("https://filharmoniapoznanska.pl/wp-json/wp/v2/types", { headers: {"User-Agent": UA}, timeout: 10000 });
  const postTypes = Object.keys(types.data);
  console.log("Post types:", postTypes.join(", "));
} catch(e) { console.log("Types API:", e.message.slice(0,80)); }
try {
  const posts = await axios.get("https://filharmoniapoznanska.pl/wp-json/wp/v2/posts?per_page=2&_fields=id,title,link,acf,yoast_head_json", { headers: {"User-Agent": UA}, timeout: 10000 });
  console.log("Posts:", posts.data.length);
  if (posts.data[0]) console.log("  Title:", posts.data[0].title?.rendered);
  if (posts.data[0]) console.log("  ACF keys:", posts.data[0].acf ? Object.keys(posts.data[0].acf).join(", ").slice(0,150) : "none");
} catch(e) { console.log("Posts API:", e.message.slice(0,80)); }

// Check wmn.poznan.pl for events CPT
console.log("\n\n=== WMN.POZNAN.PL REST API ===\n");
try {
  const types = await axios.get("https://www.wmn.poznan.pl/wp-json/wp/v2/types", { headers: {"User-Agent": UA}, timeout: 10000 });
  const postTypes = Object.keys(types.data);
  console.log("Post types:", postTypes.join(", "));
} catch(e) { console.log("Types API:", e.message.slice(0,80)); }

// Quick test on zamek.poznan.pl for any API
console.log("\n\n=== ZAMEK.POZNAN.PL ===\n");
try {
  const z = await axios.get("http://zamek.poznan.pl", { headers: {"User-Agent": UA}, timeout: 10000 });
  console.log("Generator meta:", cheerio.load(z.data)('meta[name="generator"]').attr("content") || "none");
  console.log("CMS hint in body:", z.data.includes("wordpress") ? "WP" : z.data.includes("drupal") ? "Drupal" : z.data.includes("typo3") ? "TYPO3" : "unknown");
  console.log("Has calendar/events link:", z.data.includes("kalendar") || z.data.includes("wydarze") ? "yes" : "no");
} catch(e) { console.log("Failed:", e.message.slice(0,60)); }

// Check teatr-polski.pl for repertuar/repertoire
console.log("\n\n=== TEATR-POLSKI.PL ===\n");
try {
  const tp = await axios.get("https://teatr-polski.pl/", { headers: {"User-Agent": UA}, timeout: 10000 });
  const tp$ = cheerio.load(tp.data);
  console.log("CMS:", tp.data.includes("wp-content") ? "WP" : "?");
  $ = tp$;
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const d = JSON.parse($(el).html() || "{}");
      if (d["@type"]) console.log(`LD: ${d["@type"]}`, JSON.stringify(d).slice(0,300));
    } catch {}
  });
  console.log("OG:", tp$('meta[property="og:title"]').attr("content") || "✗");
} catch(e) { console.log("Failed:", e.message.slice(0,60)); }

