import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
  const { propertyId } = body as { propertyId: string };
  if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

  const maxOrder = await prisma.collectionItem.aggregate({
    where: { collectionId: params.id },
    _max: { order: true },
  });

  const item = await prisma.collectionItem.upsert({
    where: { collectionId_propertyId: { collectionId: params.id, propertyId } },
    update: {},
    create: {
      collectionId: params.id,
      propertyId,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
  const { propertyId } = body as { propertyId: string };
  if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

  await prisma.collectionItem.deleteMany({
    where: { collectionId: params.id, propertyId },
  });

  return NextResponse.json({ success: true });
}
