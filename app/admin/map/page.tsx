import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PropertiesMap from "@/components/admin/PropertiesMap";
import { MapPin } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminMapPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "EMPLOYEE";
  const userId = (session?.user as any)?.id as string;

  const baseWhere =
    role === "ADMIN"
      ? { status: "ACTIVE" as const }
      : { status: "ACTIVE" as const, assignedUserId: userId };

  const [properties, withoutCoords] = await Promise.all([
    prisma.property.findMany({
      where: {
        ...baseWhere,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        slug: true,
        titleUk: true,
        price: true,
        currency: true,
        type: true,
        listingType: true,
        district: true,
        latitude: true,
        longitude: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.count({
      where: {
        ...baseWhere,
        OR: [{ latitude: null }, { longitude: null }],
      },
    }),
  ]);

  const mapProps = properties.map((p) => ({
    id: p.id,
    slug: p.slug,
    titleUk: p.titleUk,
    price: Number(p.price),
    currency: p.currency,
    type: p.type,
    listingType: p.listingType,
    district: p.district,
    latitude: p.latitude!,
    longitude: p.longitude!,
    imageUrl: p.images[0]?.url ?? null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-gold-500" />
            Карта нерухомості
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {mapProps.length} об'єктів на карті
            {withoutCoords > 0 && (
              <span className="text-amber-500 ml-2">
                · {withoutCoords} без координат —{" "}
                <Link href="/admin/properties" className="underline hover:text-amber-600">
                  додати →
                </Link>
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-navy-900 inline-block" />
            Продаж
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gold-500 inline-block" />
            Оренда
          </span>
        </div>
      </div>

      {mapProps.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
          <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Немає оголошень з координатами</p>
          <p className="text-gray-400 text-sm mt-1">
            Відкрийте будь-яке оголошення і встановіть позначку на карті
          </p>
          <Link
            href="/admin/properties"
            className="inline-block mt-4 bg-black text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-black/90 transition"
          >
            До нерухомості →
          </Link>
        </div>
      ) : (
        <PropertiesMap properties={mapProps} />
      )}
    </div>
  );
}
