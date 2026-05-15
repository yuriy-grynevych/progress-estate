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
  const isDoneParam = searchParams.get("isDone");
  const filterUserId = searchParams.get("userId"); // admin only

  const isDone = isDoneParam === "true" ? true : isDoneParam === "false" ? false : false;

  // For history: admin can request any userId, employee only sees own
  const targetUserId =
    role === "ADMIN" && filterUserId ? filterUserId : currentUserId;

  const where =
    role === "ADMIN" && !filterUserId
      ? { isDone }
      : { userId: targetUserId, isDone };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: isDone ? { updatedAt: "desc" } : { dueAt: "asc" },
    include: {
      contact: { select: { id: true, name: true, phone: true } },
      user: { select: { id: true, name: true } },
    },
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
    include: {
      contact: { select: { id: true, name: true, phone: true } },
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
