import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file") as File;
  const type = form.get("type") as string;

  if (!file || !["avatar", "cover"].includes(type)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const blob = await put(`profiles/${type}-${session.user.id}-${Date.now()}`, file, {
    access: "public",
  });

  const updateData = type === "avatar" ? { image: blob.url } : { coverImage: blob.url };
  await prisma.user.update({ where: { id: session.user.id }, data: updateData });

  return NextResponse.json({ url: blob.url });
}
