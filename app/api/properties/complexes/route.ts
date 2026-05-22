import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.property.findMany({
    where: { residentialComplex: { not: null }, status: "ACTIVE" },
    select: { residentialComplex: true },
    distinct: ["residentialComplex"],
    orderBy: { residentialComplex: "asc" },
  });

  const list = rows
    .map((r) => r.residentialComplex!)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "uk"));

  return NextResponse.json(list);
}
