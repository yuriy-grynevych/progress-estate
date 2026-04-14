import { XMLParser } from "fast-xml-parser";

const XML_FEED_URL = "https://crm-progress.realtsoft.net/feed/xml?id=4";
const JSON_FEED_URL = "https://crm-progress.realtsoft.net/feed/json?id=4";

export type RealtsoftOffer = {
  internalId: string;
  type: "SALE" | "RENT";
  propertyType: "APARTMENT" | "HOUSE" | "COMMERCIAL" | "LAND" | "OFFICE";
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

function mapRealtyType(type: string): "APARTMENT" | "HOUSE" | "COMMERCIAL" | "LAND" | "OFFICE" {
  const t = type.toLowerCase();
  if (t.includes("кварт")) return "APARTMENT";
  if (t.includes("дом") || t.includes("будин") || t.includes("котедж") || t.includes("вілл")) return "HOUSE";
  if (t.includes("земл") || t.includes("ділянк")) return "LAND";
  if (t.includes("офіс")) return "OFFICE";
  if (t.includes("комерц") || t.includes("магаз") || t.includes("склад")) return "COMMERCIAL";
  return "APARTMENT";
}

function parseCurrency(cur: string): string {
  if (cur === "$" || cur.toLowerCase() === "usd") return "USD";
  if (cur === "€" || cur.toLowerCase() === "eur") return "EUR";
  return "UAH";
}

/** Fetch lat/lng map from JSON feed: { articleId -> { lat, lng } } */
async function fetchJsonCoords(): Promise<Map<string, { lat: number; lng: number }>> {
  const map = new Map<string, { lat: number; lng: number }>();
  try {
    const res = await fetch(JSON_FEED_URL, { next: { revalidate: 0 } });
    if (!res.ok) return map;
    const data = await res.json();
    for (const e of (data.estates ?? [])) {
      const lat = e.location?.map_lat;
      const lng = e.location?.map_lng;
      if (lat && lng) {
        map.set(String(e.article), { lat: Number(lat), lng: Number(lng) });
      }
    }
  } catch {
    // JSON feed is optional — ignore errors
  }
  return map;
}

export async function fetchRealtsoftOffers(): Promise<RealtsoftOffer[]> {
  const [xmlRes, jsonCoords] = await Promise.all([
    fetch(XML_FEED_URL, { next: { revalidate: 0 } }),
    fetchJsonCoords(),
  ]);

  if (!xmlRes.ok) throw new Error(`Realtsoft XML feed error: ${xmlRes.status}`);

  const xml = await xmlRes.text();

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
    const address = street || null;

    // Use coordinates from JSON feed if available
    const coords = jsonCoords.get(internalId);

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
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      images,
      isNewBuilding: false,
      kitchenSqm: a.kitchen_area ? Number(a.kitchen_area) : null,
    };
  });
}
