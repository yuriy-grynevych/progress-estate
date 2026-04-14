import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const typeLabels: Record<string, string> = {
  APARTMENT: "Квартира", HOUSE: "Будинок", COMMERCIAL: "Комерція",
  LAND: "Земля", OFFICE: "Офіс",
};

const searchTool = {
  type: "function",
  function: {
    name: "search_properties",
    description: "Шукає нерухомість в базі за фільтрами. Викликай цю функцію коли клієнт питає про конкретний тип, ціну, кількість кімнат або тип угоди.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["APARTMENT", "HOUSE", "COMMERCIAL", "LAND", "OFFICE"],
          description: "Тип нерухомості: APARTMENT=Квартира, HOUSE=Будинок, COMMERCIAL=Комерція, LAND=Земля, OFFICE=Офіс",
        },
        listingType: {
          type: "string",
          enum: ["SALE", "RENT"],
          description: "SALE=Продаж, RENT=Оренда",
        },
        rooms: {
          type: "integer",
          description: "Кількість кімнат (1, 2, 3...)",
        },
        priceMin: {
          type: "number",
          description: "Мінімальна ціна",
        },
        priceMax: {
          type: "number",
          description: "Максимальна ціна",
        },
        district: {
          type: "string",
          description: "Район або мікрорайон міста",
        },
      },
    },
  },
};

async function executeSearch(args: {
  type?: string;
  listingType?: string;
  rooms?: number;
  priceMin?: number;
  priceMax?: number;
  district?: string;
}, locale: string) {
  const results = await prisma.property.findMany({
    where: {
      status: "ACTIVE",
      ...(args.type && { type: args.type as any }),
      ...(args.listingType && { listingType: args.listingType as any }),
      ...(args.rooms && { rooms: args.rooms }),
      ...((args.priceMin || args.priceMax) && {
        price: {
          ...(args.priceMin && { gte: args.priceMin }),
          ...(args.priceMax && { lte: args.priceMax }),
        },
      }),
      ...(args.district && { district: { contains: args.district, mode: "insensitive" as const } }),
    },
    select: {
      slug: true, titleUk: true, titleEn: true,
      price: true, currency: true,
      areaSqm: true, rooms: true, district: true,
      listingType: true, type: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const isEn = locale === "en";
  if (results.length === 0) {
    return isEn
      ? "No listings found matching your criteria."
      : "Не знайдено оголошень за вашими критеріями.";
  }

  return results.map((p) => {
    const title = isEn ? p.titleEn : p.titleUk;
    const listType = isEn ? p.listingType : (p.listingType === "SALE" ? "Продаж" : "Оренда");
    const propType = isEn ? p.type : (typeLabels[p.type] ?? p.type);
    const area = p.areaSqm ? `${p.areaSqm}м²` : "";
    const rooms = p.rooms ? `${p.rooms}кімн.` : "";
    return `• [PROP:${p.slug}] ${title} — ${propType}, ${listType}, ${[area, rooms, p.district].filter(Boolean).join(", ")}, ${p.price} ${p.currency}`;
  }).join("\n");
}

function buildSystemPrompt(locale: string): string {
  if (locale === "en") {
    return `You are a knowledgeable AI assistant for Житлова компанія Progress, a real estate agency in Ivano-Frankivsk, Ukraine.

IMPORTANT: When recommending specific listings, keep the [PROP:slug] tag right before the property name so the system can render a clickable card. Do not remove these tags.

Company info:
- Phone: +380 67 123 45 67
- Email: info@progressestate.com.ua

Use the search_properties tool whenever the user asks about specific properties, types, prices or rooms.
When the user wants to schedule a viewing or needs personal help, say: "Just leave your name and phone number right here in the chat — and we'll call you 📞"`;
  }

  return `Ти — досвідчений AI-асистент агентства нерухомості Житлова компанія Progress з Івано-Франківська.
ВАЖЛИВО: Коли рекомендуєш конкретні оголошення, залишай тег [PROP:slug] перед назвою — система відобразить картку з фото і посиланням.

Контакти: тел. +380 67 123 45 67, email: info@progressestate.com.ua

Використовуй інструмент search_properties ЗАВЖДИ коли клієнт питає про:
- конкретний тип нерухомості (квартира, будинок, офіс...)
- кількість кімнат (1-кімнатна, 2-кімнатна...)
- тип угоди (оренда, купівля/продаж)
- бюджет / ціну
- район міста
- будь-яку комбінацію вище

Ти також ПОВИНЕН:
- Описувати райони Івано-Франківська
- Пояснювати процес купівлі/оренди
- Відповідати на питання про іпотеку, документи, ціни на ринку

Коли клієнт хоче домовитись про перегляд — пиши:
"Просто залиште своє ім'я та номер телефону прямо тут у чаті — і ми самі зателефонуємо 📞"`;
}

export async function POST(req: NextRequest) {
  const { messages, locale } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }

  const isEn = locale === "en";
  const history = messages.slice(-10);
  const systemPrompt = buildSystemPrompt(isEn ? "en" : "uk");

  // First call — AI may invoke search_properties tool
  const res1 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...history],
      tools: [searchTool],
      tool_choice: "auto",
      max_tokens: 600,
      temperature: 0.7,
    }),
  });

  if (!res1.ok) {
    console.error("Groq error:", await res1.text());
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }

  const data1 = await res1.json();
  const choice = data1.choices?.[0];

  let reply: string;

  // If AI called the tool — execute search and call again with results
  if (choice?.finish_reason === "tool_calls" && choice.message?.tool_calls?.length > 0) {
    const toolCall = choice.message.tool_calls[0];
    const args = JSON.parse(toolCall.function.arguments ?? "{}");
    const searchResult = await executeSearch(args, locale);

    const res2 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          choice.message,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            content: searchResult,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!res2.ok) {
      return NextResponse.json({ error: "AI error" }, { status: 500 });
    }
    const data2 = await res2.json();
    reply = data2.choices?.[0]?.message?.content ?? (isEn ? "Sorry, try again." : "Вибачте, спробуйте ще раз.");
  } else {
    reply = choice?.message?.content ?? (isEn ? "Sorry, try again." : "Вибачте, спробуйте ще раз.");
  }

  // Extract [PROP:slug] tags → suggestion cards
  const propRegex = /\[PROP:([a-z0-9\-]+)\]/g;
  const slugsFound: string[] = [];
  let propMatch: RegExpExecArray | null;
  while ((propMatch = propRegex.exec(reply)) !== null) {
    slugsFound.push(propMatch[1]);
  }
  reply = reply.replace(propRegex, "");

  let suggestions: object[] = [];
  if (slugsFound.length > 0) {
    const props = await prisma.property.findMany({
      where: { slug: { in: Array.from(new Set(slugsFound)) }, status: "ACTIVE" },
      select: {
        slug: true, titleUk: true, titleEn: true,
        price: true, currency: true,
        areaSqm: true, rooms: true, district: true, listingType: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    });
    suggestions = props.map((p) => ({
      slug: p.slug,
      title: isEn ? p.titleEn : p.titleUk,
      price: `${Number(p.price).toLocaleString()} ${p.currency}`,
      area: p.areaSqm ? `${p.areaSqm} м²` : null,
      rooms: p.rooms,
      district: p.district,
      listingType: p.listingType,
      imageUrl: p.images[0]?.url ?? null,
    }));
  }

  return NextResponse.json({ reply, suggestions });
}
