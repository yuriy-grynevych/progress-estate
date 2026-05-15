import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUserId = (session.user as any).id as string;
  const role = (session.user as any).role as string;
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");

  const where: any = {
    deletedAt: { not: null },
    ...(role === "ADMIN" && agentId ? { assignedUserId: agentId } : {}),
    ...(role === "EMPLOYEE" ? { assignedUserId: currentUserId } : {}),
  };

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { deletedAt: "desc" },
    include: { assignedUser: { select: { id: true, name: true } } },
  });

  return NextResponse.json(contacts);
}
