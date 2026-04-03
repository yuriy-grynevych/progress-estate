import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  // Only admin or assigned agent can update owner
  if (role === "EMPLOYEE") {
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: { assignedUserId: true },
    });
    if (property?.assignedUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { ownerContactId } = await req.json();

  const updated = await prisma.property.update({
    where: { id: params.id },
    data: { ownerContactId: ownerContactId ?? null },
  });

  return NextResponse.json({ ok: true });
}
