import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
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

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const ext = file.name?.split(".").pop() || "jpg";
    const filename = `${type}-${session.user.id}-${Date.now()}.${ext}`;
    let url: string;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import("@vercel/blob");
        const result = await put(`profiles/${filename}`, file, { access: "public" });
        url = result.url;
      } catch (blobError: any) {
        console.error("Vercel Blob failed:", blobError);
        return NextResponse.json({
          error: `Przesyłanie do Blob nie działa: ${blobError.message || "nieznany błąd"}. Skontaktuj się z administratorem.`,
        }, { status: 500 });
      }
    } else {
      // Local dev fallback
      const bytes = Buffer.from(await file.arrayBuffer());
      const dir = join(process.cwd(), "public", "uploads");
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, filename), bytes);
      url = `/uploads/${filename}`;
    }

    const updateData = type === "avatar" ? { image: url } : { coverImage: url };
    await prisma.user.update({ where: { id: session.user.id }, data: updateData });

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Wystąpił błąd podczas przesyłania. Spróbuj ponownie." }, { status: 500 });
  }
}
