import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ── Maps ──────────────────────────────────────────────────────────────────────

const typeMap: Record<string, string> = {
  APARTMENT: "квартира", ROOM: "кімната", HOUSE: "будинок",
  APARTMENT_PREMIUM: "апартаменти", VILLA: "вілла", PENTHOUSE: "пентхаус",
  TOWNHOUSE: "таунхаус", DUPLEX: "дуплекс", OFFICE: "офіс",
  RETAIL: "торгівельна площа", WAREHOUSE: "склад", COMMERCIAL: "комерція",
  GARAGE: "гараж", PARKING: "паркінг", LAND: "земельна ділянка",
  SHOP: "магазин", INDUSTRIAL: "виробниче приміщення",
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

// Contact block variants (with emojis, for copy mode)
const CONTACT_VARIANTS = [
  (name: string, phone: string) =>
    `Телефон: ${phone} — ${name}\n💬 Пишіть або телефонуйте у будь-який зручний месенджер (Viber, Telegram, WhatsApp).`,
  (name: string, phone: string) =>
    `📞 ${name}: ${phone}\n💬 Зв'яжіться зручним для вас способом — Viber, Telegram або WhatsApp.`,
  (name: string, phone: string) =>
    `📱 Для зв'язку: ${name} — ${phone}\n💬 Відповімо у будь-якому месенджері: Viber, Telegram, WhatsApp.`,
  (name: string, phone: string) =>
    `☎️ ${name} | ${phone}\n💬 Телефонуйте або пишіть — Viber, Telegram, WhatsApp, завжди на зв'язку!`,
  (name: string, phone: string) =>
    `Контакт: ${name} 📞 ${phone}\n💬 Зручний месенджер — Viber, Telegram, WhatsApp — оберіть свій.`,
];

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("38")) {
    const d = digits.slice(2);
    return `+38 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`;
  }
  if (digits.length === 10) {
    return `+38 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
  }
  return raw;
}

// ── Build data lines ───────────────────────────────────────────────────────────

function buildLines(params: any): { emoji: string; plain: string }[] {
  const lines: { emoji: string; plain: string }[] = [];
  const add = (emoji: string, label: string, value: string) =>
    lines.push({ emoji: `${emoji} ${label}: ${value}`, plain: `• ${label}: ${value}` });

  if (params.type)           add("🏠", "Тип",            typeMap[params.type]    ?? params.type);
  if (params.listingType)    add("🏷️", "Призначення",    listingMap[params.listingType] ?? params.listingType);
  if (params.district)       add("📍", "Район",           params.district);
  if (params.address)        add("🗺️", "Адреса",          params.address);
  if (params.residentialComplex) add("🏗️", "ЖК",         params.residentialComplex);
  if (params.areaSqm)        add("📐", "Загальна площа",  `${params.areaSqm} м²`);
  if (params.kitchenSqm)     add("🍳", "Кухня",           `${params.kitchenSqm} м²`);
  if (params.rooms)          add("🚪", "Кімнат",          String(params.rooms));
  if (params.bedrooms)       add("🛏️", "Спалень",         String(params.bedrooms));
  if (params.bathrooms)      add("🚿", "Санвузлів",        String(params.bathrooms));
  if (params.floor && params.totalFloors)
                             add("🏢", "Поверх",           `${params.floor} з ${params.totalFloors}`);
  else if (params.floor)     add("🏢", "Поверх",           String(params.floor));
  if (params.yearBuilt)      add("📅", "Рік побудови",    String(params.yearBuilt));
  if (params.renovationType) add("🔨", "Ремонт",          renovationMap[params.renovationType] ?? params.renovationType);
  if (params.heatingType)    add("🌡️", "Опалення",        heatingMap[params.heatingType] ?? params.heatingType);
  if (params.price && params.currency)
                             add("💰", "Ціна",            `${Number(params.price).toLocaleString("uk-UA")} ${params.currency}`);
  return lines;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await req.json();
  const mode: string = params.mode ?? "website"; // "website" | "copy"

  const lines = buildLines(params);
  const plainLines  = lines.map(l => l.plain);
  const emojiLines  = lines.map(l => l.emoji);

  // ── COPY MODE: plain text with emojis + contact block ──────────────────────
  if (mode === "copy") {
    const user = session.user as any;
    const agentName  = user?.name  ?? "Агент";
    const agentPhone = user?.phone ? formatPhone(user.phone) : "";

    const variant = CONTACT_VARIANTS[Math.floor(Math.random() * CONTACT_VARIANTS.length)];
    const contactBlock = agentPhone ? `\n\n${variant(agentName, agentPhone)}` : "";

    const text = emojiLines.join("\n") + contactBlock;
    return NextResponse.json({ text });
  }

  // ── WEBSITE MODE: clean HTML via AI, no emojis ────────────────────────────
  if (plainLines.length === 0) {
    return NextResponse.json({ html: "" });
  }

  const paramText = plainLines.join("\n");

  const introStyles = [
    "одне коротке, конкретне речення що одразу передає суть об'єкта",
    "пряме звернення до потенційного покупця — що він отримає",
    "фраза яка виділяє головну перевагу саме цього об'єкта",
    "нейтральний, діловий вступ з ключовою характеристикою",
    "одна чітка думка про локацію або стан об'єкта",
  ];
  const introStyle = introStyles[Math.floor(Math.random() * introStyles.length)];

  const prompt = `Ти — рієлтор-копірайтер. Напиши опис нерухомості українською мовою.

Дані об'єкта (ТІЛЬКИ ЦЕ використовуй, нічого не вигадуй):
${paramText}

Структура — поверни ТІЛЬКИ валідний HTML, без пояснень і markdown:

1. <p> — вступ (стиль: ${introStyle}). Одне речення. Без кліше типу "ідеальне поєднання".

2. <ul> з <li> — перелич характеристики ТІЛЬКИ з наданих даних вище. Кожен параметр — окремий пункт. Без emoji. Формат: "Площа: 92 м²", "Поверх: 5/9", тощо.

Заборонено:
- Емодзі будь-які
- Вигадані переваги або деталі яких немає в даних
- Розділ "Чому варто обрати" або будь-які вигадані pluses
- Шаблонні фрази про "затишок", "комфорт", "ідеальний варіант"
- Будь-яка інформація не з наданих даних

Використовуй ТІЛЬКИ теги: <p>, <ul>, <li>`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a Ukrainian real estate copywriter. Return ONLY valid HTML. Never invent facts. Use ONLY the data provided." },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 500,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: "AI error" }, { status: 500 });

  const data = await res.json();
  let html = data.choices?.[0]?.message?.content ?? "";
  html = html.replace(/^```html?\s*/i, "").replace(/```\s*$/i, "").trim();

  return NextResponse.json({ html });
}
