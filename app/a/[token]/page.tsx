import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Phone, MapPin, Maximize2, BedDouble, Instagram, Copy } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { cloudinaryUrl } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Квартира", ROOM: "Кімната", HOUSE: "Будинок",
  APARTMENT_PREMIUM: "Преміум квартира", VILLA: "Вілла", PENTHOUSE: "Пентхаус",
  TOWNHOUSE: "Таунхаус", DUPLEX: "Дуплекс", COMMERCIAL: "Комерція",
  OFFICE: "Офіс", RETAIL: "Рітейл", WAREHOUSE: "Склад",
  LAND: "Земля", GARAGE: "Гараж", PARKING: "Паркінг",
};

export default async function AgentPublicPage({ params }: { params: { token: string } }) {
  const agent = await prisma.user.findUnique({
    where: { agentToken: params.token },
    select: {
      name: true, phone: true, photoUrl: true, accentColor: true,
      instagram: true, tiktok: true, facebook: true, agentToken: true,
      assignedProperties: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, slug: true, titleUk: true, price: true, currency: true,
          type: true, listingType: true, areaSqm: true, rooms: true,
          address: true, district: true, city: true, status: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
    },
  });

  if (!agent) notFound();

  const accentColor = agent.accentColor ?? "#C9A84C";
  const properties = agent.assignedProperties;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Agent card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-4 border-gold-500">
            {agent.photoUrl ? (
              <Image src={agent.photoUrl} alt={agent.name ?? "Агент"} width={80} height={80} className="object-cover w-full h-full" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: accentColor }}>
                {agent.name?.[0]?.toUpperCase() ?? "А"}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{agent.name ?? "Агент"}</h1>
            {agent.phone && (
              <a href={`tel:${agent.phone}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-2">
                <Phone className="w-3.5 h-3.5" />
                {agent.phone}
              </a>
            )}
            <div className="flex items-center gap-3 mt-1">
              {agent.instagram && (
                <a href={`https://instagram.com/${agent.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors" title="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {agent.tiktok && (
                <a href={`https://tiktok.com/@${agent.tiktok.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors" title="TikTok">
                  <TikTokIcon className="w-5 h-5" />
                </a>
              )}
              {agent.facebook && (
                <a href={agent.facebook.startsWith("http") ? agent.facebook : `https://facebook.com/${agent.facebook}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors" title="Facebook">
                  <FacebookIcon className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-extrabold" style={{ color: accentColor }}>{properties.length}</div>
            <div className="text-xs text-gray-400">об&apos;єктів</div>
          </div>
        </div>

        {/* Properties */}
        {properties.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Немає активних об&apos;єктів</div>
        ) : (
          <div className="flex flex-col gap-4">
            {properties.map((p) => {
              const img = p.images[0]?.url;
              const locationParts = [p.address, p.district, p.city].filter(Boolean);
              const href = `/p/${p.slug}?t=${agent.agentToken}`;
              const isRent = p.listingType === "RENT";

              return (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm border-2 border-gold-200 hover:border-gold-400 transition-colors overflow-hidden flex flex-col sm:flex-row">
                  <Link href={href} target="_blank" rel="noopener noreferrer" className="relative w-full sm:w-52 h-44 sm:h-auto flex-shrink-0 block group">
                    {img ? (
                      <Image
                        src={cloudinaryUrl(img, { width: 400, quality: 60 })}
                        alt={p.titleUk}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">Фото відсутнє</div>
                    )}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="bg-gold-500 text-navy-900 px-2 py-0.5 rounded-lg text-xs font-bold">
                        {TYPE_LABELS[p.type] ?? p.type}
                      </span>
                      {p.status === "SOLD" && (
                        <span className="bg-green-600 text-white px-2 py-0.5 rounded-lg text-xs font-bold">Продано</span>
                      )}
                      {p.status === "RENTED" && (
                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded-lg text-xs font-bold">Здано</span>
                      )}
                      {p.status === "INACTIVE" && (
                        <span className="bg-gray-500 text-white px-2 py-0.5 rounded-lg text-xs font-bold">Неактивне</span>
                      )}
                    </div>
                  </Link>
                  <div className="p-4 flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <Link href={href} target="_blank" rel="noopener noreferrer" className="block font-semibold text-navy-900 hover:text-gold-600 mb-1.5 line-clamp-2 leading-snug transition-colors">
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
                          <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{p.rooms} кім.</span>
                        )}
                        {p.areaSqm && (
                          <span className="flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5" />{p.areaSqm} м²</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <span className="text-lg font-extrabold text-navy-900">{formatPrice(p.price, p.currency)}</span>
                        {isRent && <span className="text-xs text-gray-400 ml-1">/міс</span>}
                      </div>
                      <Link href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition bg-gold-500 hover:bg-gold-600 text-navy-900">
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
