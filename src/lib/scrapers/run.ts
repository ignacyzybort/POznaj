import { PikPoznanScraper } from "./pikpoznan";
import { PoznanPlScraper } from "./poznanpl";
import { FacebookScraper } from "./facebook";
import { saveEvents, Scraper } from "./base";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});

const scrapers: Scraper[] = [
  new PikPoznanScraper(),
  new PoznanPlScraper(),
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
  await prisma.$disconnect();
}

runAll();
