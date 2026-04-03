import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

async function processImage(buffer: Buffer, outputPath: string) {
  const sharp = (await import("sharp")).default;
  await sharp(buffer)
    .resize(200, 200, { fit: "cover", position: "center" })
    .webp({ quality: 90 })
    .toFile(outputPath);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const userId = formData.get("userId") as string;

  if (!file || !userId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${uuidv4()}.webp`;
  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  fs.mkdirSync(dir, { recursive: true });
  const outputPath = path.join(dir, filename);

  await processImage(buffer, outputPath);

  const photoUrl = `/uploads/avatars/${filename}`;

  // Delete old photo if exists
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { photoUrl: true } });
  if (existing?.photoUrl) {
    const oldPath = path.join(process.cwd(), "public", existing.photoUrl);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  await prisma.user.update({ where: { id: userId }, data: { photoUrl } });

  return NextResponse.json({ photoUrl }, { status: 201 });
}
