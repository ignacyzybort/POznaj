import axios from "axios";
import * as cheerio from "cheerio";

const URL = "https://mnp.art.pl/event/poznanska-boznanska-pokaz-prac-artystki-z-kolekcji-mnp";

const headers = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache"
};

async function main() {
  console.log("============================================================");
  console.log("FETCHING:", URL);
  console.log("============================================================");

  let response;
  try {
    response = await axios.get(URL, { headers, timeout: 15000 });
    console.log("Status: " + response.status + " " + response.statusText);
    console.log("Content-Type:", response.headers["content-type"]);
    console.log("Content-Length:", (response.data || "").length, "bytes");
  } catch (err) {
    console.error("FETCH ERROR:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Headers:", JSON.stringify(err.response.headers, null, 2));
    }
    process.exit(1);
  }

  const $ = cheerio.load(response.data);

  // ============================================================
  // STEP 4: Find ALL script[type="application/ld+json"] tags
  // ============================================================
  console.log("\n============================================================");
  console.log('STEP 4: ALL script[type="application/ld+json"] tags found');
  console.log("============================================================");

  const ldJsonScripts = $('script[type="application/ld+json"]');
  console.log("Count: " + ldJsonScripts.length + " tags found\n");

  const allParsed = [];

  ldJsonScripts.each((i, el) => {
    const raw = $(el).html();
    console.log("--- Tag #" + (i + 1) + " (" + (raw || "").length + " chars) ---");
    try {
      const parsed = JSON.parse(raw);
      allParsed.push(parsed);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log("PARSE ERROR: " + e.message);
      console.log("RAW (first 500 chars): " + (raw || "").substring(0, 500));
    }
    console.log("");
  });

  // ============================================================
  // STEP 5 & 6: Find @type: Event or ExhibitionEvent and extract fields
  // ============================================================
  console.log("\n============================================================");
  console.log("STEP 5 & 6: @type Event / ExhibitionEvent extraction");
  console.log("============================================================");

  function findEvents(obj, depth) {
    depth = depth || 0;
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach(function(item) { findEvents(item, depth); });
      return;
    }
    if (obj["@type"] && (obj["@type"] === "Event" || obj["@type"] === "ExhibitionEvent")) {
      var prefix = "  ".repeat(depth);
      console.log(prefix + ">>> FOUND @type=" + obj["@type"]);
      console.log(prefix + "  name:                " + (obj.name || "(missing)"));
      console.log(prefix + "  startDate:           " + (obj.startDate || "(missing)"));
      console.log(prefix + "  endDate:             " + (obj.endDate || "(missing)"));
      console.log(prefix + "  image:               " + JSON.stringify(obj.image));
      console.log(prefix + "  location.name:       " + ((obj.location && obj.location.name) ? obj.location.name : "(missing)"));
      console.log(prefix + "  location.address:    " + JSON.stringify((obj.location && obj.location.address) || null));
      console.log(prefix + "  location.address.streetAddress: " + ((obj.location && obj.location.address && obj.location.address.streetAddress) ? obj.location.address.streetAddress : "(missing)"));
      console.log(prefix + "  offers.price:        " + (obj.offers && obj.offers.price ? obj.offers.price : (obj.offers && obj.offers[0] && obj.offers[0].price ? obj.offers[0].price : "(missing)")));
      console.log(prefix + "  offers (full):       " + JSON.stringify(obj.offers));
      console.log(prefix + "  description (first 200 chars): " + ((obj.description || "").substring(0, 200)));
      console.log(prefix + "  full object keys:    " + Object.keys(obj).join(", "));
      console.log("");
    }
    for (var key of Object.keys(obj)) {
      if (key !== "@graph") findEvents(obj[key], depth + 1);
    }
  }

  for (var pi = 0; pi < allParsed.length; pi++) {
    var parsed = allParsed[pi];
    if (Array.isArray(parsed)) {
      for (var j = 0; j < parsed.length; j++) findEvents(parsed[j]);
    } else if (parsed["@graph"]) {
      findEvents(parsed["@graph"]);
    } else {
      findEvents(parsed);
    }
  }

  // ============================================================
  // STEP 8: Check OG meta tags
  // ============================================================
  console.log("============================================================");
  console.log("STEP 8: Open Graph meta tags (backup)");
  console.log("============================================================");

  var ogTitle = $('meta[property="og:title"]').attr("content");
  var ogDescription = $('meta[property="og:description"]').attr("content");
  var ogImage = $('meta[property="og:image"]').attr("content");
  var ogUrl = $('meta[property="og:url"]').attr("content");
  var ogType = $('meta[property="og:type"]').attr("content");
  var ogSiteName = $('meta[property="og:site_name"]').attr("content");

  console.log("  og:title:       " + (ogTitle || "(missing)"));
  console.log("  og:description: " + (ogDescription ? ogDescription.substring(0, 200) + "..." : "(missing)"));
  console.log("  og:image:       " + (ogImage || "(missing)"));
  console.log("  og:url:         " + (ogUrl || "(missing)"));
  console.log("  og:type:        " + (ogType || "(missing)"));
  console.log("  og:site_name:   " + (ogSiteName || "(missing)"));

  console.log("\n  --- Twitter cards ---");
  var twitterTitle = $('meta[name="twitter:title"]').attr("content");
  var twitterDescription = $('meta[name="twitter:description"]').attr("content");
  var twitterImage = $('meta[name="twitter:image"]').attr("content");
  console.log("  twitter:title:       " + (twitterTitle || "(missing)"));
  console.log("  twitter:description: " + (twitterDescription ? twitterDescription.substring(0, 200) + "..." : "(missing)"));
  console.log("  twitter:image:       " + (twitterImage || "(missing)"));

  console.log("\n  --- HTML title ---");
  console.log("  <title>: " + ($("title").text() || "(missing)"));

  console.log("\n============================================================");
  console.log("DONE");
  console.log("============================================================");
}

main();
