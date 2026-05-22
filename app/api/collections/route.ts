import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const collections = await prisma.collection.findMany({
    where: role === "ADMIN" ? undefined : { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
      user: { select: { name: true, agentToken: true } },
    },
  });

  return NextResponse.json(collections);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const body = await req.json();
  const { name, propertyIds } = body as { name: string; propertyIds?: string[] };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = randomUUID().slice(0, 8);

  const collection = await prisma.collection.create({
    data: {
      name: name.trim(),
      slug,
      userId,
      ...(propertyIds?.length
        ? {
            items: {
              create: propertyIds.map((propertyId, order) => ({ propertyId, order })),
            },
          }
        : {}),
    },
    include: {
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json(collection, { status: 201 });
}
