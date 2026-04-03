import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

// In-memory state per chatId: null | { step: "waiting_name", phone: string } | { step: "waiting_phone", name: string }
interface SessionWaitingName { step: "waiting_name"; phone: string; history: { role: string; content: string }[] }
interface SessionWaitingPhone { step: "waiting_phone"; name: string; history: { role: string; content: string }[] }
const sessions = new Map<number, SessionWaitingName | SessionWaitingPhone>();
const chatHistories = new Map<number, { role: string; content: string }[]>();

async function sendMessage(chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

function extractPhone(text: string): string | null {
  const match = text.match(/(\+?380[\s\-]?\d{2}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}|0\d{9}|\d{9,10})/);
  return match ? match[0].replace(/[\s\-]/g, "") : null;
}

async function saveContact(name: string, phone: string, chatHistory: { role: string; content: string }[] = []) {
  await prisma.inquiry.create({
    data: {
      name,
      phone,
      email: "",
      message: "Запит через Telegram бота — клієнт залишив контактні дані",
      source: "Telegram бот",
      status: "NEW",
      chatHistory,
    },
  });
}

async function getAIReply(userMessage: string): Promise<string> {
  const properties = await prisma.property.findMany({
    where: { status: "ACTIVE" },
    select: {
      titleUk: true, price: true, currency: true,
      areaSqm: true, rooms: true, district: true,
      listingType: true, slug: true,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const listingsText = properties.length === 0
    ? "Наразі немає активних оголошень."
    : properties.map((p) => {
        const type = p.listingType === "SALE" ? "Продаж" : "Оренда";
        const area = p.areaSqm ? `${p.areaSqm}м²` : "";
        const rooms = p.rooms ? `${p.rooms}кімн.` : "";
        return `• ${p.titleUk} — ${type}, ${[area, rooms, p.district].filter(Boolean).join(", ")}, ${p.price} ${p.currency}`;
      }).join("\n");

  const systemPrompt = `Ти — досвідчений AI-асистент агентства нерухомості Progress Estate з Івано-Франківська. Спілкуєшся через Telegram.

Контакти: тел. +380 67 123 45 67, email: info@progressestate.com.ua

Актуальні оголошення:
${listingsText}

Правила:
- Завжди відповідай українською
- Відповіді корисні та конкретні (3-5 речень)
- Будь дружнім та природнім
- КОЛИ пропонуєш зв'язатися з агентом або коли клієнт питає про перегляд чи деталі — замість "зателефонуйте нам" пиши: "Або просто напишіть своє ім'я та номер телефону прямо тут — і ми самі зателефонуємо вам у зручний час 📞"
- Ніколи не кажи просто "зателефонуйте" без пропозиції залишити контакт тут`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!res.ok) return "Вибачте, сталася помилка. Спробуйте ще раз.";
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "Вибачте, не вдалося отримати відповідь.";
}

export async function POST(req: NextRequest) {
  if (WEBHOOK_SECRET) {
    const secret = req.headers.get("x-telegram-bot-api-secret-token");
    if (secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json();
  const message = body?.message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId: number = message.chat?.id;
  const text: string = message.text ?? "";
  const firstName: string = message.from?.first_name ?? "";

  if (!chatId || !text) return NextResponse.json({ ok: true });

  // ── /start ──────────────────────────────────────────
  if (text === "/start") {
    sessions.delete(chatId);
    const agent = await prisma.user.findFirst({
      where: { telegramChatId: String(chatId) },
      select: { name: true },
    });

    if (agent) {
      await sendMessage(chatId, `👋 Привіт, ${agent.name ?? firstName}! Ти підключений до системи Progress Estate.\n\nЯ буду нагадувати тобі про клієнтів. Також можеш ставити питання!`);
    } else {
      await sendMessage(chatId, `👋 Привіт, ${firstName}!\n\nЯ — AI-асистент агентства нерухомості <b>Progress Estate</b> з Івано-Франківська.\n\nМожу розповісти про нерухомість, райони міста, ціни та допомогти з вибором. Запитуй!`);
    }
    return NextResponse.json({ ok: true });
  }

  // ── /myid ────────────────────────────────────────────
  if (text === "/myid") {
    await sendMessage(chatId, `🔑 Ваш Chat ID: <code>${chatId}</code>`);
    return NextResponse.json({ ok: true });
  }

  // ── /contacts ────────────────────────────────────────
  if (text === "/contacts" || text === "/нагадування") {
    const agent = await prisma.user.findFirst({
      where: { telegramChatId: String(chatId) },
      select: { id: true, name: true },
    });

    if (!agent) {
      await sendMessage(chatId, "❌ Ви не підключені до системи. Додайте ваш Chat ID у профілі на сайті.");
      return NextResponse.json({ ok: true });
    }

    const upcoming = new Date();
    upcoming.setDate(upcoming.getDate() + 7);

    const contacts = await prisma.contact.findMany({
      where: { assignedUserId: agent.id, followUpAt: { not: null, lte: upcoming }, followUpSent: false },
      orderBy: { followUpAt: "asc" },
      take: 10,
    });

    if (contacts.length === 0) {
      await sendMessage(chatId, "✅ Немає нагадувань на найближчі 7 днів!");
    } else {
      const lines = contacts.map((c) => {
        const date = c.followUpAt!.toLocaleDateString("uk-UA");
        const typeLabel = c.type === "CLIENT" ? "Клієнт" : "Власник";
        return `• <b>${c.name}</b> (${typeLabel}) — ${date}${c.phone ? `\n  📞 ${c.phone}` : ""}${c.notes ? `\n  💬 ${c.notes.slice(0, 60)}` : ""}`;
      });
      await sendMessage(chatId, `📋 <b>Ваші нагадування:</b>\n\n${lines.join("\n\n")}`);
    }
    return NextResponse.json({ ok: true });
  }

  // ── Contact collection state machine ─────────────────
  const session = sessions.get(chatId);

  if (session?.step === "waiting_name") {
    const name = text.trim();
    await saveContact(name, session.phone, session.history);
    sessions.delete(chatId);
    await sendMessage(chatId, `✅ <b>Дякуємо, ${name}!</b>\n\nМи записали ваші дані і незабаром зателефонуємо. Якщо маєте ще питання — я тут 😊`);
    return NextResponse.json({ ok: true });
  }

  if (session?.step === "waiting_phone") {
    const phone = extractPhone(text);
    if (phone) {
      await saveContact(session.name, phone, session.history);
      sessions.delete(chatId);
      await sendMessage(chatId, `✅ <b>Дякуємо, ${session.name}!</b>\n\nМи записали ваш номер і незабаром зателефонуємо. Якщо маєте ще питання — я тут 😊`);
    } else {
      await sendMessage(chatId, `Будь ласка, надішліть номер у форматі +380XXXXXXXXX або 0XXXXXXXXX`);
    }
    return NextResponse.json({ ok: true });
  }

  // ── Detect phone number in regular message ────────────
  const phone = extractPhone(text);
  if (phone) {
    const history = chatHistories.get(chatId) ?? [];
    sessions.set(chatId, { step: "waiting_name", phone, history });
    await sendMessage(chatId, `📞 Чудово! Записав ваш номер <code>${phone}</code>.\n\nЯк до вас звертатись? Напишіть своє ім'я 👇`);
    return NextResponse.json({ ok: true });
  }

  // ── Regular AI reply ──────────────────────────────────
  try {
    const history = chatHistories.get(chatId) ?? [];
    history.push({ role: "user", content: text });
    const reply = await getAIReply(text);
    history.push({ role: "assistant", content: reply });
    chatHistories.set(chatId, history.slice(-20));
    await sendMessage(chatId, reply);
  } catch {
    await sendMessage(chatId, "Вибачте, сталася помилка.");
  }

  return NextResponse.json({ ok: true });
}
