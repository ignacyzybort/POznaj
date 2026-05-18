import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recomputeAllScores } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: "Not configured" }, { status: 501 });
    }
    const auth = request.headers.get("authorization");
    if (!auth || auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await recomputeAllScores(prisma);
    return NextResponse.json({ updated });
  } catch (e) {
    console.error("[cron] recompute-scores error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
