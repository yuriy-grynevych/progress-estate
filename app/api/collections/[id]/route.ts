import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const collection = await prisma.collection.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, agentToken: true, photoUrl: true, phone: true, accentColor: true } },
      items: {
        orderBy: { order: "asc" },
        include: {
          property: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(collection);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const collection = await prisma.collection.findUnique({ where: { id: params.id } });
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (collection.userId !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, propertyIds } = body as { name?: string; propertyIds?: string[] };

  const updated = await prisma.collection.update({
    where: { id: params.id },
    data: {
      ...(name?.trim() ? { name: name.trim() } : {}),
      ...(propertyIds
        ? {
            items: {
              deleteMany: {},
              create: propertyIds.map((propertyId, order) => ({ propertyId, order })),
            },
          }
        : {}),
    },
    include: {
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const collection = await prisma.collection.findUnique({ where: { id: params.id } });
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (collection.userId !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.collection.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
