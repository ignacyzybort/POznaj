import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { syncReminders } from "../src/lib/reminders";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

syncReminders(prisma)
  .then((result) => {
    console.log(
      `[reminders] checked ${result.checked}, scheduled ${result.scheduled}, cancelled ${result.cancelled}`
    );
  })
  .catch((e) => {
    console.error("[reminders] sync failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
