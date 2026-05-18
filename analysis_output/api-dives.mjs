import axios from "axios";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

// WMN cpt_kalendarium
console.log("=== WMN.POZNAN.PL — cpt_kalendarium REST ===\n");
try {
  const api = await axios.get("https://www.wmn.poznan.pl/wp-json/wp/v2/cpt_kalendarium?per_page=3", {
    headers: {"User-Agent": UA}, timeout: 10000
  });
  console.log("Total:", api.headers["x-wp-total"] || "unknown");
  console.log("Sample count:", api.data.length);
  for (const ev of api.data.slice(0, 2)) {
    console.log(`\n  Title: ${ev.title?.rendered}`);
    console.log(`  Link: ${ev.link}`);
    console.log(`  Status: ${ev.status}`);
    console.log(`  ACF: ${ev.acf ? JSON.stringify(ev.acf).slice(0, 500) : "none"}`);
    // Check yoast
    console.log(`  Yoast OG title: ${ev.yoast_head_json?.og_title || "✗"}`);
    console.log(`  Yoast OG desc: ${(ev.yoast_head_json?.og_description || "✗").slice(0,120)}`);
    console.log(`  Featured media: ${ev.featured_media || "none"}`);
    console.log(`  Available keys: ${Object.keys(ev).join(", ").slice(0, 200)}`);
  }
} catch(e) { console.log("API failed:", e.message.slice(0,120)); }

// MNP tribe_events - better query
console.log("\n\n=== MNP.ART.PL — tribe_events REST (detailed) ===\n");
try {
  const api = await axios.get("https://mnp.art.pl/wp-json/wp/v2/tribe_events?per_page=3&_fields=id,title,link,start_date,end_date,all_day,venue,featured_media,yoast_head_json", {
    headers: {"User-Agent": UA}, timeout: 10000
  });
  console.log("Total:", api.headers["x-wp-total"] || "unknown");
  for (const ev of api.data) {
    console.log(`\n  Title: ${ev.title?.rendered}`);
    console.log(`  Link: ${ev.link}`);
    console.log(`  Start: ${ev.start_date} End: ${ev.end_date} AllDay: ${ev.all_day}`);
    console.log(`  Venue: ${JSON.stringify(ev.venue).slice(0, 200)}`);
    console.log(`  Featured media ID: ${ev.featured_media}`);
    console.log(`  Yoast OG title: ${ev.yoast_head_json?.og_title || "✗"}`);
    console.log(`  Yoast OG desc: ${(ev.yoast_head_json?.og_description || "✗").slice(0, 120)}`);
  }
} catch(e) { console.log("API failed:", e.message.slice(0,120)); }

// opera.poznan.pl - try the main domain
console.log("\n\n=== OPERA.POZNAN.PL ===\n");
try {
  const res = await axios.get("https://opera.poznan.pl/pl/", {
    headers: {"User-Agent": UA}, timeout: 10000
  });
  const html = res.data;
  console.log("WP:", html.includes("wp-content") ? "yes" : "no");
  console.log("Has repertuar:", html.includes("repertuar") || html.includes("spektakl") || html.includes("kalendarz") ? "yes" : "no");
  // Look for JSON-LD
  const ldMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  if (ldMatches) {
    ldMatches.forEach((m, i) => console.log(`LD#${i}:`, m.slice(0, 500)));
  }
} catch(e) { console.log("Failed:", e.message.slice(0,80)); }

// filharmoniapoznanska.pl - check if they use ACF for events
console.log("\n\n=== FILHARMONIA ACF EVENTS ===\n");
try {
  // Check specific event page
  const res = await axios.get("https://filharmoniapoznanska.pl/wydarzenie/", {
    headers: {"User-Agent": UA}, timeout: 10000, validateStatus: () => true
  });
  console.log("Status:", res.status);
  if (res.status === 200) {
    const html = res.data;
    console.log("Has event cards:", html.includes("event-card") || html.includes("concert-card") ? "yes" : "no");
    // Check JSON-LD
    const ldMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    if (ldMatches) {
      ldMatches.forEach((m, i) => {
        const inner = m.replace(/<script[^>]*>([\s\S]*?)<\/script>/g, "$1");
        try {
          const d = JSON.parse(inner);
          console.log(`LD#${i} type:`, d["@type"], d["@graph"]?.length ? `@graph[${d["@graph"].length}]` : "");
          if (d["@graph"]) {
            for (const g of d["@graph"]) {
              if (g["@type"]?.includes("Event")) console.log("  EVENT:", g.name, g.startDate);
            }
          }
        } catch {}
      });
    }
  }
} catch(e) { console.log("Failed:", e.message.slice(0,80)); }

// zamek.poznan.pl - check for any JSON / API
console.log("\n\n=== ZAMEK.POZNAN.PL API CHECK ===\n");
try {
  const res = await axios.get("http://zamek.poznan.pl", {
    headers: {"User-Agent": UA}, timeout: 10000
  });
  const html = res.data;
  // Check if it's actually a WordPress site despite no wp-content
  console.log("Has wp-json link:", html.includes("wp-json") ? "yes" : "no");
  console.log("Has /api/ path:", html.includes("/api/") ? "yes" : "no");
  // Check for common CMS signatures
  console.log("Typo3?:", html.includes("typo3") ? "yes" : "no");
  console.log("Laravel?:", html.includes("laravel") ? "yes" : "no");
  console.log(".NET?:", html.includes("__VIEWSTATE") ? "yes" : "no");
  const ldMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  if (ldMatches) {
    ldMatches.forEach((m, i) => console.log(`LD#${i}:`, m.slice(0, 600)));
  }
  // Try to find event listing structure
  console.log("Event classes:", html.match(/class="[^"]*(?:event|wydarzen|kalendar|repertuar)[^"]*"/gi)?.join(", ") || "none found");
} catch(e) { console.log("Failed:", e.message.slice(0,80)); }

