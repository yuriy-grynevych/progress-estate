import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
async function uploadAvatarToCloudinary(buffer: Buffer, userId: string): Promise<string> {
  const base64 = buffer.toString("base64");
  const dataUri = `data:image/jpeg;base64,${base64}`;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const folder = "avatars";
  const publicId = `avatars/avatar_${userId}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const crypto = await import("crypto");
  const signature = crypto.createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const fd = new FormData();
  fd.append("file", dataUri);
  fd.append("public_id", publicId);
  fd.append("timestamp", String(timestamp));
  fd.append("api_key", apiKey);
  fd.append("signature", signature);
  fd.append("overwrite", "true");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url as string;
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  instagram: z.string().optional().nullable(),
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

  const { name, phone, instagram, telegramChatId, currentPassword, newPassword } = parsed.data;

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
      ...(instagram !== undefined && { instagram }),
      ...(telegramChatId !== undefined && { telegramChatId }),
      ...(newPassword && { password: await bcrypt.hash(newPassword, 10) }),
    },
    select: { id: true, name: true, email: true, phone: true, photoUrl: true, agentToken: true, role: true, telegramChatId: true, instagram: true },
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
  const photoUrl = await uploadAvatarToCloudinary(buffer, userId);
  await prisma.user.update({ where: { id: userId }, data: { photoUrl } });
  return NextResponse.json({ photoUrl });
}
