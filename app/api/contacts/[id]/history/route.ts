import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.contactNote.findMany({
    where: { contactId: params.id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { text } = await req.json();

  if (!text?.trim()) return NextResponse.json({ error: "Text required" }, { status: 400 });

  const note = await prisma.contactNote.create({
    data: { contactId: params.id, userId, text: text.trim() },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(note, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;
  const { noteId } = await req.json();

  const note = await prisma.contactNote.findUnique({ where: { id: noteId } });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role !== "ADMIN" && note.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.contactNote.delete({ where: { id: noteId } });
  return NextResponse.json({ ok: true });
}
