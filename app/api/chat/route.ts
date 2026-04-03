import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function buildSystemPrompt(locale: string, listings: string): string {
  if (locale === "en") {
    return `You are a knowledgeable AI assistant for Progress Estate, a real estate agency in Ivano-Frankivsk, Ukraine.
IMPORTANT: When recommending specific listings, keep the [PROP:slug] tag right before the property name so the system can render a clickable card. Do not remove these tags.

Company info:
- Phone: +380 67 123 45 67
- Email: info@progressestate.com.ua

Current listings on our website:
${listings}

Your job is to ACTUALLY HELP users — answer their questions directly and in detail. Do NOT just redirect them to call or visit the website for every question.

You CAN and SHOULD:
- Describe neighborhoods, districts, pros/cons of areas in Ivano-Frankivsk
- Explain the buying/renting/selling process step by step
- Discuss average prices, market trends
- Help compare property types (apartment vs house, etc.)
- Answer questions about mortgages, documents, taxes
- Recommend specific listings from the list above when relevant
- Give honest advice about what to look for

When the user wants to schedule a viewing, negotiate price, or needs personal help — instead of saying "call us", say:
"Just leave your name and phone number right here in the chat — and we'll call you at a convenient time 📞"

Rules:
- Always respond in English
- Keep answers helpful and informative (3-6 sentences)
- Be friendly and conversational, not robotic
- If asked about a specific property from the list, provide details`;
  }

  return `Ти — досвідчений AI-асистент агентства нерухомості Progress Estate з Івано-Франківська.
ВАЖЛИВО: Коли рекомендуєш конкретні оголошення, залишай тег [PROP:slug] перед назвою об'єкта — система відобразить красиву картку з фото і посиланням. Не видаляй ці теги.

Контакти компанії:
- Телефон: +380 67 123 45 67
- Email: info@progressestate.com.ua

Актуальні оголошення на нашому сайті:
${listings}

Твоя задача — РЕАЛЬНО ДОПОМАГАТИ користувачам, давати конкретні відповіді. НЕ перенаправляй на дзвінок чи сайт при кожному питанні.

Ти ПОВИНЕН:
- Описувати райони та мікрорайони Івано-Франківська, їх переваги та недоліки
- Пояснювати процес купівлі/продажу/оренди крок за кроком
- Обговорювати середні ціни та тенденції ринку
- Допомагати порівнювати типи нерухомості
- Відповідати на питання про іпотеку, документи, податки
- Рекомендувати конкретні оголошення зі списку вище
- Давати чесні поради щодо того, на що звертати увагу

Коли клієнт хоче домовитись про перегляд, торгуватись або потребує особистої допомоги — замість "зателефонуйте нам" пиши:
"Просто залиште своє ім'я та номер телефону прямо тут у чаті — і ми самі зателефонуємо у зручний для вас час 📞"

Правила:
- Завжди відповідай українською
- Відповіді корисні та інформативні (3-6 речень)
- Будь дружнім та природнім у спілкуванні
- Якщо питають про конкретне оголошення зі списку — надай деталі`;
}

export async function POST(req: NextRequest) {
  const { messages, locale } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }

  // Fetch active listings for context
  const properties = await prisma.property.findMany({
    where: { status: "ACTIVE" },
    select: {
      titleUk: true, titleEn: true, price: true, currency: true,
      areaSqm: true, rooms: true, district: true, address: true,
      listingType: true, type: true, slug: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const isEn = locale === "en";
  const listingsText = properties.length === 0
    ? (isEn ? "No active listings at the moment." : "Наразі немає активних оголошень.")
    : properties.map((p) => {
        const title = isEn ? p.titleEn : p.titleUk;
        const type = isEn ? p.listingType : (p.listingType === "SALE" ? "Продаж" : "Оренда");
        const area = p.areaSqm ? `${p.areaSqm}м²` : "";
        const rooms = p.rooms ? `${p.rooms}кімн.` : "";
        const location = p.address ?? p.district ?? "";
        return `• [PROP:${p.slug}] ${title} — ${type}, ${[area, rooms, location].filter(Boolean).join(", ")}, ${p.price} ${p.currency}`;
      }).join("\n");

  const history = messages.slice(-10);
  const systemPrompt = buildSystemPrompt(isEn ? "en" : "uk", listingsText);

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    console.error("Groq error:", await res.text());
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }

  const data = await res.json();
  let reply: string = data.choices?.[0]?.message?.content ?? (isEn ? "Sorry, please try again." : "Вибачте, спробуйте ще раз.");

  // Extract [PROP:slug] tags and fetch property cards
  const propRegex = /\[PROP:([a-z0-9\-]+)\]/g;
  const slugsFound: string[] = [];
  let propMatch: RegExpExecArray | null;
  while ((propMatch = propRegex.exec(reply)) !== null) {
    slugsFound.push(propMatch[1]);
  }
  const uniqueSlugs = Array.from(new Set(slugsFound));

  // Remove tags from displayed text
  reply = reply.replace(propRegex, "");

  let suggestions: object[] = [];
  if (uniqueSlugs.length > 0) {
    const props = await prisma.property.findMany({
      where: { slug: { in: uniqueSlugs }, status: "ACTIVE" },
      select: {
        slug: true,
        titleUk: true,
        titleEn: true,
        price: true,
        currency: true,
        areaSqm: true,
        rooms: true,
        district: true,
        listingType: true,
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
