import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const features = await prisma.feature.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(features);
}

const createSchema = z.object({
  labelUk: z.string().min(1),
  labelEn: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Generate value slug from Ukrainian label
  const value = parsed.data.labelUk
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-zа-яёіїєґ0-9_]/gi, "")
    .slice(0, 50) + "_" + Date.now().toString(36);

  const count = await prisma.feature.count();
  const feature = await prisma.feature.create({
    data: { value, labelUk: parsed.data.labelUk, labelEn: parsed.data.labelEn, order: count },
  });

  return NextResponse.json(feature, { status: 201 });
}
