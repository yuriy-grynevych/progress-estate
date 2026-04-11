import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const ALLOWED_VIDEOS = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const propertyId = formData.get("propertyId") as string;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!propertyId) return NextResponse.json({ error: "No propertyId" }, { status: 400 });

  const isVideo = ALLOWED_VIDEOS.includes(file.type);
  const isImage = ALLOWED_IMAGES.includes(file.type);

  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File too large (max ${isVideo ? "100MB" : "10MB"})` },
      { status: 400 }
    );
  }

  const ext = isVideo ? "mp4" : file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads", propertyId);

  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, filename), buffer);

  const url = `/uploads/${propertyId}/${filename}`;

  const existingCount = await prisma.propertyImage.count({ where: { propertyId } });
  const image = await prisma.propertyImage.create({
    data: {
      propertyId,
      url,
      order: existingCount,
      isPrimary: existingCount === 0,
    },
  });

  return NextResponse.json(image, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageId } = await req.json();
  const image = await prisma.propertyImage.findUnique({ where: { id: imageId } });
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete local file
  try {
    const { unlink } = await import("fs/promises");
    const filePath = join(process.cwd(), "public", image.url);
    await unlink(filePath);
  } catch {}

  await prisma.propertyImage.delete({ where: { id: imageId } });
  return NextResponse.json({ success: true });
}
