import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const text = (body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "Empty comment" }, { status: 400 });

  const author = (session.user as any).name ?? (session.user as any).email ?? "Агент";

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { agentComments: true },
  });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = Array.isArray(property.agentComments) ? property.agentComments as any[] : [];
  const updated = [...existing, { text, author, createdAt: new Date().toISOString() }];

  await prisma.property.update({
    where: { id: params.id },
    data: { agentComments: updated },
  });

  return NextResponse.json({ ok: true, comments: updated });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const index = body.index as number;

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { agentComments: true },
  });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = Array.isArray(property.agentComments) ? property.agentComments as any[] : [];
  const updated = existing.filter((_, i) => i !== index);

  await prisma.property.update({
    where: { id: params.id },
    data: { agentComments: updated },
  });

  return NextResponse.json({ ok: true, comments: updated });
}
