import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unpublishFromOlx } from "@/lib/olx";

export async function POST(
  _req: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const property = await prisma.property.findUnique({
    where: { id: params.propertyId },
    select: { id: true, olxAdId: true },
  });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!property.olxAdId) return NextResponse.json({ error: "Не опубліковано" }, { status: 400 });

  await unpublishFromOlx(property.olxAdId);

  await prisma.property.update({
    where: { id: property.id },
    data: { olxAdId: null, olxPublishedAt: null },
  });

  return NextResponse.json({ ok: true });
}
