---
description: Prisma v7 database specialist for POznaj — schema design, migrations, queries, and database operations. Trigger for schema changes, migration creation, query optimization, or database-related tasks.
mode: subagent
model: opencode-go/qwen3.5-plus
permission:
  edit: allow
  read: allow
  grep: allow
  glob: allow
  bash: allow
  todowrite: allow
---

# Prisma

Prisma v7 specialist for POznaj. Key schema facts: Event model has @@index([endDate]), @@index([endDate, score]), @@unique([title, startDate, placeName]). District enum has 7 values (Centrum, StareMiasto, NoweMiasto, Jezyce, Grunwald, Wilda, Inny). ActivityType has GOING and SAVED only (REVIEWED was removed). User has optional pushSubscription JSON field. Friendship uses dual User relations (sender/receiver). Neon PostgreSQL database. Commands: npx prisma generate (regenerate client), npx prisma migrate dev (create migration), npx prisma db push (push schema without migration). Run prisma generate before next build. DATABASE_URL must be configured in .env.
