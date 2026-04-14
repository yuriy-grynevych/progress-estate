import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const ALLOWED_VIDEOS = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

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

  const uploadDir = join(process.cwd(), "public", "uploads", propertyId);
  await mkdir(uploadDir, { recursive: true });

  let buffer = Buffer.from(await file.arrayBuffer());
  let filename: string;

  if (isVideo) {
    filename = `${randomUUID()}.mp4`;
    await writeFile(join(uploadDir, filename), buffer);
  } else {
    filename = `${randomUUID()}.webp`;
    const compressed = await sharp(buffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    await writeFile(join(uploadDir, filename), compressed);
  }

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

  try {
    await unlink(join(process.cwd(), "public", image.url));
  } catch {}

  await prisma.propertyImage.delete({ where: { id: imageId } });
  return NextResponse.json({ success: true });
}
