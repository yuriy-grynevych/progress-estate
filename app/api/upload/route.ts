import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { createHash } from "crypto";
import sharp from "sharp";
import { extractPublicId, isCloudinary } from "@/lib/cloudinary";

const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const ALLOWED_VIDEOS = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

async function uploadToCloudinary(buffer: Buffer, folder: string, isVideo = false): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const publicId = `${folder}/${randomUUID()}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const resourceType = isVideo ? "video" : "image";

  const sigStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(sigStr).digest("hex");

  const base64 = buffer.toString("base64");
  const mimeType = isVideo ? "video/mp4" : "image/webp";
  const dataUri = `data:${mimeType};base64,${base64}`;

  const fd = new FormData();
  fd.append("file", dataUri);
  fd.append("public_id", publicId);
  fd.append("timestamp", String(timestamp));
  fd.append("api_key", apiKey);
  fd.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: fd }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }
  const data = await res.json();
  return data.secure_url as string;
}

async function deleteFromCloudinary(url: string, isVideo = false): Promise<void> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const publicId = extractPublicId(url);
  if (!publicId) return;

  const timestamp = Math.floor(Date.now() / 1000);
  const resourceType = isVideo ? "video" : "image";
  const sigStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(sigStr).digest("hex");

  const fd = new FormData();
  fd.append("public_id", publicId);
  fd.append("timestamp", String(timestamp));
  fd.append("api_key", apiKey);
  fd.append("signature", signature);

  await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    { method: "POST", body: fd }
  );
}

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

  let buffer = Buffer.from(await file.arrayBuffer());

  if (isImage) {
    buffer = await sharp(buffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  }

  const folder = `properties/${propertyId}`;
  const url = await uploadToCloudinary(buffer, folder, isVideo);

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

  if (isCloudinary(image.url)) {
    const isVideo = /\.(mp4|webm|mov)$/i.test(image.url);
    await deleteFromCloudinary(image.url, isVideo);
  } else {
    try {
      const { unlink } = await import("fs/promises");
      const { join } = await import("path");
      await unlink(join(process.cwd(), "public", image.url));
    } catch {}
  }

  await prisma.propertyImage.delete({ where: { id: imageId } });
  return NextResponse.json({ success: true });
}
