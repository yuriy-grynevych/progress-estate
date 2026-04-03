import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { propertySchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { PAGE_SIZE } from "@/lib/constants";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") ?? 1);
  const listingType = searchParams.get("listingType");
  const type = searchParams.get("type");
  const district = searchParams.get("district");
  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");
  const areaMin = searchParams.get("areaMin");
  const areaMax = searchParams.get("areaMax");
  const rooms = searchParams.get("rooms");
  const search = searchParams.get("search");
  const isFeatured = searchParams.get("isFeatured");
  const sort = searchParams.get("sort") ?? "createdAt_desc";
  const status = searchParams.get("status");

  const where: Prisma.PropertyWhereInput = {
    status: (status as any) ?? "ACTIVE",
    ...(listingType && { listingType: listingType as any }),
    ...(type && { type: type as any }),
    ...(district && { district }),
    ...(isFeatured === "true" && { isFeatured: true }),
    ...(priceMin || priceMax ? {
      price: {
        ...(priceMin && { gte: Number(priceMin) }),
        ...(priceMax && { lte: Number(priceMax) }),
      }
    } : {}),
    ...(areaMin || areaMax ? {
      areaSqm: {
        ...(areaMin && { gte: Number(areaMin) }),
        ...(areaMax && { lte: Number(areaMax) }),
      }
    } : {}),
    ...(rooms && { rooms: { gte: Number(rooms) } }),
    ...(search && {
      OR: [
        { titleUk: { contains: search, mode: "insensitive" } },
        { titleEn: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
      ]
    }),
  };

  const orderBy: Prisma.PropertyOrderByWithRelationInput = sort === "price_asc"
    ? { price: "asc" }
    : sort === "price_desc"
    ? { price: "desc" }
    : sort === "areaSqm_desc"
    ? { areaSqm: "desc" }
    : { createdAt: "desc" };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { images: { orderBy: { order: "asc" } } },
    }),
    prisma.property.count({ where }),
  ]);

  return NextResponse.json({
    properties,
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role as string;
  const currentUserId = (session.user as any).id as string;

  const body = await req.json();
  const parsed = propertySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const baseSlug = slugify(data.titleUk);
  let slug = baseSlug;
  let i = 1;
  while (await prisma.property.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  // Employees are always assigned to their own properties
  const assignedUserId =
    role === "EMPLOYEE"
      ? currentUserId
      : (body.assignedUserId || null);

  const property = await prisma.property.create({
    data: { ...data, slug, price: data.price, assignedUserId } as any,
    include: { images: true },
  });

  return NextResponse.json(property, { status: 201 });
}
