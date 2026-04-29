import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  const userId = (session.user as any)?.id;

  const where =
    role === "ADMIN"
      ? { followUpAt: { not: null } }
      : { followUpAt: { not: null }, assignedUserId: userId };

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { followUpAt: "asc" },
    include: { assignedUser: { select: { id: true, name: true } } },
  });

  return NextResponse.json(contacts);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId, action, snoozeDate } = await req.json();

  if (action === "done") {
    await prisma.contact.update({
      where: { id: contactId },
      data: { followUpAt: null, followUpSent: false },
    });
  } else if (action === "snooze" && snoozeDate) {
    await prisma.contact.update({
      where: { id: contactId },
      data: { followUpAt: new Date(snoozeDate), followUpSent: false },
    });
  }

  return NextResponse.json({ ok: true });
}
