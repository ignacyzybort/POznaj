import axios from "axios";
import * as cheerio from "cheerio";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

const MONTHS = [
  ["styczeń", "styczen", 89977],
  ["luty", "luty", 89978],
  ["marzec", "marzec", 89979],
  ["kwiecień", "kwiecien", 89980],
  ["maj", "maj", 89981],
  ["czerwiec", "czerwiec", 89982],
  ["lipiec", "lipiec", 89983],
  ["sierpień", "sierpien", 89984],
  ["wrzesień", "wrzesien", 89985],
  ["październik", "pazdziernik", 89986],
  ["listopad", "listopad", 89987],
  ["grudzień", "grudzien", 89988],
];

// ============================================================
// STEP 1: Fetch all 12 pages and extract all "Więcej:" links
// ============================================================
async function fetchAllLinks() {
  /** @type {Map<string, { month: string, eventTitle: string, url: string }[]>} */
  const domainMap = new Map();
  let totalLinks = 0;

  for (const [displayName, slug, id] of MONTHS) {
    const url = `https://kultura.poznan.pl/mim/kultura/${slug},p,89975,${id}.html`;
    console.log(`\n📥 Fetching: ${displayName} (${url})`);

    let res;
    try {
      res = await axios.get(url, {
        headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
        timeout: 15000,
      });
    } catch (e) {
      console.error(`  ❌ Failed to fetch ${displayName}: ${e.message}`);
      continue;
    }

    const $ = cheerio.load(res.data);
    const dcBlocks = $(".dc-content");
    console.log(`  Found ${dcBlocks.length} event blocks`);

    dcBlocks.each((_, el) => {
      const $el = $(el);
      const title = $el.find("li strong").first().text().trim().replace(/\u00A0/g, " ").trim();
      if (!title || title.length < 3) return;

      // Find all <p> elements that contain "Więcej:" or "Wiecej:" (diacritic variations)
      const pEls = $el.find("p");
      pEls.each((__, pEl) => {
        const pText = $(pEl).text();
        // Check for "Więcej:" / "Wiecej:" / "Więcej informacji:" / "więcej:" etc
        if (!/wi[eę]cej\s*(informacji)?\s*:/i.test(pText)) return;

        // Extract ALL <a> tags from this paragraph
        const links = $(pEl).find("a");
        links.each((___, aEl) => {
          const href = $(aEl).attr("href");
          if (!href) return;
          // Resolve relative URLs
          let fullUrl = href;
          if (href.startsWith("/")) {
            fullUrl = new URL(href, "https://kultura.poznan.pl").href;
          } else if (!href.startsWith("http")) {
            fullUrl = new URL(href, url).href;
          }

          let domain;
          try {
            domain = new URL(fullUrl).hostname.replace(/^www\./, "");
          } catch {
            domain = "invalid-url";
          }

          if (!domainMap.has(domain)) {
            domainMap.set(domain, []);
          }
          domainMap.get(domain).push({
            month: displayName,
            eventTitle: title,
            url: fullUrl,
          });
          totalLinks++;
        });
      });
    });
  }

  console.log(`\n\n✅ Total "Więcej:" links extracted: ${totalLinks}`);
  console.log(`✅ Unique domains found: ${domainMap.size}\n`);
  return domainMap;
}

// ============================================================
// STEP 2: Group by domain, count frequency, output
// ============================================================
function analyzeDomains(domainMap) {
  // Sort by frequency descending
  const sorted = [...domainMap.entries()]
    .map(([domain, links]) => ({
      domain,
      count: links.length,
      urls: [...new Set(links.map((l) => l.url))], // deduplicate URLs
      events: links,
    }))
    .sort((a, b) => b.count - a.count);

  console.log("=".repeat(80));
  console.log("DOMAIN FREQUENCY ANALYSIS");
  console.log("=".repeat(80));
  console.log();

  for (const entry of sorted) {
    console.log(`${entry.count.toString().padStart(3)}  ${entry.domain}`);
  }

  return sorted;
}

// ============================================================
// STEP 3: For top 10 domains, fetch and analyze representative URL
// ============================================================
async function analyzeTopDomains(domainData) {
  // Filter out generic/common domains that are not worth scraping
  const skipDomains = new Set([
    "facebook.com",
    "www.facebook.com",
    "fb.com",
    "instagram.com",
    "www.instagram.com",
    "youtube.com",
    "www.youtube.com",
    "youtu.be",
    "tiktok.com",
    "twitter.com",
    "x.com",
    "google.com",
    "maps.google.com",
    "wosp.org.pl",     // national charity, not venue-specific
    "poznan.pl",       // already our main source
    "www.poznan.pl",
    "kultura.poznan.pl",
    "titanic.pl",      // one-off exhibition
  ]);

  const candidates = domainData.filter((d) => !skipDomains.has(d.domain));
  const top10 = candidates.slice(0, 10);

  console.log("\n\n" + "=".repeat(80));
  console.log("TOP 10 DOMAINS FOR DEEP ANALYSIS (excluding generic platforms)");
  console.log("=".repeat(80));
  console.log();

  const results = [];

  for (let i = 0; i < top10.length; i++) {
    const entry = top10[i];
    const repUrl = entry.urls[0];
    console.log(`\n${"━".repeat(80)}`);
    console.log(`[${i + 1}/10] DOMAIN: ${entry.domain} (${entry.count} links)`);
    console.log(`Representative URL: ${repUrl}`);
    console.log(`${"━".repeat(80)}`);

    let html = "";
    let error = null;
    try {
      const res = await axios.get(repUrl, {
        headers: { "User-Agent": UA },
        timeout: 15000,
        maxRedirects: 5,
      });
      html = res.data;
      console.log(`  ✅ Fetched: ${res.status} | ${Buffer.byteLength(html, "utf8").toLocaleString()} bytes`);
    } catch (e) {
      error = e.message;
      console.log(`  ❌ Fetch failed: ${e.message}`);
    }

    const analysis = {
      domain: entry.domain,
      count: entry.count,
      representativeUrl: repUrl,
      allUrls: entry.urls.slice(0, 5), // first 5 URLs
      fetchStatus: error ? "failed" : "success",
      fetchError: error,
      hasJsonLD: false,
      hasOgImage: false,
      hasOgTitle: false,
      hasOgDescription: false,
      isWordPress: false,
      cms: "unknown",
      hasEventDates: false,
      hasEventVenues: false,
      jsonLDTypes: [],
      suggestedSelectors: [],
      extractableData: [],
      recommendedApproach: "skip",
    };

    if (html) {
      const $ = cheerio.load(html);

      // ---- JSON-LD ----
      const ldJsonScripts = $('script[type="application/ld+json"]');
      analysis.hasJsonLD = ldJsonScripts.length > 0;
      if (analysis.hasJsonLD) {
        const ldTypes = [];
        ldJsonScripts.each((_, s) => {
          try {
            const data = JSON.parse($(s).html() || "{}");
            if (data["@type"]) ldTypes.push(data["@type"]);
            // Check for nested @type in @graph
            if (data["@graph"] && Array.isArray(data["@graph"])) {
              for (const item of data["@graph"]) {
                if (item["@type"]) ldTypes.push(item["@type"]);
              }
            }
          } catch {}
        });
        analysis.jsonLDTypes = [...new Set(ldTypes)];
        console.log(`  📋 JSON-LD: ✓ (${analysis.jsonLDTypes.join(", ")})`);
      } else {
        console.log(`  📋 JSON-LD: ✗`);
      }

      // ---- OG Meta Tags ----
      analysis.hasOgTitle = $('meta[property="og:title"]').length > 0;
      analysis.hasOgDescription = $('meta[property="og:description"]').length > 0;
      analysis.hasOgImage = $('meta[property="og:image"]').length > 0;
      const ogStatus = [
        analysis.hasOgTitle ? "title" : "",
        analysis.hasOgDescription ? "desc" : "",
        analysis.hasOgImage ? "image" : "",
      ]
        .filter(Boolean)
        .join(", ");
      console.log(`  🖼️ OG Meta: ${ogStatus || "✗ none"}`);

      // ---- WordPress Detection ----
      const wpIndicators = [];
      if (html.includes("wp-content")) wpIndicators.push("wp-content");
      if (html.includes("wp-json")) wpIndicators.push("wp-json");
      if (html.includes("wp-includes")) wpIndicators.push("wp-includes");
      if ($('link[rel="https://api.w.org/"]').length) wpIndicators.push("api.w.org link");
      if ($('meta[name="generator"][content*="WordPress"]').length) wpIndicators.push('meta generator="WordPress"');
      analysis.isWordPress = wpIndicators.length > 0;
      if (analysis.isWordPress) {
        analysis.cms = "WordPress";
        console.log(`  🧱 CMS: WordPress (${wpIndicators.join(", ")})`);
      } else {
        // Detect other CMS
        if (html.includes("joomla")) analysis.cms = "Joomla";
        else if (html.includes("drupal")) analysis.cms = "Drupal";
        else if (html.includes("shopify")) analysis.cms = "Shopify";
        else if (html.includes("wix")) analysis.cms = "Wix";
        console.log(`  🧱 CMS: ${analysis.cms}`);
      }

      // ---- Structured event data in HTML ----
      // Look for common patterns: date, time, venue information
      const bodyText = $("body").text();

      const datePatterns = [
        /\d{1,2}[./]\d{1,2}[./]\d{2,4}/,
        /\d{1,2}\s+(?:stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+\d{4}/i,
        /(?:data|termin|kiedy|date)\s*:?\s*[\d\w]/i,
      ];
      analysis.hasEventDates = datePatterns.some((pat) => pat.test(bodyText));

      const venuePatterns = [
        /(?:miejsce|venue|location|lokalizacja|adres|gdzie)\s*:?\s*[A-ZĄĆĘŁŃÓŚŹŻ]/i,
        /ul\.\s+[A-ZĄĆĘŁŃÓŚŹŻ]/,
        /(?:sala|aula|teatr|kino|galeria|muzeum|klub|centrum|dom\s+kultury)\s+[A-ZĄĆĘŁŃÓŚŹŻ]/i,
      ];
      analysis.hasEventVenues = venuePatterns.some((pat) => pat.test(bodyText));
      console.log(`  📅 Event dates in HTML: ${analysis.hasEventDates ? "✓" : "✗"}`);
      console.log(`  📍 Venue info in HTML: ${analysis.hasEventVenues ? "✓" : "✗"}`);

      // ---- Suggested CSS Selectors ----
      const selectors = suggestSelectors($, html);
      analysis.suggestedSelectors = selectors;
      console.log(`  🎯 Suggested selectors: ${selectors.length > 0 ? selectors.join(" | ") : "none found"}`);

      // ---- Extractable Data Assessment ----
      const extractable = [];
      if (analysis.hasOgTitle) extractable.push("title (og)");
      if (analysis.hasOgDescription) extractable.push("description (og)");
      if (analysis.hasOgImage) extractable.push("image (og)");
      if (analysis.hasJsonLD) extractable.push(`JSON-LD: ${analysis.jsonLDTypes.join(", ")}`);
      if (analysis.hasEventDates) extractable.push("event dates");
      if (analysis.hasEventVenues) extractable.push("venue info");
      analysis.extractableData = extractable;

      // ---- Recommended Approach ----
      if (analysis.jsonLDTypes.some((t) => t === "Event" || t === "MusicEvent" || t === "TheaterEvent" || t === "ExhibitionEvent")) {
        analysis.recommendedApproach = "json-ld-event-parser";
      } else if (analysis.isWordPress && analysis.hasOgTitle && analysis.hasOgDescription) {
        analysis.recommendedApproach = "wordpress-rest-api-or-og-meta";
      } else if (analysis.hasJsonLD) {
        analysis.recommendedApproach = "generic-json-ld";
      } else if (analysis.hasOgTitle || analysis.hasOgDescription) {
        analysis.recommendedApproach = "generic-og-meta";
      } else {
        analysis.recommendedApproach = "custom-html-scrape";
      }
      console.log(`  🏷️ Recommended approach: ${analysis.recommendedApproach}`);
    }

    results.push(analysis);

    // Brief delay between fetches to be polite
    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
}

function suggestSelectors($, html) {
  const selectors = [];

  // Check for common event listing patterns
  if ($(".tribe-events-list").length) selectors.push(".tribe-events-list .tribe-events-event");
  if ($(".tribe-events-calendar").length) selectors.push(".tribe-events-calendar");
  if ($("[class*='event-']").length > 3) selectors.push("[class*='event-']");

  // Check for article listings
  if ($("article.event").length) selectors.push("article.event");
  if ($("article.post").length) selectors.push("article.post");
  if ($(".post").length) selectors.push(".post");
  if ($(".event-item").length) selectors.push(".event-item");
  if ($(".concert-item").length) selectors.push(".concert-item");

  // Check for JSON-LD structured content areas
  if ($(".event-content").length) selectors.push(".event-content");
  if ($(".single-event").length) selectors.push(".single-event");

  // Check for date elements
  if ($("time[datetime]").length) selectors.push("time[datetime]");
  if ($(".event-date").length) selectors.push(".event-date");

  // Check for venue elements
  if ($(".event-venue").length) selectors.push(".event-venue");
  if ($("[itemprop='location']").length) selectors.push("[itemprop='location']");

  // Check for WooCommerce products (some venues sell tickets this way)
  if ($(".woocommerce").length) selectors.push(".woocommerce .product");

  // Check for The Events Calendar (WordPress plugin)
  if (html.includes("tribe-events")) selectors.push(".tribe-events-event");

  return [...new Set(selectors)];
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  kultura.poznan.pl — \"Więcej:\" Link Domain Analysis       ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log();

  // Step 1 & 2: Fetch and extract
  const domainMap = await fetchAllLinks();
  const domainData = analyzeDomains(domainMap);

  // Save raw domain data
  const rawOutput = domainData.map((d) => ({
    domain: d.domain,
    count: d.count,
    sampleUrls: d.urls.slice(0, 5),
    eventTitles: [...new Set(d.events.map((e) => e.eventTitle))].slice(0, 10),
  }));

  writeFileSync(
    resolve(process.cwd(), "analysis_output", "domain-frequency.json"),
    JSON.stringify(rawOutput, null, 2),
    "utf8"
  );
  console.log(`\n📄 Saved domain frequency to: analysis_output/domain-frequency.json`);

  // Step 3: Deep analysis of top 10
  const top10Results = await analyzeTopDomains(domainData);

  // Save deep analysis results
  writeFileSync(
    resolve(process.cwd(), "analysis_output", "top10-deep-analysis.json"),
    JSON.stringify(top10Results, null, 2),
    "utf8"
  );
  console.log(`\n📄 Saved deep analysis to: analysis_output/top10-deep-analysis.json`);

  // ============================================================
  // FINAL SUMMARY REPORT
  // ============================================================
  console.log("\n\n" + "=".repeat(80));
  console.log("FINAL SUMMARY REPORT");
  console.log("=".repeat(80));
  console.log();

  console.log("TOP 10 DOMAINS — SCRAPER VIABILITY RANKING\n");
  console.log(
    "Rank  Domain".padEnd(40) +
    "Links".padStart(6) +
    "JSON-LD".padStart(9) +
    "OG-Meta".padStart(9) +
    "WP".padStart(5) +
    "Approach".padStart(35)
  );
  console.log("─".repeat(105));

  for (let i = 0; i < top10Results.length; i++) {
    const r = top10Results[i];
    const ld = r.hasJsonLD ? "✓" : "✗";
    const og = r.hasOgTitle || r.hasOgDescription ? "✓" : "✗";
    const wp = r.isWordPress ? "✓" : "✗";
    const approach = {
      "json-ld-event-parser": "⭐ JSON-LD Event parser",
      "wordpress-rest-api-or-og-meta": "📝 WP REST/OG meta",
      "generic-json-ld": "🔍 Generic JSON-LD",
      "generic-og-meta": "🖼️ Generic OG meta",
      "custom-html-scrape": "🔧 Custom HTML scrape",
      "skip": "⛔ Skip",
    }[r.recommendedApproach] || r.recommendedApproach;

    console.log(
      `${(i + 1).toString().padStart(3)}. ${r.domain.slice(0, 36).padEnd(36)} ` +
      `${r.count.toString().padStart(5)} ` +
      `${ld.padStart(7)} ` +
      `${og.padStart(7)} ` +
      `${wp.padStart(4)} ` +
      ` ${approach}`
    );
  }

  console.log("\n" + "─".repeat(105));
  console.log("\n📋 DETAILED RECOMMENDATIONS:\n");

  for (let i = 0; i < top10Results.length; i++) {
    const r = top10Results[i];
    console.log(`[${i + 1}] ${r.domain} (${r.count} links)`);
    console.log(`    URL: ${r.representativeUrl}`);
    console.log(`    Extractable: ${r.extractableData.length > 0 ? r.extractableData.join(", ") : "none"}`);
    console.log(`    Selectors: ${r.suggestedSelectors.length > 0 ? r.suggestedSelectors.join(", ") : "none"}`);
    console.log(`    Approach: ${r.recommendedApproach}`);
    if (r.cms !== "unknown") console.log(`    CMS: ${r.cms}`);
    if (r.fetchError) console.log(`    ⚠️ Error: ${r.fetchError}`);
    console.log();
  }

  console.log("=".repeat(80));
  console.log("ANALYSIS COMPLETE");
  console.log("=".repeat(80));
}

main().catch((e) => {
  console.error("FATAL ERROR:", e);
  process.exit(1);
});
