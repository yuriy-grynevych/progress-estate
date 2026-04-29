import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CRON_SECRET = process.env.CRON_SECRET ?? "";
const APP_URL = process.env.NEXTAUTH_URL ?? "https://progress-estate.com.ua";

interface InlineButton {
  text: string;
  url?: string;
  callback_data?: string;
}

async function sendMessage(
  chatId: string,
  text: string,
  buttons?: InlineButton[][]
) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (buttons?.length) {
    body.reply_markup = { inline_keyboard: buttons };
  }
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function GET(req: NextRequest) {
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

    const typeEmoji = contact.type === "CLIENT" ? "🧑‍💼" : "🏠";
    const typeLabel = contact.type === "CLIENT" ? "Клієнт" : "Власник";

    const lines: string[] = [
      `🔔 <b>Нагадування про контакт</b>`,
      ``,
      `${typeEmoji} <b>${contact.name}</b>  <i>${typeLabel}</i>`,
    ];
    if (contact.phone)  lines.push(`📞 <code>${contact.phone}</code>`);
    if (contact.email)  lines.push(`📧 ${contact.email}`);
    if (contact.source) lines.push(`📌 ${contact.source}`);
    if (contact.notes)  lines.push(``, `💬 <i>${contact.notes}</i>`);
    lines.push(``, `<i>Зателефонуйте або напишіть сьогодні 👇</i>`);

    const buttons: InlineButton[][] = [];
    if (contact.phone) {
      buttons.push([{ text: `📞 Подзвонити ${contact.phone}`, url: `tel:${contact.phone}` }]);
    }
    buttons.push([
      { text: "✅ Виконано", callback_data: `done_${contact.id}` },
      { text: "⏰ Завтра", callback_data: `snooze_${contact.id}` },
    ]);
    buttons.push([{ text: "📋 Відкрити CRM", url: `${APP_URL}/admin/contacts` }]);

    try {
      await sendMessage(chatId, lines.join("\n"), buttons);
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

    const lines: string[] = [
      `📅 <b>Оголошення 30 днів на сайті</b>`,
      ``,
      `🏡 <b>${property.titleUk}</b>`,
    ];
    if (property.district) lines.push(`📍 ${property.district}`);
    lines.push(`💰 ${Number(property.price).toLocaleString("uk-UA")} ${property.currency}`);
    if (property.areaSqm) lines.push(`📐 ${property.areaSqm} м²`);
    lines.push(``, `<i>Перевірте актуальність і зв'яжіться з власником.</i>`);

    const buttons: InlineButton[][] = [
      [
        { text: "✏️ Редагувати", url: `${APP_URL}/admin/properties/${property.id}` },
        { text: "👁 На сайті", url: `${APP_URL}/uk/listings/${property.slug}` },
      ],
    ];

    try {
      await sendMessage(chatId, lines.join("\n"), buttons);
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
