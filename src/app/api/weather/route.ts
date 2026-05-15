import { NextRequest, NextResponse } from "next/server";

const CACHE = new Map<string, { data: any; expires: number }>();

export async function GET(request: NextRequest) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Weather unavailable" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");
  const eventTime = searchParams.get("time");

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  const cacheKey = `${lat},${lon}`;
  const cached = CACHE.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    // If cached but event time differs, still use cache (forecast data doesn't change)
    return NextResponse.json(cached.data);
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pl&appid=${apiKey}`,
      { next: { revalidate: 600 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Weather fetch failed" }, { status: 502 });
    }

    const data = await res.json();
    const forecasts: any[] = data.list ?? [];

    let forecast: any;
    if (eventTime && forecasts.length > 0) {
      const target = parseInt(eventTime);
      forecast = forecasts.reduce((best, f) => {
        const diff = Math.abs(f.dt * 1000 - target);
        return diff < Math.abs(best.dt * 1000 - target) ? f : best;
      }, forecasts[0]);
    } else {
      forecast = forecasts[0];
    }

    const result = {
      temp: Math.round(forecast.main?.temp ?? 0),
      condition: forecast.weather?.[0]?.description ?? "",
      icon: forecast.weather?.[0]?.icon ?? "01d",
      rain: (forecast.rain?.["3h"] ?? 0) > 0 || forecast.pop > 0.3,
      wind: Math.round(forecast.wind?.speed ?? 0),
      pop: Math.round((forecast.pop ?? 0) * 100),
    };

    CACHE.set(cacheKey, { data: result, expires: Date.now() + 600_000 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Weather unavailable" }, { status: 502 });
  }
}
