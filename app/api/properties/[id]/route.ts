import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { propertySchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import fs from "fs";
import path from "path";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const property = await prisma.property.findFirst({
    where: { OR: [{ id: params.id }, { slug: params.id }] },
    include: { images: { orderBy: { order: "asc" } } },
  });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.property.update({ where: { id: property.id }, data: { viewCount: { increment: 1 } } });
  return NextResponse.json(property);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role as string;
  const currentUserId = (session.user as any).id as string;

  // Employees can only edit their own properties
  if (role === "EMPLOYEE") {
    const existing = await prisma.property.findUnique({ where: { id: params.id }, select: { assignedUserId: true } });
    if (existing?.assignedUserId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json();
  const parsed = propertySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Preserve assignedUserId from body (admin can change, employee stays theirs)
  const assignedUserId =
    role === "EMPLOYEE"
      ? currentUserId
      : body.assignedUserId !== undefined
      ? body.assignedUserId || null
      : undefined;

  // Build audit diff
  const existing = await prisma.property.findUnique({ where: { id: params.id } });
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  const tracked = ["titleUk", "titleEn", "price", "status", "listingType", "type", "district", "address", "areaSqm", "rooms", "floor", "assignedUserId"] as const;
  for (const key of tracked) {
    const oldVal = existing?.[key];
    const newVal = key === "assignedUserId" ? (assignedUserId !== undefined ? assignedUserId : oldVal) : (parsed.data as any)[key];
    if (newVal !== undefined && String(oldVal) !== String(newVal)) {
      changes[key] = { from: oldVal, to: newVal };
    }
  }

  const [property] = await prisma.$transaction([
    prisma.property.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        ...(assignedUserId !== undefined && { assignedUserId }),
      } as any,
      include: { images: true },
    }),
    ...(Object.keys(changes).length > 0
      ? [prisma.propertyAuditLog.create({
          data: {
            propertyId: params.id,
            userId: currentUserId,
            userName: (session.user as any).name ?? (session.user as any).email ?? "Unknown",
            changes,
          },
        })]
      : []),
  ]);

  return NextResponse.json(property);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admin can delete
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const property = await prisma.property.findUnique({ where: { id: params.id }, include: { images: true } });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "properties", params.id);
  if (fs.existsSync(uploadsDir)) fs.rmSync(uploadsDir, { recursive: true });

  await prisma.property.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
