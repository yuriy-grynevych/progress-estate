import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CRON_SECRET = process.env.CRON_SECRET ?? "";

async function sendMessage(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  let contactsSent = 0;
  let propertiesSent = 0;

  // ── 1. Contact follow-up reminders ──────────────────────────────
  const dueContacts = await prisma.contact.findMany({
    where: {
      followUpAt: { gte: startOfDay, lt: endOfDay },
      followUpSent: false,
    },
    include: {
      assignedUser: { select: { id: true, name: true, telegramChatId: true } },
    },
  });

  for (const contact of dueContacts) {
    const chatId = contact.assignedUser?.telegramChatId;
    if (!chatId) continue;

    const typeLabel = contact.type === "CLIENT" ? "клієнт" : "власник";
    const text = [
      `🔔 <b>Нагадування — ${typeLabel}</b>`,
      ``,
      `👤 <b>${contact.name}</b>`,
      contact.phone ? `📞 ${contact.phone}` : null,
      contact.email ? `📧 ${contact.email}` : null,
      contact.source ? `📌 Джерело: ${contact.source}` : null,
      contact.notes ? `💬 ${contact.notes}` : null,
      ``,
      `<i>Сьогодні час зателефонувати і дізнатись як справи!</i>`,
    ]
      .filter((l) => l !== null)
      .join("\n");

    try {
      await sendMessage(chatId, text);
      await prisma.contact.update({
        where: { id: contact.id },
        data: { followUpSent: true },
      });
      contactsSent++;
    } catch (err) {
      console.error(`Failed to send reminder for contact ${contact.id}:`, err);
    }
  }

  // ── 2. Property 30-day reminder ──────────────────────────────────
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyOneDaysAgo = new Date(thirtyDaysAgo);
  thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 1);

  const oldProperties = await prisma.property.findMany({
    where: {
      status: "ACTIVE",
      createdAt: { gte: thirtyOneDaysAgo, lt: thirtyDaysAgo },
      assignedUser: { telegramChatId: { not: null } },
    },
    include: {
      assignedUser: { select: { name: true, telegramChatId: true } },
    },
  });

  for (const property of oldProperties) {
    const chatId = property.assignedUser?.telegramChatId;
    if (!chatId) continue;

    const text = [
      `🏠 <b>Нагадування — нерухомість</b>`,
      ``,
      `Об'єкт <b>${property.titleUk}</b> вже 30 днів активний.`,
      ``,
      `Рекомендуємо зв'язатися з клієнтами та перевірити актуальність оголошення.`,
      property.district ? `📍 ${property.district}` : null,
      `💰 ${property.price} ${property.currency}`,
    ]
      .filter((l) => l !== null)
      .join("\n");

    try {
      await sendMessage(chatId, text);
      propertiesSent++;
    } catch (err) {
      console.error(`Failed to send property reminder for ${property.id}:`, err);
    }
  }

  return NextResponse.json({
    ok: true,
    contactsSent,
    propertiesSent,
    checkedAt: now.toISOString(),
  });
}
