import { NextRequest, NextResponse } from "next/server";

const CACHE = new Map<string, { data: any; expires: number }>();
const STEP_SECONDS = 3 * 60 * 60;

export async function GET(request: NextRequest) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Weather unavailable" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");
  const eventTime = Number(searchParams.get("time") ?? "");

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  const targetMs = Number.isFinite(eventTime) && eventTime > 0 ? eventTime : Date.now();
  const targetSeconds = Math.floor(targetMs / 1000);
  const bucket = Math.round(targetSeconds / STEP_SECONDS);
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)},${bucket}`;

  const cached = CACHE.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
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
    if (forecasts.length === 0) {
      return NextResponse.json({ available: false, reason: "no_forecast" });
    }

    const first = forecasts[0].dt as number;
    const last = (forecasts[forecasts.length - 1].dt as number) + STEP_SECONDS;

    if (targetSeconds > last + STEP_SECONDS || targetSeconds < first - STEP_SECONDS) {
      return NextResponse.json({ available: false, reason: "out_of_range" });
    }

    const forecast = forecasts.reduce((best, f) => {
      const diff = Math.abs(f.dt * 1000 - targetMs);
      return diff < Math.abs(best.dt * 1000 - targetMs) ? f : best;
    }, forecasts[0]);

    const result = {
      available: true,
      temp: Math.round(forecast.main?.temp ?? 0),
      condition: forecast.weather?.[0]?.description ?? "",
      icon: forecast.weather?.[0]?.icon ?? "01d",
      rain: (forecast.rain?.["3h"] ?? 0) > 0 || forecast.pop > 0.3,
      wind: Math.round(forecast.wind?.speed ?? 0),
      pop: Math.round((forecast.pop ?? 0) * 100),
      at: new Date(forecast.dt * 1000).toISOString(),
    };

    CACHE.set(cacheKey, { data: result, expires: Date.now() + 600_000 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Weather unavailable" }, { status: 502 });
  }
}
