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
    description: "Шукає нерухомість в базі агентства за фільтрами. Викликай ЗАВЖДИ коли клієнт питає про будь-яку нерухомість, ціну, кімнати, район, ЖК або тип угоди. Краще викликати із меншою кількістю фільтрів і показати більше варіантів.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["APARTMENT", "HOUSE", "COMMERCIAL", "LAND", "OFFICE"],
          description: "Тип: APARTMENT=Квартира, HOUSE=Будинок, COMMERCIAL=Комерція, LAND=Земля, OFFICE=Офіс",
        },
        listingType: {
          type: "string",
          enum: ["SALE", "RENT"],
          description: "SALE=Продаж/Купівля, RENT=Оренда",
        },
        rooms: {
          type: "integer",
          description: "Кількість кімнат (1, 2, 3, 4...)",
        },
        priceMin: {
          type: "number",
          description: "Мінімальна ціна в тій самій валюті що й запит клієнта",
        },
        priceMax: {
          type: "number",
          description: "Максимальна ціна",
        },
        district: {
          type: "string",
          description: "Район, мікрорайон або ЖК (житловий комплекс) — пошук по частині назви",
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
      floor: true, totalFloors: true, yearBuilt: true,
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 12,
  });

  const isEn = locale === "en";
  if (results.length === 0) {
    return isEn
      ? "No listings found matching your criteria. Try broader filters."
      : "Не знайдено оголошень за вашими критеріями. Спробуйте ширші фільтри.";
  }

  return results.map((p) => {
    const title = isEn ? (p.titleEn || p.titleUk) : p.titleUk;
    const listType = isEn ? p.listingType : (p.listingType === "SALE" ? "Продаж" : "Оренда");
    const propType = isEn ? p.type : (typeLabels[p.type] ?? p.type);
    const details = [
      p.areaSqm ? `${p.areaSqm}м²` : "",
      p.rooms ? `${p.rooms}кімн.` : "",
      p.floor && p.totalFloors ? `${p.floor}/${p.totalFloors}пов.` : "",
      p.district,
    ].filter(Boolean).join(", ");
    return `• [PROP:${p.slug}] ${title} — ${propType}, ${listType}, ${details}, ${Number(p.price).toLocaleString()} ${p.currency}`;
  }).join("\n");
}

function buildSystemPrompt(locale: string): string {
  if (locale === "en") {
    return `You are an expert AI assistant for Житлова компанія Progress — a real estate agency in Ivano-Frankivsk, Ukraine. You are warm, professional and genuinely helpful.

CRITICAL RULE: Always include [PROP:slug] tags exactly as returned by the search tool — never modify slugs. The system renders them as clickable property cards.

Company contacts: Phone +380 67 123 45 67 | Email info@progressestate.com.ua

== WHEN TO SEARCH ==
Call search_properties for ANY mention of: property type, rooms, price/budget, district, residential complex (ЖК), buying, renting, investing. Use broad filters first — better to show options than find nothing.

== HOW TO RESPOND ==
1. After a search: briefly introduce the results (e.g. "I found 3 apartments that match"), list them with [PROP:slug] tags, then offer to refine.
2. For general questions (neighborhoods, process, mortgage): answer knowledgeably in 2-3 sentences.
3. If no results: suggest widening the budget or district, then offer to notify when something new arrives.

== IVANO-FRANKIVSK DISTRICTS ==
Центр (Center) — prestigious, high prices; Пасічна — quiet residential; Каліщанська — affordable new builds; Хриплин — budget district; Бам — central-adjacent; Княгинин — popular ЖК area; Позитрон — western suburbs.

== VIEWING / CONTACT CAPTURE ==
When the client wants to view a property or needs a callback: "Just leave your name and phone number right here in the chat — our agent will call you shortly 📞"

Respond in English when spoken to in English, Ukrainian otherwise.`;
  }

  return `Ти — експерт-консультант з нерухомості агентства Житлова компанія Progress (Івано-Франківськ). Спілкуєшся тепло, професійно та по-діловому.

КРИТИЧНО: Теги [PROP:slug] передавай точно як повернув інструмент — система відобразить картку з фото та ціною.

Контакти: тел. +380 67 123 45 67 | email info@progressestate.com.ua

== КОЛИ ШУКАТИ ==
Викликай search_properties при БУДЬ-ЯКІЙ згадці: тип нерухомості, кімнати, ціна/бюджет, район, ЖК, купівля, оренда, інвестиція. Використовуй широкі фільтри — краще показати варіанти, ніж нічого не знайти.

== ЯК ВІДПОВІДАТИ ==
1. Після пошуку: коротко представ результати ("Знайшов 3 квартири що підходять"), перелич з тегами [PROP:slug], запропонуй уточнити.
2. На загальні питання (про райони, процес, іпотеку): відповідай по суті, 2-3 речення.
3. Якщо нічого не знайдено: запропонуй розширити бюджет або район.

== РАЙОНИ ІВАНО-ФРАНКІВСЬКА ==
Центр — престижно, вищі ціни; Пасічна — тихий житловий, сімейний; Каліщанська — нові ЖК, доступні ціни; Хриплин — бюджетно; Бам — біля центру; Княгинин — популярні ЖК; Позитрон — захід міста.

== ПОПУЛЯРНІ ЖК ==
Княгинин, Парковий, Галицький, Центральний, Престиж — запитай район чи бюджет і шукай одразу.

== ПЕРЕГЛЯД / ФІКСАЦІЯ КОНТАКТУ ==
Коли клієнт хоче переглянути або отримати консультацію:
"Залиште просто тут ім'я та номер — наш агент передзвонить найближчим часом 📞"`;
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
      max_tokens: 900,
      temperature: 0.6,
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
        max_tokens: 800,
        temperature: 0.6,
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

  // Extract [PROP:slug] tags — keep them in text for link rendering in widget
  const propRegex = /\[PROP:([a-z0-9\-]+)\]/g;
  const slugsFound: string[] = [];
  let propMatch: RegExpExecArray | null;
  while ((propMatch = propRegex.exec(reply)) !== null) {
    slugsFound.push(propMatch[1]);
  }

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
