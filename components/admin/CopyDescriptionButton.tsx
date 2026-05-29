"use client";

import { useState } from "react";
import { ClipboardCopy, Check } from "lucide-react";

interface Props {
  agentName?: string | null;
  agentPhone?: string | null;
  propertyParams: {
    type?: string; listingType?: string; district?: string; address?: string;
    residentialComplex?: string; areaSqm?: number | null; kitchenSqm?: number | null;
    rooms?: number | null; bedrooms?: number | null; bathrooms?: number | null;
    floor?: number | null; totalFloors?: number | null; yearBuilt?: number | null;
    renovationType?: string | null; price?: number | string | null; currency?: string;
  };
}

const TYPE_MAP: Record<string, string> = {
  APARTMENT: "квартира", ROOM: "кімната", HOUSE: "будинок",
  APARTMENT_PREMIUM: "апартаменти", VILLA: "вілла", PENTHOUSE: "пентхаус",
  TOWNHOUSE: "таунхаус", DUPLEX: "дуплекс", OFFICE: "офіс",
  RETAIL: "торгівельна площа", WAREHOUSE: "склад", COMMERCIAL: "комерція",
  GARAGE: "гараж", PARKING: "паркінг", LAND: "земельна ділянка",
  SHOP: "магазин", INDUSTRIAL: "виробниче приміщення",
};
const LISTING_MAP: Record<string, string> = {
  SALE: "продаж", RENT: "оренда", DAILY_RENT: "подобова оренда",
};
const RENOVATION_MAP: Record<string, string> = {
  COSMETIC: "косметичний ремонт", EURO: "євроремонт",
  DESIGNER: "дизайнерський ремонт", WITHOUT_RENOVATION: "без ремонту",
  ROUGH_FINISH: "чорновий стан",
};

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

function buildEmojiText(p: Props["propertyParams"]): string {
  const lines: string[] = [];
  if (p.type)               lines.push(`🏠 Тип: ${TYPE_MAP[p.type] ?? p.type}`);
  if (p.listingType)        lines.push(`🏷️ Призначення: ${LISTING_MAP[p.listingType] ?? p.listingType}`);
  if (p.district)           lines.push(`📍 Район: ${p.district}`);
  if (p.address)            lines.push(`🗺️ Адреса: ${p.address}`);
  if (p.residentialComplex) lines.push(`🏗️ ЖК: ${p.residentialComplex}`);
  if (p.areaSqm)            lines.push(`📐 Загальна площа: ${p.areaSqm} м²`);
  if (p.kitchenSqm)         lines.push(`🍳 Кухня: ${p.kitchenSqm} м²`);
  if (p.rooms)              lines.push(`🚪 Кімнат: ${p.rooms}`);
  if (p.bedrooms)           lines.push(`🛏️ Спалень: ${p.bedrooms}`);
  if (p.bathrooms)          lines.push(`🚿 Санвузлів: ${p.bathrooms}`);
  if (p.floor != null && p.totalFloors) lines.push(`🏢 Поверх: ${p.floor} з ${p.totalFloors}`);
  else if (p.floor != null) lines.push(`🏢 Поверх: ${p.floor}`);
  if (p.yearBuilt)          lines.push(`📅 Рік побудови: ${p.yearBuilt}`);
  if (p.renovationType)     lines.push(`🔨 Ремонт: ${RENOVATION_MAP[p.renovationType] ?? p.renovationType}`);
  if (p.price && p.currency) lines.push(`💰 Ціна: ${Number(p.price).toLocaleString("uk-UA")} ${p.currency}`);
  return lines.join("\n");
}

export default function CopyDescriptionButton({ agentName, agentPhone, propertyParams }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const body = buildEmojiText(propertyParams);

    const name  = agentName  ?? "Агент";
    const phone = agentPhone ? formatPhone(agentPhone) : "";
    const variant = CONTACT_VARIANTS[Math.floor(Math.random() * CONTACT_VARIANTS.length)];
    const contact = phone ? `\n\n${variant(name, phone)}` : "";

    const text = contact ? contact.trim() + "\n\n" + body : body;

    const write = (t: string) => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(t).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
      } else {
        const el = document.createElement("textarea");
        el.value = t;
        el.style.cssText = "position:fixed;opacity:0.01;top:0;left:0;";
        document.body.appendChild(el);
        el.focus(); el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        setCopied(true); setTimeout(() => setCopied(false), 2500);
      }
    };
    write(text);
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
        copied ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
      {copied ? "Скопійовано!" : "Копіювати опис"}
    </button>
  );
}
