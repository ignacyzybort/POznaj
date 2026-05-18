import { PikPoznanScraper } from "./pikpoznan";
import { KulturaPoznanScraper } from "./kultura-poznan";
import { FacebookScraper } from "./facebook";
import { saveEvents, Scraper } from "./base";
import { recomputeAllScores } from "@/lib/scoring";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const scrapers: Scraper[] = [
  new PikPoznanScraper(),
  new KulturaPoznanScraper(),
  new FacebookScraper(),
];

async function runAll() {
  console.log(`[Scraper] Starting ${scrapers.length} scrapers...`);

  for (const scraper of scrapers) {
    console.log(`[Scraper] Running ${scraper.name}...`);
    const start = Date.now();

    try {
      const events = await scraper.scrape();
      const result = await saveEvents(prisma, events);
      console.log(
        `[Scraper] ${scraper.name}: ${events.length} found, ${result.created} created, ${result.updated} updated, ${result.errors} errors (${Date.now() - start}ms)`
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
