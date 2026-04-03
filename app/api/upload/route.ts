import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function uploadToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  const base64 = buffer.toString("base64");
  const dataUri = `data:image/jpeg;base64,${base64}`;

  const formData = new FormData();
  formData.append("file", dataUri);
  formData.append("upload_preset", "unsigned_preset");
  formData.append("folder", folder);

  // Use signed upload instead
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000);

  const signString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const crypto = await import("crypto");
  const signature = crypto.createHash("sha1").update(signString).digest("hex");

  const fd = new FormData();
  fd.append("file", dataUri);
  fd.append("folder", folder);
  fd.append("timestamp", String(timestamp));
  fd.append("api_key", apiKey);
  fd.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary error: ${err}`);
  }

  const data = await res.json();
  return data.secure_url as string;
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
  const url = await uploadToCloudinary(buffer, `properties/${propertyId}`);

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

  // Delete from Cloudinary
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;
    const publicId = image.url.split("/upload/")[1]?.replace(/\.[^.]+$/, "");
    if (publicId) {
      const timestamp = Math.floor(Date.now() / 1000);
      const crypto = await import("crypto");
      const signature = crypto.createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex");
      const fd = new FormData();
      fd.append("public_id", publicId);
      fd.append("timestamp", String(timestamp));
      fd.append("api_key", apiKey);
      fd.append("signature", signature);
      await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: "POST", body: fd });
    }
  } catch {}

  await prisma.propertyImage.delete({ where: { id: imageId } });
  return NextResponse.json({ success: true });
}
