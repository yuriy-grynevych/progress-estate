import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS company_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `);
}

export async function GET() {
  try {
    await ensureTable();
    const rows = await prisma.$queryRawUnsafe<{ key: string; value: string }[]>(
      `SELECT key, value FROM company_settings WHERE key IN ('pinned_announcement', 'pinned_announcement_sender')`
    );
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return NextResponse.json({
      text: map["pinned_announcement"] ?? null,
      sender: map["pinned_announcement_sender"] ?? null,
    });
  } catch {
    return NextResponse.json({ text: null, sender: null });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { text, sender } = await req.json();
  await ensureTable();

  for (const [key, value] of [["pinned_announcement", text ?? ""], ["pinned_announcement_sender", sender ?? ""]]) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO company_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      key, value
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureTable();
  await prisma.$executeRawUnsafe(
    `INSERT INTO company_settings (key, value) VALUES ('pinned_announcement', '')
     ON CONFLICT (key) DO UPDATE SET value = ''`
  );

  return NextResponse.json({ ok: true });
}
