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

  const prompt = `Ти — досвідчений рієлтор. Напиши рекламний опис нерухомості українською мовою на основі параметрів нижче.

Параметри:
${paramText}

Вимоги до формату — поверни ТІЛЬКИ HTML, без пояснень:
1. Перший абзац — коротке (1-2 речення) привабливе вступне речення
2. <ul> з <li> для кожного параметру з emoji (вже вказані в параметрах — залиш їх)
3. Після списку параметрів — абзац <p><strong>✅ Чому варто обрати:</strong></p>
4. Потім <ul> з 3-5 пунктів <li> — конкретні переваги цього об'єкту (зручне розташування, хороший поверх, площа, інвестиційна привабливість тощо) виходячи з параметрів. Кожен пункт починається з відповідного emoji.
5. Не додавай заголовки <h1>/<h2>, лише <p>, <strong> і <ul><li>
6. Текст лаконічний, без води`;

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
      temperature: 0.6,
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
