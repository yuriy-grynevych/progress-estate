import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PropertiesMap from "@/components/admin/PropertiesMap";
import MapFilterBar from "@/components/admin/MapFilterBar";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { inferCoords } from "@/lib/map-data";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function AdminMapPage({
  searchParams,
}: {
  searchParams: {
    rooms?: string; type?: string; district?: string;
    priceMin?: string; priceMax?: string;
    areaMin?: string; areaMax?: string;
  };
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "EMPLOYEE";
  const userId = (session?.user as any)?.id as string;

  const where: any = role === "ADMIN"
    ? { status: "ACTIVE" }
    : { status: "ACTIVE", assignedUserId: userId };

  if (searchParams.rooms) {
    const r = parseInt(searchParams.rooms);
    where.rooms = searchParams.rooms === "4" ? { gte: 4 } : r;
  }
  if (searchParams.type)     where.type = searchParams.type;
  if (searchParams.district) where.OR = [
    { district: { contains: searchParams.district, mode: "insensitive" } },
    { residentialComplex: { contains: searchParams.district, mode: "insensitive" } },
    { address: { contains: searchParams.district, mode: "insensitive" } },
  ];
  if (searchParams.priceMin || searchParams.priceMax) {
    where.price = {};
    if (searchParams.priceMin) where.price.gte = parseFloat(searchParams.priceMin);
    if (searchParams.priceMax) where.price.lte = parseFloat(searchParams.priceMax);
  }
  if (searchParams.areaMin || searchParams.areaMax) {
    where.areaSqm = {};
    if (searchParams.areaMin) where.areaSqm.gte = parseFloat(searchParams.areaMin);
    if (searchParams.areaMax) where.areaSqm.lte = parseFloat(searchParams.areaMax);
  }

  const allDistricts = await prisma.property.findMany({
    where: { status: "ACTIVE" },
    select: { district: true, residentialComplex: true },
    distinct: ["district"],
  });
  const districtOptions = Array.from(new Set(
    allDistricts.flatMap(p => [p.district, p.residentialComplex].filter(Boolean) as string[])
  )).sort((a, b) => a.localeCompare(b, "uk"));

  const properties = await prisma.property.findMany({
    where,
    select: {
      id: true, slug: true, titleUk: true,
      price: true, currency: true,
      type: true, listingType: true,
      district: true, address: true,
      latitude: true, longitude: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  let withExact = 0, withJk = 0, withDistrict = 0, noCoords = 0;
  const typeCounts: Record<string, number> = {};

  const mapProps = properties
    .map((p) => {
      typeCounts[p.type] = (typeCounts[p.type] ?? 0) + 1;

      if (p.latitude != null && p.longitude != null) {
        withExact++;
        return {
          id: p.id, slug: p.slug, titleUk: p.titleUk,
          price: Number(p.price), currency: p.currency,
          type: p.type, listingType: p.listingType, district: p.district,
          latitude: p.latitude, longitude: p.longitude,
          imageUrl: p.images[0]?.url ?? null,
          coordsSource: "exact" as const, sourceName: undefined as string | undefined,
        };
      }

      const inferred = inferCoords(p.titleUk, p.address, p.district);
      if (inferred.source) {
        if (inferred.source === "jk") withJk++; else withDistrict++;
        return {
          id: p.id, slug: p.slug, titleUk: p.titleUk,
          price: Number(p.price), currency: p.currency,
          type: p.type, listingType: p.listingType, district: p.district,
          latitude: inferred.lat, longitude: inferred.lng,
          imageUrl: p.images[0]?.url ?? null,
          coordsSource: inferred.source as "jk" | "district",
          sourceName: inferred.sourceName,
        };
      }

      noCoords++;
      return null;
    })
    .filter(Boolean) as any[];

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 48px)" }}>
      {/* Header */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-4 mb-2">
        <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-gold-500" />
          Карта нерухомості
        </h1>
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {[
            { icon: "🏠", label: "Квартири", key: "APARTMENT" },
            { icon: "🏡", label: "Будинки",  key: "HOUSE" },
            { icon: "🏢", label: "Комерція", key: "COMMERCIAL" },
            { icon: "🏗", label: "Офіси",    key: "OFFICE" },
            { icon: "🌿", label: "Земля",    key: "LAND" },
          ]
            .filter(({ key }) => typeCounts[key])
            .map(({ icon, label, key }) => (
              <span key={key} className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                {icon} {label}: <b className="text-navy-900">{typeCounts[key]}</b>
              </span>
            ))}
          <span className="w-px h-3 bg-gray-300 self-center" />
          <span className="flex items-center gap-1">📍 GPS: <b className="text-navy-900">{withExact}</b></span>
          <span className="flex items-center gap-1">🏗 ЖК: <b className="text-blue-600">{withJk}</b></span>
          <span className="flex items-center gap-1">📌 Район: <b className="text-amber-600">{withDistrict}</b></span>
          {noCoords > 0 && (
            <span className="text-red-400">
              ⚠ Без адреси: <b>{noCoords}</b> —{" "}
              <Link href="/admin/properties?noCoords=1" className="underline">заповнити →</Link>
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 mb-2">
        <Suspense fallback={null}>
          <MapFilterBar districtOptions={districtOptions} />
        </Suspense>
      </div>

      {/* Map */}
      <div className="flex-1 min-h-0">
        {mapProps.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gold-300">
            <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Немає оголошень</p>
            <Link href="/admin/properties" className="inline-block mt-4 bg-black text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-black/90 transition">
              До нерухомості →
            </Link>
          </div>
        ) : (
          <PropertiesMap properties={mapProps} />
        )}
      </div>
    </div>
  );
}
