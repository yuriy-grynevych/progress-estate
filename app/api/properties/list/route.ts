import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search");
  const type = searchParams.get("type");
  const listingType = searchParams.get("listingType");
  const rooms = searchParams.get("rooms");
  const district = searchParams.get("district");

  const where: any = {
    status: "ACTIVE",
    ...(type && { type }),
    ...(listingType && { listingType }),
    ...(rooms && { rooms: parseInt(rooms) }),
    ...(district && { district: { contains: district, mode: "insensitive" } }),
    ...(search && {
      OR: [
        { titleUk: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const properties = await prisma.property.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      slug: true,
      titleUk: true,
      price: true,
      currency: true,
      type: true,
      listingType: true,
      areaSqm: true,
      rooms: true,
      district: true,
      address: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true },
      },
    },
  });

  return NextResponse.json(properties);
}
