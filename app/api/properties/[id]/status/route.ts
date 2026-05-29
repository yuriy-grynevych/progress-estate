import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const VALID_STATUSES = ["ACTIVE", "INACTIVE", "SOLD", "RENTED", "DEPOSIT"] as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const role = (session.user as any).role as string;
  const currentUserId = (session.user as any).id as string;

  const existing = await prisma.property.findUnique({
    where: { id: params.id },
    select: { status: true, assignedUserId: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (role === "EMPLOYEE" && existing.assignedUserId !== currentUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const statusChanged = existing.status !== status;

  await prisma.$transaction([
    prisma.property.update({ where: { id: params.id }, data: { status } }),
    ...(statusChanged
      ? [prisma.propertyAuditLog.create({
          data: {
            propertyId: params.id,
            userId: currentUserId,
            userName: (session.user as any).name ?? (session.user as any).email ?? "Unknown",
            changes: { status: { from: existing.status, to: status } },
          },
        })]
      : []),
  ]);

  return NextResponse.json({ success: true, status });
}
