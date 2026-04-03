import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  telegramChatId: z.string().optional().nullable(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, phone, telegramChatId, currentPassword, newPassword } = parsed.data;

  // Password change requires current password verification
  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Вкажіть поточний пароль" }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const valid = user && await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Невірний поточний пароль" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(telegramChatId !== undefined && { telegramChatId }),
      ...(newPassword && { password: await bcrypt.hash(newPassword, 10) }),
    },
    select: { id: true, name: true, email: true, phone: true, photoUrl: true, agentToken: true, role: true, telegramChatId: true },
  });

  return NextResponse.json(updated);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const sharp = (await import("sharp")).default;
  const filename = `${uuidv4()}.webp`;
  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  fs.mkdirSync(dir, { recursive: true });
  await sharp(buffer).resize(200, 200, { fit: "cover" }).webp({ quality: 90 }).toFile(path.join(dir, filename));

  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { photoUrl: true } });
  if (existing?.photoUrl) {
    const old = path.join(process.cwd(), "public", existing.photoUrl);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }

  const photoUrl = `/uploads/avatars/${filename}`;
  await prisma.user.update({ where: { id: userId }, data: { photoUrl } });
  return NextResponse.json({ photoUrl });
}
