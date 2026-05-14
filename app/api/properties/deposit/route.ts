import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any)?.role;
  const userId = (session.user as any)?.id;
  const where: any = { status: "DEPOSIT" };
  if (role !== "ADMIN") where.assignedUserId = userId;
  const properties = await prisma.property.findMany({
    where,
    select: { id: true, titleUk: true, district: true, price: true, currency: true, areaSqm: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(properties);
}
