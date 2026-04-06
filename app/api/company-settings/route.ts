import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/constants";

const DEFAULTS: Record<string, string> = {
  phone: COMPANY.phone,
  email: COMPANY.email,
  address: COMPANY.address,
  instagram: COMPANY.instagram,
  facebook: COMPANY.facebook ?? "",
};

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS company_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `);
  // Seed defaults if empty
  for (const [key, value] of Object.entries(DEFAULTS)) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO company_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
      key, value
    );
  }
}

export async function GET() {
  try {
    await ensureTable();
    const rows = await prisma.$queryRawUnsafe<{ key: string; value: string }[]>(
      `SELECT key, value FROM company_settings`
    );
    const result: Record<string, string> = { ...DEFAULTS };
    for (const r of rows) result[r.key] = r.value;
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    await ensureTable();
    const body = await req.json() as Record<string, string>;
    for (const [key, value] of Object.entries(body)) {
      if (key in DEFAULTS) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO company_settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          key, value
        );
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
