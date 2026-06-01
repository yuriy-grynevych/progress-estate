import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: params.id },
    include: { property: { select: { id: true, slug: true, titleUk: true, titleEn: true } } },
  });
  if (!inquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(inquiry);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const data: any = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.funnelStage !== undefined) data.funnelStage = body.funnelStage;
  if (body.deadline !== undefined) data.deadline = body.deadline ? new Date(body.deadline) : null;
  if (body.assignedUserId !== undefined) data.assignedUserId = body.assignedUserId || null;
  if (body.message !== undefined) data.message = body.message;
  if (body.name !== undefined) data.name = body.name;
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.notes !== undefined) data.notes = body.notes || null;
  if (body.inFunnel !== undefined) data.inFunnel = body.inFunnel;
  const inquiry = await prisma.inquiry.update({ where: { id: params.id }, data });
  return NextResponse.json(inquiry);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.inquiry.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
