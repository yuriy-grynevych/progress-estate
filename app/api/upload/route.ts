import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// sharp is imported dynamically to avoid SSR issues
async function processImage(buffer: Buffer, outputPath: string) {
  const sharp = (await import("sharp")).default;
  await sharp(buffer)
    .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(outputPath);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const propertyId = formData.get("propertyId") as string;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!propertyId) return NextResponse.json({ error: "No propertyId" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uuid = uuidv4();
  const filename = `${uuid}.webp`;
  const dir = path.join(process.cwd(), "public", "uploads", "properties", propertyId);
  fs.mkdirSync(dir, { recursive: true });
  const outputPath = path.join(dir, filename);

  await processImage(buffer, outputPath);

  const existingCount = await prisma.propertyImage.count({ where: { propertyId } });
  const image = await prisma.propertyImage.create({
    data: {
      propertyId,
      url: `/uploads/properties/${propertyId}/${filename}`,
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

  const filePath = path.join(process.cwd(), "public", image.url);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await prisma.propertyImage.delete({ where: { id: imageId } });
  return NextResponse.json({ success: true });
}
