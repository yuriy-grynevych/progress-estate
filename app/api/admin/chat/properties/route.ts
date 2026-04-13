import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const properties = await prisma.property.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { titleUk: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, slug: true, titleUk: true, address: true },
    take: 8,
  });

  return NextResponse.json(properties);
}
