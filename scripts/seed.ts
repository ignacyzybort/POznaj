import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const events = [
  {
    title: "Koncert: Lao Che",
    description: "Legendarna polska alternatywa na żywo w klubie B17. Bilety dostępne online.",
    imageUrl: "https://picsum.photos/seed/lao-che-concert/600/400",
    sourceUrl: "https://www.facebook.com/events/example1",
    startDate: new Date("2026-05-20"),
    endDate: new Date("2026-05-20"),
    time: "20:00",
    placeName: "Klub B17",
    address: "Bułgarska 17, Poznań",
    district: "Jezyce" as const,
    category: "Muzyka" as const,
    vibe: "Impreza" as const,
    source: "manual",
    sourceId: "manual-1",
  },
  {
    title: "Festiwal Sztuki Współczesnej",
    description: "Trzydniowy festiwal sztuki współczesnej w Starym Browarze. Wystawy, performanse, warsztaty.",
    imageUrl: "https://picsum.photos/seed/sztuka-festiwal/600/400",
    sourceUrl: "https://www.facebook.com/events/example2",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-03"),
    time: "10:00",
    placeName: "Stary Browar",
    address: "Półwiejska 42, Poznań",
    district: "StareMiasto" as const,
    category: "Sztuka" as const,
    vibe: "Kulturalne" as const,
    source: "manual",
    sourceId: "manual-2",
  },
  {
    title: "Seans: Strefa interesów",
    description: "Pokaz nagrodzonego Oscarami filmu w Kinie Muza. Po seansie dyskusja z krytykiem filmowym.",
    imageUrl: "https://picsum.photos/seed/kino-strefa/600/400",
    sourceUrl: "https://www.facebook.com/events/example3",
    startDate: new Date("2026-05-18"),
    endDate: new Date("2026-05-18"),
    time: "18:30",
    placeName: "Kino Muza",
    address: "Święty Marcin 30, Poznań",
    district: "StareMiasto" as const,
    category: "Kino" as const,
    vibe: "Randka" as const,
    source: "manual",
    sourceId: "manual-3",
  },
  {
    title: "Poznański Bieg Uliczny",
    description: "Bieg na 10 km przez centrum Poznania. Zapisy online, trasa prowadzi przez Maltę i Śródkę.",
    imageUrl: "https://picsum.photos/seed/bieg-poznan/600/400",
    sourceUrl: "https://www.facebook.com/events/example4",
    startDate: new Date("2026-05-25"),
    endDate: new Date("2026-05-25"),
    time: "09:00",
    placeName: "Maltanka",
    address: "Wiankowa 2, Poznań",
    district: "NoweMiasto" as const,
    category: "Sport" as const,
    vibe: "Aktywne" as const,
    source: "manual",
    sourceId: "manual-4",
  },
  {
    title: "Warsztaty kulinarne: Kuchnia włoska",
    description: "Naucz się robić prawdziwą pizzę i makaron od włoskiego szefa kuchni. W cenie degustacja win.",
    imageUrl: "https://picsum.photos/seed/kuchnia-warsztaty/600/400",
    sourceUrl: "https://www.facebook.com/events/example5",
    startDate: new Date("2026-05-22"),
    endDate: new Date("2026-05-22"),
    time: "17:00",
    placeName: "Szkoła Gotowania Kucharz",
    address: "Głogowska 45, Poznań",
    district: "Lazarz" as const,
    category: "Jedzenie" as const,
    vibe: "WyjscieZeZnajomymi" as const,
    source: "manual",
    sourceId: "manual-5",
  },
  {
    title: "Spektakl: Moralność Pani Dulskiej",
    description: "Klasyka polskiej literatury w nowej adaptacji Teatru Polskiego w Poznaniu.",
    imageUrl: "https://picsum.photos/seed/teatr-dulska/600/400",
    sourceUrl: "https://www.facebook.com/events/example6",
    startDate: new Date("2026-05-28"),
    endDate: new Date("2026-05-28"),
    time: "19:00",
    placeName: "Teatr Polski",
    address: "27 Grudnia 8/10, Poznań",
    district: "StareMiasto" as const,
    category: "Teatr" as const,
    vibe: "Kulturalne" as const,
    source: "manual",
    sourceId: "manual-6",
  },
  {
    title: "Piknik Rodzinny na Malcie",
    description: "Wielki piknik z atrakcjami dla dzieci, grami, jedzeniem i muzyką na żywo nad Maltą.",
    imageUrl: "https://picsum.photos/seed/piknik-malta/600/400",
    sourceUrl: "https://www.facebook.com/events/example7",
    startDate: new Date("2026-06-08"),
    endDate: new Date("2026-06-08"),
    time: "11:00",
    placeName: "Malta",
    address: "Maltańska 1, Poznań",
    district: "NoweMiasto" as const,
    category: "Inne" as const,
    vibe: "Rodzinne" as const,
    source: "manual",
    sourceId: "manual-7",
  },
  {
    title: "Konferencja: Poznań Tech Summit",
    description: "Największa konferencja technologiczna w Wielkopolsce. AI, blockchain, UX — prelekcje ekspertów.",
    imageUrl: "https://picsum.photos/seed/tech-summit/600/400",
    sourceUrl: "https://www.facebook.com/events/example8",
    startDate: new Date("2026-06-15"),
    endDate: new Date("2026-06-16"),
    time: "09:00",
    placeName: "Międzynarodowe Targi Poznańskie",
    address: "Głogowska 14, Poznań",
    district: "Grunwald" as const,
    category: "Konferencje" as const,
    vibe: "Aktywne" as const,
    source: "manual",
    sourceId: "manual-8",
  },
  {
    title: "Wernisaż: Malarstwo Wielkiego Formatu",
    description: "Wystawa prac młodych artystów z Poznania. Wstęp wolny, po wernisażu spotkanie z twórcami.",
    imageUrl: "https://picsum.photos/seed/wernisaz/600/400",
    sourceUrl: "https://www.facebook.com/events/example9",
    startDate: new Date("2026-05-16"),
    endDate: new Date("2026-06-01"),
    time: "18:00",
    placeName: "Galeria Miejska Arsenał",
    address: "Stary Rynek 6, Poznań",
    district: "StareMiasto" as const,
    category: "Sztuka" as const,
    vibe: "Spokojne" as const,
    source: "manual",
    sourceId: "manual-9",
  },
  {
    title: "Koncert: Mela Koteluk",
    description: "Koncert w klimatycznej Sali Ziemi. Gościnnie: występ supportu.",
    imageUrl: "https://picsum.photos/seed/mela-koteluk/600/400",
    sourceUrl: "https://www.facebook.com/events/example10",
    startDate: new Date("2026-06-05"),
    endDate: new Date("2026-06-05"),
    time: "20:00",
    placeName: "Sala Ziemi",
    address: "Głogowska 14, Poznań",
    district: "Grunwald" as const,
    category: "Muzyka" as const,
    vibe: "Randka" as const,
    source: "manual",
    sourceId: "manual-10",
  },
  {
    title: "Joga w Parku Cytadela",
    description: "Poranna joga na świeżym powietrzu. Przynieś matę i wygodny strój. Dla początkujących i zaawansowanych.",
    imageUrl: "https://picsum.photos/seed/joga-cytadela/600/400",
    sourceUrl: "https://www.facebook.com/events/example11",
    startDate: new Date("2026-05-17"),
    endDate: new Date("2026-09-30"),
    time: "08:00",
    placeName: "Park Cytadela",
    address: "Aleja Armii Poznań, Poznań",
    district: "Winogrady" as const,
    category: "Sport" as const,
    vibe: "Spokojne" as const,
    source: "manual",
    sourceId: "manual-11",
  },
  {
    title: "Nocne zwiedzanie Starego Miasta",
    description: "Spacer z przewodnikiem po nocnym Starym Rynku i okolicach. Poznaj sekrety Poznania!",
    imageUrl: "https://picsum.photos/seed/zwiedzanie-nocne/600/400",
    sourceUrl: "https://www.facebook.com/events/example12",
    startDate: new Date("2026-05-23"),
    endDate: new Date("2026-05-23"),
    time: "22:00",
    placeName: "Stary Rynek",
    address: "Stary Rynek, Poznań",
    district: "StareMiasto" as const,
    category: "Inne" as const,
    vibe: "WyjscieZeZnajomymi" as const,
    source: "manual",
    sourceId: "manual-12",
  },
];

async function main() {
  console.log("Seeding database...");

  for (const event of events) {
    const { sourceId, ...rest } = event;
    try {
      await prisma.event.upsert({
        where: {
          title_startDate_placeName: {
            title: event.title,
            startDate: event.startDate,
            placeName: event.placeName,
          },
        },
        update: {},
        create: {
          ...rest,
          sourceId: event.sourceId ?? undefined,
        },
      });
      console.log(`  ✓ ${event.title}`);
    } catch (e) {
      console.error(`  ✗ ${event.title}: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
