import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recomputeAllScores } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await recomputeAllScores(prisma);
    return NextResponse.json({ updated });
  } catch (e) {
    console.error("[cron] recompute-scores error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
