import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["CLIENT", "OWNER"]),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  source: z.string().optional(),
  followUpAt: z.string().optional().nullable(),
  assignedUserId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const search = searchParams.get("search");

  const where: any = {
    ...(type && { type }),
    ...(role === "EMPLOYEE" && { assignedUserId: userId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { assignedUser: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  // Employees are always assigned to themselves
  const assignedUserId = role === "EMPLOYEE" ? userId : (data.assignedUserId || userId);

  const contact = await prisma.contact.create({
    data: {
      ...data,
      email: data.email || null,
      followUpAt: data.followUpAt ? new Date(data.followUpAt) : null,
      followUpSent: false,
      assignedUserId,
    },
    include: { assignedUser: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(contact, { status: 201 });
}
