import axios from "axios";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const mnp = await axios.get("https://mnp.art.pl/wp-json/wp/v2/tribe_events?per_page=2", {
  headers: {"User-Agent": UA}, timeout: 10000
});
console.log("Total:", mnp.headers["x-wp-total"]);
const ev = mnp.data[0];
console.log("All keys:", Object.keys(ev).join(", "));
console.log("Title:", ev.title?.rendered);
console.log("Link:", ev.link);
console.log("start_date:", ev.start_date);
console.log("end_date:", ev.end_date);
console.log("all_day:", ev.all_day);
console.log("start_date_details:", JSON.stringify(ev.start_date_details || {}).slice(0, 300));
console.log("end_date_details:", JSON.stringify(ev.end_date_details || {}).slice(0, 300));
console.log("venue:", JSON.stringify(ev.venue).slice(0, 500));
console.log("organizer:", JSON.stringify(ev.organizer).slice(0, 300));
console.log("cost:", ev.cost);
console.log("event_status:", ev.event_status);
console.log("featured_media:", ev.featured_media);
console.log("yoast OG title:", ev.yoast_head_json?.og_title);
console.log("yoast OG desc:", (ev.yoast_head_json?.og_description || "").slice(0, 150));
console.log("yoast OG image:", ev.yoast_head_json?.og_image?.[0]?.url);

// What about meta/tribe_meta?
if (ev.meta) console.log("meta:", JSON.stringify(ev.meta).slice(0, 500));
if (ev.tribe_meta) console.log("tribe_meta:", JSON.stringify(ev.tribe_meta).slice(0, 500));
