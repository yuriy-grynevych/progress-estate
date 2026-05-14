import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { id: true, titleUk: true, slug: true } },
      clientContact: { select: { id: true, name: true, phone: true } },
      agent: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const agentId = (session.user as any).id;

  // If OWN type, mark property as SOLD
  if (body.saleType === "OWN" && body.propertyId) {
    await prisma.property.update({
      where: { id: body.propertyId },
      data: { status: "SOLD" },
    });
  }

  const sale = await prisma.sale.create({
    data: {
      saleType: body.saleType ?? "OWN",
      propertyId: body.propertyId || null,
      externalName: body.externalName || null,
      externalAddress: body.externalAddress || null,
      clientContactId: body.clientContactId || null,
      clientName: body.clientName || null,
      clientPhone: body.clientPhone || null,
      commission: body.commission ? Number(body.commission) : null,
      commissionType: body.commissionType || "FIXED",
      currency: body.currency || "USD",
      saleDate: body.saleDate ? new Date(body.saleDate) : new Date(),
      note: body.note || null,
      agentId,
    },
  });
  return NextResponse.json(sale);
}
