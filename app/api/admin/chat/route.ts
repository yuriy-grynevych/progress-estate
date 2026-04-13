import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myId = (session.user as any).id as string;
  const params = req.nextUrl.searchParams;
  const channel = params.get("channel") ?? "general"; // "general" | "dm"
  const withUserId = params.get("with");
  const after = params.get("after");

  let where: Record<string, unknown> = {};

  if (channel === "dm" && withUserId) {
    // Messages between me and the other user (both directions)
    where = {
      OR: [
        { senderId: myId, receiverId: withUserId },
        { senderId: withUserId, receiverId: myId },
      ],
    };
  } else {
    // General channel: receiverId is null
    where = { receiverId: null };
  }

  if (after) {
    where = { ...where, createdAt: { gt: new Date(after) } };
  }

  const messages = await prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: after ? 50 : 80,
    include: {
      sender: { select: { id: true, name: true, photoUrl: true } },
    },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const senderId = (session.user as any).id as string;
  const body = await req.json();
  const {
    content,
    type = "text",
    fileUrl,
    fileName,
    propertySlug,
    propertyTitle,
    receiverId = null,
  } = body;

  if (!content?.trim() && !fileUrl) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      senderId,
      receiverId: receiverId ?? null,
      content: content?.trim() ?? "",
      type,
      fileUrl: fileUrl ?? null,
      fileName: fileName ?? null,
      propertySlug: propertySlug ?? null,
      propertyTitle: propertyTitle ?? null,
    },
    include: {
      sender: { select: { id: true, name: true, photoUrl: true } },
    },
  });

  return NextResponse.json(message);
}
