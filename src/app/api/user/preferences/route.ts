import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { District } from "@prisma/client";

const HANDLE_REGEX = /^[a-z0-9_]{2,30}$/;
const BIO_MAX = 500;

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { district?: unknown; handle?: unknown; bio?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: { district?: District; handle?: string; bio?: string } = {};

  if (body.district !== undefined && body.district !== null) {
    if (typeof body.district !== "string" || !(body.district in District)) {
      return NextResponse.json({ error: "Invalid district" }, { status: 400 });
    }
    data.district = body.district as District;
  }

  if (body.handle !== undefined && body.handle !== null) {
    if (typeof body.handle !== "string" || !HANDLE_REGEX.test(body.handle)) {
      return NextResponse.json(
        { error: "Handle must be 2-30 chars: a-z, 0-9, underscore" },
        { status: 400 },
      );
    }
    data.handle = body.handle;
  }

  if (body.bio !== undefined && body.bio !== null) {
    if (typeof body.bio !== "string" || body.bio.length > BIO_MAX) {
      return NextResponse.json(
        { error: `Bio must be a string up to ${BIO_MAX} chars` },
        { status: 400 },
      );
    }
    data.bio = body.bio;
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
    });
    return NextResponse.json({ user });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "Handle already taken" }, { status: 409 });
    }
    throw err;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          attendance: true,
          savedEvents: true,
          sentFriendships: true,
        },
      },
    },
  });

  return NextResponse.json({ user });
}
