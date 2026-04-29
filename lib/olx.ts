import { prisma } from "@/lib/prisma";

const OLX_TOKEN_URL = "https://www.olx.ua/api/open/oauth/token";
const OLX_API_BASE = "https://www.olx.ua/api/partner";

export interface OlxSettings {
  olx_client_id: string;
  olx_client_secret: string;
  olx_city_id: string;
  olx_contact_phone: string;
  olx_advertiser_type: string;
}

const OLX_DEFAULTS: OlxSettings = {
  olx_client_id: "",
  olx_client_secret: "",
  olx_city_id: "12",
  olx_contact_phone: "",
  olx_advertiser_type: "business",
};

// Category IDs for OLX Ukraine real estate
const CATEGORY_MAP: Record<string, Record<string, number>> = {
  APARTMENT: { SALE: 4,  RENT: 5  },
  HOUSE:     { SALE: 8,  RENT: 9  },
  COMMERCIAL:{ SALE: 13, RENT: 13 },
  LAND:      { SALE: 14, RENT: 14 },
  OFFICE:    { SALE: 13, RENT: 13 },
};

let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getOlxSettings(): Promise<OlxSettings> {
  try {
    const rows = await prisma.$queryRawUnsafe<{ key: string; value: string }[]>(
      `SELECT key, value FROM company_settings WHERE key LIKE 'olx_%'`
    );
    const result = { ...OLX_DEFAULTS };
    for (const r of rows) {
      if (r.key in result) (result as any)[r.key] = r.value;
    }
    return result;
  } catch {
    return { ...OLX_DEFAULTS };
  }
}

async function getAccessToken(settings: OlxSettings): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const res = await fetch(OLX_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: settings.olx_client_id,
      client_secret: settings.olx_client_secret,
      scope: "v2 read write",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OLX OAuth помилка: ${text}`);
  }

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return tokenCache.token;
}

export interface OlxPropertyPayload {
  title: string;
  description: string;
  price: number;
  currency: string;
  propertyType: string;
  listingType: string;
  rooms?: number | null;
  floor?: number | null;
  totalFloors?: number | null;
  areaSqm?: number;
  images: string[];
  externalId: string;
}

export async function publishToOlx(payload: OlxPropertyPayload): Promise<string> {
  const settings = await getOlxSettings();
  if (!settings.olx_client_id || !settings.olx_client_secret) {
    throw new Error("OLX не налаштовано. Перейдіть до Налаштувань → OLX.");
  }

  const token = await getAccessToken(settings);
  const categoryId = CATEGORY_MAP[payload.propertyType]?.[payload.listingType] ?? 4;

  const attributes: { code: string; value: number }[] = [];
  if (payload.rooms)       attributes.push({ code: "rooms", value: payload.rooms });
  if (payload.floor)       attributes.push({ code: "floor", value: payload.floor });
  if (payload.totalFloors) attributes.push({ code: "total_floors_number", value: payload.totalFloors });
  if (payload.areaSqm)     attributes.push({ code: "total_area", value: Math.round(payload.areaSqm) });

  const body: Record<string, unknown> = {
    advertiser_type: settings.olx_advertiser_type,
    external_id: payload.externalId,
    title: payload.title,
    description: payload.description,
    category: { id: categoryId },
    price: { value: Math.round(payload.price), currency: payload.currency === "USD" ? "USD" : "UAH" },
    location: { city_id: Number(settings.olx_city_id) },
    attributes,
    images: payload.images.slice(0, 8).map((url) => ({ url })),
  };

  if (settings.olx_contact_phone) {
    body.contact = { phone: settings.olx_contact_phone };
  }

  const res = await fetch(`${OLX_API_BASE}/adverts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Version: "2.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OLX API помилка ${res.status}: ${text}`);
  }

  const data = await res.json();
  return String(data.data?.id ?? data.id);
}

export async function unpublishFromOlx(adId: string): Promise<void> {
  const settings = await getOlxSettings();
  const token = await getAccessToken(settings);

  const res = await fetch(`${OLX_API_BASE}/adverts/${adId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Version: "2.0",
    },
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`OLX API помилка ${res.status}: ${text}`);
  }
}
