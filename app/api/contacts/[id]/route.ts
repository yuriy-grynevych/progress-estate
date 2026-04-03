import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["CLIENT", "OWNER"]).optional(),
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  followUpAt: z.string().optional().nullable(),
  followUpSent: z.boolean().optional(),
  assignedUserId: z.string().optional().nullable(),
});

async function canAccess(contactId: string, userId: string, role: string) {
  if (role === "ADMIN") return true;
  const c = await prisma.contact.findUnique({ where: { id: contactId }, select: { assignedUserId: true } });
  return c?.assignedUserId === userId;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  if (!(await canAccess(params.id, userId, role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const contact = await prisma.contact.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      ...(parsed.data.followUpAt !== undefined && {
        followUpAt: parsed.data.followUpAt ? new Date(parsed.data.followUpAt) : null,
        followUpSent: false,
      }),
    },
    include: { assignedUser: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(contact);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  if (!(await canAccess(params.id, userId, role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.contact.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
