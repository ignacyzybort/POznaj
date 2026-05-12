import { NextRequest, NextResponse } from "next/server";

const API_KEY = "6b2e1f8e66fb1d5b4d737fbeab84ef9c";
const CACHE = new Map<string, { data: any; expires: number }>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  const cacheKey = `${lat},${lon}`;
  const cached = CACHE.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pl&appid=${API_KEY}`,
      { next: { revalidate: 600 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Weather fetch failed" }, { status: 502 });
    }

    const data = await res.json();
    const result = {
      temp: Math.round(data.main?.temp ?? 0),
      condition: data.weather?.[0]?.description ?? "",
      icon: data.weather?.[0]?.icon ?? "01d",
      rain: (data.rain?.["1h"] ?? 0) > 0 || (data.clouds?.all ?? 0) > 70,
      wind: Math.round(data.wind?.speed ?? 0),
    };

    CACHE.set(cacheKey, { data: result, expires: Date.now() + 600_000 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Weather unavailable" }, { status: 502 });
  }
}
