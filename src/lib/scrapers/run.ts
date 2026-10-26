import { PikPoznanScraper } from "./pikpoznan";
import { KulturaPoznanScraper } from "./kultura-poznan";
import { PoznanCinemaScraper } from "./cinema-poznan";
import { MnpScraper } from "./mnp";
import { PutScraper } from "./put";
import { FacebookScraper } from "./facebook";
import { pruneLegacyEvents, saveEvents, Scraper } from "./base";
import { recomputeAllScores } from "@/lib/scoring";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const scrapers: Scraper[] = [
  new PikPoznanScraper(),
  new KulturaPoznanScraper(),
  new PoznanCinemaScraper(),
  new MnpScraper(),
  new PutScraper(),
  new FacebookScraper(),
];

async function runAll() {
  console.log(`[Scraper] Starting ${scrapers.length} scrapers...`);

  for (const scraper of scrapers) {
    console.log(`[Scraper] Running ${scraper.name}...`);
    const start = Date.now();

    try {
      // Rows touched by this run are protected by the cutoff, so anything pruned
      // here is stale output from an older, structurally broken parser.
      const runStart = new Date();
      const events = await scraper.scrape();
      const scrapedKeys = events.map((e) => ({
        title: e.title,
        startDate: e.startDate,
        placeName: e.placeName,
        sourceId: e.sourceId,
      }));
      let pruned = 0;
      if (events.length > 0) {
        pruned += await pruneLegacyEvents(prisma, scraper.name, runStart, scrapedKeys, "pre");
      }
      const result = await saveEvents(prisma, events);
      if (events.length > 0) {
        pruned += await pruneLegacyEvents(prisma, scraper.name, runStart, scrapedKeys, "post");
      }
      console.log(
        `[Scraper] ${scraper.name}: ${events.length} found, ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors} errors, ${pruned} stale pruned (${Date.now() - start}ms)`
      );
    } catch (e) {
      console.error(`[Scraper] ${scraper.name} failed:`, e);
    }
  }

  console.log("[Scraper] Done.");

  const recomputed = await recomputeAllScores(prisma);
  console.log(`[Scraper] Scores recomputed: ${recomputed} events updated.`);

  await prisma.$disconnect();
}

runAll();
