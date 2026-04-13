import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SECRET = "fix-vlad-2024";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("secret") !== SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.user.updateMany({
    where: { email: "vladgrenevich7@gmail.com" },
    data: { name: "Владислав Гриневич", role: "ADMIN" },
  });

  const deleted = await prisma.user.deleteMany({
    where: { email: "admin@progressestate.com.ua" },
  });

  return NextResponse.json({
    updated: updated.count,
    deleted: deleted.count,
    message: "Done",
  });
}
