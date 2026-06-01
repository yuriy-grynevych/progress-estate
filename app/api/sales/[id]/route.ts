import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const data: any = {};
  if (body.photos !== undefined) data.photos = body.photos;
  if (body.note !== undefined) data.note = body.note;
  const sale = await prisma.sale.update({ where: { id: params.id }, data });
  return NextResponse.json(sale);
}
