import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  message: z.string().min(1),
  source: z.string().optional().nullable(),
  funnelStage: z.string().default("NEW"),
  assignedUserId: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { funnelStage, deadline, assignedUserId, ...rest } = parsed.data;

  const createdByUserId = (session.user as any).id as string;

  const inquiry = await prisma.inquiry.create({
    data: {
      ...rest,
      email: rest.email ?? "",
      funnelStage,
      inFunnel: true,
      deadline: deadline ? new Date(deadline) : null,
      assignedUserId: assignedUserId ?? null,
      createdByUserId,
    } as any,
    include: {
      assignedUser: { select: { id: true, name: true, email: true, accentColor: true } },
      property: { select: { titleUk: true, slug: true } },
    },
  });

  return NextResponse.json(inquiry, { status: 201 });
}
