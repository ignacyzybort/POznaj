import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RL_WINDOW_MS = 60_000;
const RL_AUTH_MAX = 30;
const RL_EXPENSIVE_MAX = 15;
const RL_DEFAULT_MAX = 100;

const rlStore = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: NextRequest, path: string): { key: string; max: number } {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "127.0.0.1";

  if (path.startsWith("/api/auth")) {
    // OAuth callback routes must never be rate-limited (NextAuth handles its own CSRF)
    if (path.startsWith("/api/auth/callback/")) return { key: "", max: Infinity };
    return { key: `${ip}::auth`, max: RL_AUTH_MAX };
  }
  if (path.startsWith("/api/upload") || path.startsWith("/api/weather") || path.startsWith("/api/events")) return { key: `${ip}::expensive`, max: RL_EXPENSIVE_MAX };
  if (path.startsWith("/api/")) return { key: `${ip}::api`, max: RL_DEFAULT_MAX };

  return { key: "", max: Infinity };
}

function checkRateLimit(key: string, max: number): boolean {
  if (max === Infinity || !key) return true;
  const now = Date.now();
  const entry = rlStore.get(key);
  if (!entry || now > entry.resetAt) {
    rlStore.set(key, { count: 1, resetAt: now + RL_WINDOW_MS });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function generateCsrfToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let token = "";
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 32; i++) token += chars[bytes[i] % chars.length];
  return token;
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const method = req.method ?? "GET";

  // NextAuth handles its own CSRF, rate limiting, and cookies.
  // Middleware must not interfere with auth routes.
  if (path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  if (path.startsWith("/api/")) {
    const { key, max } = getRateLimitKey(req, path);
    if (!checkRateLimit(key, max)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const isAuthRoute = path.startsWith("/api/auth");

  if (isStateChanging && !isAuthRoute && path.startsWith("/api/")) {
    const cookieToken = req.cookies.get("csrf-token")?.value;
    const headerToken = req.headers.get("x-csrf-token");

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
  }

  if (!req.cookies.get("csrf-token")?.value) {
    response.cookies.set("csrf-token", generateCsrfToken(), {
      httpOnly: false,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 86400,
    });
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
