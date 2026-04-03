import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { inquirySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const page = Number(searchParams.get("page") ?? 1);
  const limit = 20;

  // Base status filter
  const statusWhere = status && status !== "ALL" ? { status: status as any } : {};

  // Role-based filter:
  // ADMIN → sees everything
  // EMPLOYEE → sees:
  //   1. General inquiries (no propertyId)
  //   2. Inquiries for their assigned properties
  const roleWhere =
    role === "ADMIN"
      ? {}
      : {
          OR: [
            { propertyId: null },
            { property: { assignedUserId: userId } },
            { referredByUserId: userId },
          ],
        };

  const where = { ...statusWhere, ...roleWhere };

  const [inquiries, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        property: {
          select: {
            id: true,
            slug: true,
            titleUk: true,
            titleEn: true,
            assignedUserId: true,
          },
        },
      },
    }),
    prisma.inquiry.count({ where }),
  ]);

  // For employees: mask contact details unless it's their property or they referred the inquiry
  const result = inquiries.map((inq) => {
    if (role === "ADMIN") return inq;
    const isOwned = inq.property?.assignedUserId === userId;
    const isReferred = (inq as any).referredByUserId === userId;
    if (!isOwned && !isReferred) {
      return { ...inq, email: null, phone: null };
    }
    return inq;
  });

  return NextResponse.json({ inquiries: result, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const inquiry = await prisma.inquiry.create({ data: parsed.data });
  return NextResponse.json(inquiry, { status: 201 });
}
