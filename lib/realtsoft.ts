import { XMLParser } from "fast-xml-parser";

const FEED_URL = "https://crm-progress.realtsoft.net/feed/xml?id=4";

export type RealtsoftOffer = {
  internalId: string;
  type: "SALE" | "RENT";
  propertyType: "APARTMENT" | "HOUSE" | "COMMERCIAL" | "LAND";
  titleUk: string;
  descriptionUk: string;
  price: number;
  currency: string;
  areaSqm: number;
  rooms: number | null;
  floor: number | null;
  totalFloors: number | null;
  city: string;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  isNewBuilding: boolean;
  kitchenSqm: number | null;
};

function mapContractType(type: string): "SALE" | "RENT" {
  const t = type.toLowerCase();
  if (t.includes("аренд") || t.includes("оренд")) return "RENT";
  return "SALE";
}

function mapRealtyType(type: string): "APARTMENT" | "HOUSE" | "COMMERCIAL" | "LAND" {
  const t = type.toLowerCase();
  if (t.includes("кварт")) return "APARTMENT";
  if (t.includes("дом") || t.includes("будин") || t.includes("котедж")) return "HOUSE";
  if (t.includes("земл") || t.includes("ділянк")) return "LAND";
  if (t.includes("комерц") || t.includes("офіс") || t.includes("магаз")) return "COMMERCIAL";
  return "APARTMENT";
}

function parseCurrency(cur: string): string {
  if (cur === "$" || cur.toLowerCase() === "usd") return "USD";
  if (cur === "€" || cur.toLowerCase() === "eur") return "EUR";
  return "UAH";
}

export async function fetchRealtsoftOffers(): Promise<RealtsoftOffer[]> {
  const res = await fetch(FEED_URL, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Realtsoft feed error: ${res.status}`);

  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    isArray: (name) => name === "image" || name === "announcement",
  });

  const parsed = parser.parse(xml);
  const feed = parsed["page"] ?? Object.values(parsed).find((v: any) => v?.announcements);
  const announcements = feed?.announcements?.announcement ?? [];

  return (announcements as any[]).map((a: any, index: number): RealtsoftOffer => {
    const internalId = a.agency_code ? String(a.agency_code) : String(index + 1);
    const images: string[] = Array.isArray(a.images?.image)
      ? a.images.image
      : a.images?.image
      ? [a.images.image]
      : [];

    const street = a.street ?? "";
    const address = street ? `${street}` : null;

    return {
      internalId,
      type: mapContractType(a.contract_type ?? ""),
      propertyType: mapRealtyType(a.realty_type ?? ""),
      titleUk: a.title ?? `${a.realty_type ?? "Нерухомість"}, ${a.city ?? ""}`,
      descriptionUk: a.text ?? "",
      price: Number(a.price ?? 0),
      currency: parseCurrency(a.currency ?? ""),
      areaSqm: Number(a.total_area ?? 0),
      rooms: a.room_count ? Number(a.room_count) : null,
      floor: a.floor ? Number(a.floor) : null,
      totalFloors: a.floor_count ? Number(a.floor_count) : null,
      city: a.city ?? "Івано-Франківськ",
      district: a.district || a.microdistrict || null,
      address,
      latitude: null,
      longitude: null,
      images,
      isNewBuilding: false,
      kitchenSqm: a.kitchen_area ? Number(a.kitchen_area) : null,
    };
  });
}
