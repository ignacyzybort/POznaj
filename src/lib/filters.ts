import { District, Category, Vibe } from "../generated/prisma";

export const districts: { value: District; label: string }[] = [
  { value: "StareMiasto", label: "Stare Miasto" },
  { value: "Jezyce", label: "Jeżyce" },
  { value: "Lazarz", label: "Łazarz" },
  { value: "Grunwald", label: "Grunwald" },
  { value: "Wilda", label: "Wilda" },
  { value: "Rataje", label: "Rataje" },
  { value: "Piatkowo", label: "Piątkowo" },
  { value: "Winogrady", label: "Winogrady" },
  { value: "NoweMiasto", label: "Nowe Miasto" },
  { value: "Inny", label: "Inny" },
];

export const categories: { value: Category; label: string }[] = [
  { value: "Kino", label: "Kino" },
  { value: "Sztuka", label: "Sztuka" },
  { value: "Muzyka", label: "Muzyka" },
  { value: "Sport", label: "Sport" },
  { value: "Teatr", label: "Teatr" },
  { value: "Warsztaty", label: "Warsztaty" },
  { value: "Konferencje", label: "Konferencje" },
  { value: "Jedzenie", label: "Jedzenie" },
  { value: "Inne", label: "Inne" },
];

export const vibes: { value: Vibe; label: string }[] = [
  { value: "Randka", label: "Randka" },
  { value: "Impreza", label: "Impreza" },
  { value: "WyjscieZeZnajomymi", label: "Wyjście ze znajomymi" },
  { value: "Rodzinne", label: "Rodzinne" },
  { value: "Spokojne", label: "Spokojne" },
  { value: "Kulturalne", label: "Kulturalne" },
  { value: "Aktywne", label: "Aktywne" },
];

export const preferenceLabels: Record<string, string> = {
  StareMiasto: "Stare Miasto",
  Jezyce: "Jeżyce",
  Lazarz: "Łazarz",
  Grunwald: "Grunwald",
  Wilda: "Wilda",
  Rataje: "Rataje",
  Piatkowo: "Piątkowo",
  Winogrady: "Winogrady",
  NoweMiasto: "Nowe Miasto",
  Inny: "Inny",
  Kino: "Kino",
  Sztuka: "Sztuka",
  Muzyka: "Muzyka",
  Sport: "Sport",
  Teatr: "Teatr",
  Warsztaty: "Warsztaty",
  Konferencje: "Konferencje",
  Jedzenie: "Jedzenie",
  Inne: "Inne",
  Randka: "Randka",
  Impreza: "Impreza",
  WyjscieZeZnajomymi: "Wyjście ze znajomymi",
  Rodzinne: "Rodzinne",
  Spokojne: "Spokojne",
  Kulturalne: "Kulturalne",
  Aktywne: "Aktywne",
};
