import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishToOlx } from "@/lib/olx";

export async function POST(
  _req: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const property = await prisma.property.findUnique({
    where: { id: params.propertyId },
    include: { images: { orderBy: { order: "asc" } } },
  });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (property.olxAdId) {
    return NextResponse.json({ error: "Вже опубліковано на OLX" }, { status: 400 });
  }

  const adId = await publishToOlx({
    title: property.titleUk,
    description: property.descriptionUk || property.titleUk,
    price: Number(property.price),
    currency: property.currency,
    propertyType: property.type,
    listingType: property.listingType,
    rooms: property.rooms,
    floor: property.floor,
    totalFloors: property.totalFloors,
    areaSqm: property.areaSqm,
    images: property.images.map((i) => i.url),
    externalId: property.id,
  });

  await prisma.property.update({
    where: { id: property.id },
    data: { olxAdId: adId, olxPublishedAt: new Date() },
  });

  return NextResponse.json({ ok: true, adId });
}
