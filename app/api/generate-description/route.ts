import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await req.json();

  const lines: string[] = [];

  const typeMap: Record<string, string> = {
    APARTMENT: "квартира", ROOM: "кімната", HOUSE: "будинок",
    APARTMENT_PREMIUM: "апартаменти", VILLA: "вілла", PENTHOUSE: "пентхаус",
    TOWNHOUSE: "таунхаус", DUPLEX: "дуплекс", OFFICE: "офіс",
    RETAIL: "торгівельна площа", WAREHOUSE: "склад", COMMERCIAL: "комерція",
    GARAGE: "гараж", PARKING: "паркінг", LAND: "земельна ділянка",
  };
  const listingMap: Record<string, string> = {
    SALE: "продаж", RENT: "оренда", DAILY_RENT: "подобова оренда",
  };
  const renovationMap: Record<string, string> = {
    COSMETIC: "косметичний ремонт", EURO: "євроремонт",
    DESIGNER: "дизайнерський ремонт", WITHOUT_RENOVATION: "без ремонту",
    ROUGH_FINISH: "чорновий стан",
  };
  const heatingMap: Record<string, string> = {
    CENTRAL: "централізоване", INDIVIDUAL: "індивідуальне",
    ELECTRIC: "електричне", GAS: "газове", AUTONOMOUS: "автономне",
  };

  if (params.type) lines.push(`🏠 Тип: ${typeMap[params.type] ?? params.type}`);
  if (params.listingType) lines.push(`🏷️ Призначення: ${listingMap[params.listingType] ?? params.listingType}`);
  if (params.district) lines.push(`📍 Район: ${params.district}`);
  if (params.address) lines.push(`🗺️ Адреса: ${params.address}`);
  if (params.residentialComplex) lines.push(`🏗️ ЖК: ${params.residentialComplex}`);
  if (params.areaSqm) lines.push(`📐 Загальна площа: ${params.areaSqm} м²`);
  if (params.kitchenSqm) lines.push(`🍳 Кухня: ${params.kitchenSqm} м²`);
  if (params.rooms) lines.push(`🚪 Кімнат: ${params.rooms}`);
  if (params.bedrooms) lines.push(`🛏️ Спалень: ${params.bedrooms}`);
  if (params.bathrooms) lines.push(`🚿 Санвузлів: ${params.bathrooms}`);
  if (params.floor && params.totalFloors) lines.push(`🏢 Поверх: ${params.floor} з ${params.totalFloors}`);
  else if (params.floor) lines.push(`🏢 Поверх: ${params.floor}`);
  if (params.yearBuilt) lines.push(`📅 Рік побудови: ${params.yearBuilt}`);
  if (params.renovationType) lines.push(`🔨 Ремонт: ${renovationMap[params.renovationType] ?? params.renovationType}`);
  if (params.heatingType) lines.push(`🌡️ Опалення: ${heatingMap[params.heatingType] ?? params.heatingType}`);
  if (params.price && params.currency) lines.push(`💰 Ціна: ${Number(params.price).toLocaleString("uk-UA")} ${params.currency}`);

  const paramText = lines.join("\n");

  const introStyles = [
    "одне яскраве, конкретне речення, що чіпляє — без кліше",
    "питання, що змушує задуматись — чому ця квартира краща за інші?",
    "коротка образна фраза, що передає відчуття від цього простору",
    "одна чітка перевага як вступ — те, що одразу виділяє цей об'єкт",
    "звернення до майбутнього власника — що він тут знайде",
  ];
  const benefitStyles = [
    "підкресли зручність розташування та інфраструктуру",
    "зроби акцент на інвестиційній привабливості та ліквідності",
    "опиши комфорт і якість проживання",
    "виділи унікальні деталі — поверх, вид, планування, стан",
    "фокус на практичності — логістика, паркінг, сусідство",
  ];
  const introStyle = introStyles[Math.floor(Math.random() * introStyles.length)];
  const benefitStyle = benefitStyles[Math.floor(Math.random() * benefitStyles.length)];

  const prompt = `Ти — досвідчений рієлтор-копірайтер. Напиши рекламний опис нерухомості українською мовою.

Дані об'єкта:
${paramText}

Структура відповіді — поверни ТІЛЬКИ валідний HTML, без пояснень і markdown:

1. <p> — вступ (стиль: ${introStyle})

2. <ul> з <li> — характеристики об'єкта у вигляді коротких пунктів з emoji (використай дані вище, кожен параметр окремим пунктом, наприклад: 📐 92 м² загальної площі, 🚪 3 кімнати, 🏢 9/10 поверх і т.д.)

3. <p><strong>Чому варто обрати:</strong></p>

4. <ul> з 3-4 <li> — конкретні переваги (стиль: ${benefitStyle}), кожен пункт з відповідним emoji

Правила:
- Лише теги: <p>, <strong>, <ul>, <li>
- Не повторювати шаблонних фраз типу "ідеальне поєднання комфорту" — пиши конкретно й живо
- Вступ і переваги мають звучати по-різному кожного разу`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a professional Ukrainian real estate copywriter. Return only valid HTML." },
        { role: "user", content: prompt },
      ],
      temperature: 0.92,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }

  const data = await res.json();
  let html = data.choices?.[0]?.message?.content ?? "";

  // Strip markdown code fences if model wrapped output
  html = html.replace(/^```html?\s*/i, "").replace(/```\s*$/i, "").trim();

  return NextResponse.json({ html });
}
