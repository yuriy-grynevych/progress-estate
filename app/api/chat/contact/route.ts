import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  locale: z.string().optional(),
  chatHistory: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { name, phone, chatHistory } = parsed.data;

  const inquiry = await prisma.inquiry.create({
    data: {
      name,
      phone,
      email: "",
      message: "Запит через AI чат — клієнт залишив контактні дані",
      source: "AI чат",
      status: "NEW",
      chatHistory: chatHistory ?? [],
    },
  });

  return NextResponse.json({ ok: true, id: inquiry.id });
}
