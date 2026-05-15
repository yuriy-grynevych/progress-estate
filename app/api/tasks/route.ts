import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const where = role === "ADMIN" ? { isDone: false } : { userId, isDone: false };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { dueAt: "asc" },
    include: { contact: { select: { id: true, name: true, phone: true } } },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const body = await req.json();
  const { title, description, dueAt, contactId } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      dueAt: dueAt ? new Date(dueAt) : null,
      contactId: contactId || null,
      userId,
    },
    include: { contact: { select: { id: true, name: true, phone: true } } },
  });

  return NextResponse.json(task, { status: 201 });
}
