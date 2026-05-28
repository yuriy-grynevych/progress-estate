import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PropertiesMap from "@/components/admin/PropertiesMap";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { inferCoords } from "@/lib/map-data";

export const dynamic = "force-dynamic";

export default async function AdminMapPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "EMPLOYEE";
  const userId = (session?.user as any)?.id as string;

  const baseWhere =
    role === "ADMIN"
      ? { status: "ACTIVE" as const }
      : { status: "ACTIVE" as const, assignedUserId: userId };

  const properties = await prisma.property.findMany({
    where: baseWhere,
    select: {
      id: true,
      slug: true,
      titleUk: true,
      price: true,
      currency: true,
      type: true,
      listingType: true,
      district: true,
      address: true,
      latitude: true,
      longitude: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  let withExact = 0;
  let withJk = 0;
  let withDistrict = 0;
  let noCoords = 0;

  const typeCounts: Record<string, number> = {};

  const mapProps = properties
    .map((p) => {
      typeCounts[p.type] = (typeCounts[p.type] ?? 0) + 1;

      // 1. Manualne współrzędne — najdokładniejsze
      if (p.latitude != null && p.longitude != null) {
        withExact++;
        return {
          id: p.id, slug: p.slug, titleUk: p.titleUk,
          price: Number(p.price), currency: p.currency,
          type: p.type, listingType: p.listingType,
          district: p.district,
          latitude: p.latitude, longitude: p.longitude,
          imageUrl: p.images[0]?.url ?? null,
          coordsSource: "exact" as const,
          sourceName: undefined as string | undefined,
        };
      }

      // 2. Wywnioskuj z ЖК / dzielnicy
      const inferred = inferCoords(p.titleUk, p.address, p.district);
      if (inferred.source) {
        if (inferred.source === "jk") withJk++;
        else withDistrict++;
        return {
          id: p.id, slug: p.slug, titleUk: p.titleUk,
          price: Number(p.price), currency: p.currency,
          type: p.type, listingType: p.listingType,
          district: p.district,
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
      <div className="flex-shrink-0 flex flex-wrap items-center gap-4 mb-3">
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
