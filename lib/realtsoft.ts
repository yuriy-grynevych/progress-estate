const FEED_URL = "https://crm-progress.realtsoft.net/feed/json?id=4";

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

function mapDeal(deal: any): "SALE" | "RENT" {
  const name: string = deal?.name ?? "";
  if (name.toLowerCase().includes("оренд") || name.toLowerCase().includes("аренд")) return "RENT";
  return "SALE";
}

function mapRealtyType(rt: any): "APARTMENT" | "HOUSE" | "COMMERCIAL" | "LAND" | "OFFICE" {
  const name: string = rt?.name?.toLowerCase() ?? "";
  if (name.includes("кварт")) return "APARTMENT";
  if (name.includes("будин") || name.includes("дом") || name.includes("котедж") || name.includes("вілл")) return "HOUSE";
  if (name.includes("земл") || name.includes("ділянк")) return "LAND";
  if (name.includes("офіс")) return "OFFICE";
  if (name.includes("комерц") || name.includes("магаз") || name.includes("склад")) return "COMMERCIAL";
  return "APARTMENT";
}

function mapCurrency(cur: string): string {
  if (cur === "USD" || cur === "$") return "USD";
  if (cur === "EUR" || cur === "€") return "EUR";
  return "UAH";
}

export async function fetchRealtsoftOffers(): Promise<RealtsoftOffer[]> {
  const res = await fetch(FEED_URL, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Realtsoft feed error: ${res.status}`);

  const data = await res.json();
  const estates: any[] = data.estates ?? [];

  return estates.map((e: any): RealtsoftOffer => {
    const loc = e.location ?? {};
    const street = loc.street?.name ?? null;
    const district = loc.district?.name ?? null;
    const city = loc.city?.name ?? "Івано-Франківськ";
    const address = street || null;

    return {
      internalId: String(e.article ?? e.id),
      type: mapDeal(e.deal),
      propertyType: mapRealtyType(e.realty_type),
      titleUk: e.title ?? `${e.realty_type?.name ?? "Нерухомість"}, ${city}`,
      descriptionUk: e.description ?? "",
      price: Number(e.price?.value ?? 0),
      currency: mapCurrency(e.price?.currency ?? ""),
      areaSqm: Number(e.area_total ?? 0),
      rooms: e.room_count ? Number(e.room_count) : null,
      floor: e.floor ? Number(e.floor) : null,
      totalFloors: e.total_floors ? Number(e.total_floors) : null,
      city,
      district,
      address,
      latitude: loc.map_lat ? Number(loc.map_lat) : null,
      longitude: loc.map_lng ? Number(loc.map_lng) : null,
      images: Array.isArray(e.images) ? e.images : [],
      isNewBuilding: e.is_new_building === 1 || e.is_new_building === true,
      kitchenSqm: e.area_kitchen ? Number(e.area_kitchen) : null,
    };
  });
}
