import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { recomputeAllScores } from "../src/lib/scoring";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log("[recompute-scores] Starting...");
  const updated = await recomputeAllScores(prisma);
  console.log(`[recompute-scores] Done — ${updated} events updated`);

  await prisma.$disconnect();
}

main();
