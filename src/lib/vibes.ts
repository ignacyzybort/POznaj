export function guessVibes(title: string, desc: string, category: string): string[] {
  const t = (title + " " + desc).toLowerCase();
  const vibes: string[] = [];

  if (t.includes("randka") || t.includes("walentynki") || t.includes("romantycz") || t.includes("dla dwojga") || t.includes("we dwoje") || (t.includes("wieczór") && (t.includes("kolacja") || t.includes("muzyka") || t.includes("przy świec")))) vibes.push("Randka");
  if (t.includes("impreza") || t.includes("disco") || t.includes("club") || t.includes("dj") || t.includes("dance") || t.includes("after") || t.includes("tanecz") || t.includes("lata 80") || t.includes("lata 90") || t.includes("party") || t.includes("after party")) vibes.push("Impreza");
  if (t.includes("rodzin") || t.includes("dzieci") || t.includes("piknik") || t.includes("rodzinn") || t.includes("dzień dziecka") || t.includes("dla całej") || t.includes("bajk") || t.includes("animac") || t.includes("balon") || t.includes("warsztaty dla dzieci") || t.includes("dziecięcy")) vibes.push("Rodzinne");
  if (t.includes("spacer") || t.includes("spokoj") || t.includes("relaks") || t.includes("medytac") || t.includes("cisza") || t.includes("wycisz") || t.includes("joga") || t.includes("zwiedzanie") || t.includes("herbata") || t.includes("kawiarn")) vibes.push("Spokojne");
  if (t.includes("bieg") || t.includes("sport") || t.includes("aktywn") || t.includes("fitness") || t.includes("triathlon") || t.includes("rower") || t.includes("zawod") || t.includes("turniej") || t.includes("gimnast")) vibes.push("Aktywne");
  if (t.includes("znajom") || t.includes("spotkan") || t.includes("grupa") || t.includes("razem") || t.includes("towarzyst") || t.includes("wspólne") || t.includes("after") || t.includes("klub") || t.includes("bar")) vibes.push("WyjscieZeZnajomymi");

  if (vibes.length === 0) {
    return guessVibesForCategory(category);
  }

  const unique = [...new Set(vibes)];
  return unique.slice(0, 3);
}

export function guessVibesForCategory(category: string): string[] {
  if (category === "Muzyka") return ["Kulturalne", "Impreza"];
  if (category === "Teatr") return ["Kulturalne"];
  if (category === "Kino") return ["Kulturalne", "Randka"];
  if (category === "Sport") return ["Aktywne", "Rodzinne"];
  if (category === "Jedzenie") return ["WyjscieZeZnajomymi"];
  if (category === "Warsztaty") return ["Spokojne", "WyjscieZeZnajomymi"];
  if (category === "Sztuka") return ["Kulturalne", "Spokojne"];
  if (category === "Konferencje") return ["WyjscieZeZnajomymi", "Spokojne"];
  return ["Kulturalne"];
}
