import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_DISTRICTS = [
  { value: "center", labelUk: "Центр", labelEn: "Center", order: 1 },
  { value: "pasichna", labelUk: "Пасічна", labelEn: "Pasichna", order: 2 },
  { value: "bam", labelUk: "БАМ", labelEn: "BAM", order: 3 },
  { value: "nova_skvaryava", labelUk: "Нова Скварява", labelEn: "Nova Skvaryava", order: 4 },
  { value: "khimik", labelUk: "Хімік", labelEn: "Khimik", order: 5 },
  { value: "pozytron", labelUk: "Позитрон", labelEn: "Pozytron", order: 6 },
  { value: "industrial", labelUk: "Промисловий", labelEn: "Industrial", order: 7 },
  { value: "microrayon", labelUk: "Мікрорайон", labelEn: "Microrayon", order: 8 },
];

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS districts (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      value TEXT UNIQUE NOT NULL,
      "labelUk" TEXT NOT NULL,
      "labelEn" TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0
    )
  `);
}

async function getDistricts() {
  await ensureTable();
  const rows = await prisma.$queryRawUnsafe<{ id: string; value: string; labelUk: string; labelEn: string; order: number }[]>(
    `SELECT id, value, "labelUk", "labelEn", "order" FROM districts ORDER BY "order" ASC`
  );
  if (rows.length === 0) {
    for (const d of DEFAULT_DISTRICTS) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO districts(id, value, "labelUk", "labelEn", "order") VALUES(gen_random_uuid()::text, $1, $2, $3, $4) ON CONFLICT(value) DO NOTHING`,
        d.value, d.labelUk, d.labelEn, d.order
      );
    }
    return DEFAULT_DISTRICTS.map((d, i) => ({ id: String(i), ...d }));
  }
  return rows;
}

export async function GET() {
  try {
    const districts = await getDistricts();
    return NextResponse.json(districts);
  } catch {
    return NextResponse.json(DEFAULT_DISTRICTS.map((d, i) => ({ id: String(i), ...d })));
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { value, labelUk, labelEn, order } = await req.json();
  await ensureTable();
  await prisma.$executeRawUnsafe(
    `INSERT INTO districts(id, value, "labelUk", "labelEn", "order") VALUES(gen_random_uuid()::text, $1, $2, $3, $4)`,
    value, labelUk, labelEn, order ?? 0
  );
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, value, labelUk, labelEn, order } = await req.json();
  await ensureTable();
  await prisma.$executeRawUnsafe(
    `UPDATE districts SET value=$1, "labelUk"=$2, "labelEn"=$3, "order"=$4 WHERE id=$5`,
    value, labelUk, labelEn, order ?? 0, id
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await ensureTable();
  await prisma.$executeRawUnsafe(`DELETE FROM districts WHERE id=$1`, id);
  return NextResponse.json({ ok: true });
}
