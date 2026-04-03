import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye",
    ж: "zh", з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l",
    м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
    ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "yu",
    я: "ya", ё: "yo",
  };
  return text
    .toLowerCase()
    .replace(/[а-яёіїєґ]/g, (char) => map[char] || char)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^-+|-+$/g, "");
}

export function formatPrice(
  price: number | string | { toNumber(): number },
  currency: string,
  locale: string = "uk"
): string {
  const num = typeof price === "object" ? price.toNumber() : Number(price);
  if (currency === "UAH") {
    return (
      new Intl.NumberFormat(locale === "uk" ? "uk-UA" : "en-US", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num) + " грн"
    );
  }
  const symbol = currency === "USD" ? "$" : "€";
  return (
    symbol +
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  );
}

export function formatArea(area: number): string {
  return `${area} м²`;
}

export function getPropertyTypeLabel(type: string, locale: string = "uk"): string {
  const map: Record<string, { uk: string; en: string }> = {
    APARTMENT: { uk: "Квартира", en: "Apartment" },
    HOUSE: { uk: "Будинок", en: "House" },
    COMMERCIAL: { uk: "Комерція", en: "Commercial" },
    LAND: { uk: "Земля", en: "Land" },
    OFFICE: { uk: "Офіс", en: "Office" },
  };
  return map[type]?.[locale as "uk" | "en"] ?? type;
}

export function getListingTypeLabel(type: string, locale: string = "uk"): string {
  const map: Record<string, { uk: string; en: string }> = {
    SALE: { uk: "Продаж", en: "For Sale" },
    RENT: { uk: "Оренда", en: "For Rent" },
  };
  return map[type]?.[locale as "uk" | "en"] ?? type;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}
