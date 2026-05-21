const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w300";
const API_KEY = process.env.TMDB_API_KEY;

const cache = new Map<string, string | null>();

export async function fetchMoviePoster(title: string): Promise<string | null> {
  const key = title.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key) ?? null;
  if (!API_KEY) { cache.set(key, null); return null; }

  try {
    const res = await fetch(
      `${BASE}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}&language=pl`,
    );
    if (!res.ok) { cache.set(key, null); return null; }
    const data = await res.json() as any;
    const poster = data.results?.[0]?.poster_path;
    const url = poster ? `${IMG}${poster}` : null;
    cache.set(key, url);
    return url;
  } catch {
    cache.set(key, null);
    return null;
  }
}
