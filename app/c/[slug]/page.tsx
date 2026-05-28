import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Maximize2, BedDouble, Phone } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Квартира",
  ROOM: "Кімната",
  HOUSE: "Будинок",
  APARTMENT_PREMIUM: "Преміум квартира",
  VILLA: "Вілла",
  PENTHOUSE: "Пентхаус",
  TOWNHOUSE: "Таунхаус",
  DUPLEX: "Дуплекс",
  COMMERCIAL: "Комерція",
  OFFICE: "Офіс",
  RETAIL: "Рітейл",
  WAREHOUSE: "Склад",
  INDUSTRIAL: "Виробниче",
  FOOD_SERVICE: "Громадське харч.",
  SERVICE_OBJECT: "Сервісний об'єкт",
  OTHER_OBJECT: "Інший об'єкт",
  SHOP: "Магазин",
  HOTEL_ROOM: "Номер готелю",
  WHOLE_BUILDING: "Ціла будівля",
  LAND: "Земля",
  LAND_INDIVIDUAL: "Земля ІЖС",
  LAND_GARDEN: "Садова ділянка",
  LAND_FARM: "Фермерська ділянка",
  LAND_COMMERCIAL: "Комерційна земля",
  GARAGE: "Гараж",
  PARKING: "Паркінг",
};

async function getCollection(slug: string) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return prisma.collection.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          name: true,
          phone: true,
          photoUrl: true,
          agentToken: true,
          accentColor: true,
        },
      },
      items: {
        where: {
          property: {
            NOT: { AND: [{ status: "SOLD" }, { updatedAt: { lt: oneDayAgo } }] },
          },
        },
        orderBy: { order: "asc" },
        include: {
          property: {
            select: {
              id: true,
              slug: true,
              titleUk: true,
              price: true,
              currency: true,
              type: true,
              listingType: true,
              areaSqm: true,
              rooms: true,
              address: true,
              district: true,
              city: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
    },
  });
}

export default async function PublicCollectionPage({
  params,
}: {
  params: { slug: string };
}) {
  const collection = await getCollection(params.slug);
  if (!collection) notFound();

  const { user, items, name } = collection;
  const accentColor = user.accentColor ?? "#C9A84C";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-4 border-gold-500"
          >
            {user.photoUrl ? (
              <Image
                src={user.photoUrl}
                alt={user.name ?? "Агент"}
                width={80}
                height={80}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: accentColor }}
              >
                {user.name?.[0]?.toUpperCase() ?? "А"}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-0.5">
              {user.name ?? "Агент"}
            </h1>
            {user.phone && (
              <a
                href={`tel:${user.phone}`}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-2"
              >
                <Phone className="w-3.5 h-3.5" />
                {user.phone}
              </a>
            )}
            <p className="text-sm text-gray-400">
              Підбірка: <span className="font-semibold text-gray-700">{name}</span>
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div
              className="text-2xl font-extrabold"
              style={{ color: accentColor }}
            >
              {items.length}
            </div>
            <div className="text-xs text-gray-400">об'єктів</div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            У цій підбірці поки немає об'єктів
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map(({ property: p }) => {
              const img = p.images[0]?.url;
              const locationParts = [p.address, p.district, p.city].filter(Boolean);
              const detailsHref = `/p/${p.slug}${user.agentToken ? `?t=${user.agentToken}` : ""}`;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl shadow-sm border-2 border-gold-200 hover:border-gold-400 transition-colors overflow-hidden flex flex-col sm:flex-row"
                >
                  <Link
                    href={detailsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full sm:w-52 h-44 sm:h-auto flex-shrink-0 block group"
                  >
                    {img ? (
                      <Image
                        src={img}
                        alt={p.titleUk}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        Фото відсутнє
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-gold-500 text-navy-900 px-2 py-0.5 rounded-lg text-xs font-bold">
                      {TYPE_LABELS[p.type] ?? p.type}
                    </div>
                  </Link>

                  <div className="p-4 flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <Link
                        href={detailsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block font-semibold text-navy-900 hover:text-gold-600 mb-1.5 line-clamp-2 leading-snug transition-colors"
                      >
                        {p.titleUk}
                      </Link>
                      {locationParts.length > 0 && (
                        <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-2">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{locationParts.join(", ")}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        {p.rooms != null && (
                          <span className="flex items-center gap-1">
                            <BedDouble className="w-3.5 h-3.5" />
                            {p.rooms} кім.
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Maximize2 className="w-3.5 h-3.5" />
                          {p.areaSqm} м²
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-lg font-extrabold text-navy-900">
                        {formatPrice(p.price, p.currency)}
                      </span>
                      <Link
                        href={detailsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition bg-gold-500 hover:bg-gold-600 text-navy-900"
                      >
                        Деталі →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
