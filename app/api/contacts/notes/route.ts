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

  // Filter by which agent's contacts these notes belong to
  const contactWhere =
    role === "ADMIN" && agentId
      ? { assignedUserId: agentId }
      : role === "ADMIN"
      ? {}
      : { assignedUserId: currentUserId };

  const notes = await prisma.contactNote.findMany({
    where: { contact: contactWhere },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      contact: { select: { id: true, name: true, type: true } },
      user: { select: { name: true } },
    },
  });

  return NextResponse.json(notes);
}
