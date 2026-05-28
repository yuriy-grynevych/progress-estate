import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import { MapPin, Maximize2, BedDouble, Bath, Layers, Calendar, Phone, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

async function getProperty(slug: string) {
  return prisma.property.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: "asc" } },
      assignedUser: {
        select: { name: true, phone: true, photoUrl: true, accentColor: true, instagram: true },
      },
    },
  });
}

export default async function PublicPropertyPage({ params }: { params: { slug: string } }) {
  const p = await getProperty(params.slug);
  if (!p) notFound();

  const agent = p.assignedUser;
  const accentColor = agent?.accentColor ?? "#C9A84C";
  const primaryImage = p.images.find(i => i.isPrimary) ?? p.images[0];
  const otherImages = p.images.filter(i => i.id !== primaryImage?.id).slice(0, 4);
  const locationParts = [p.address, p.district, p.city].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: accentColor }}>
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">П</div>
        </div>
        <span className="font-semibold text-gray-800 text-sm">Житлова компанія Progress</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Photo gallery */}
        {primaryImage && (
          <div className="rounded-2xl overflow-hidden bg-gray-200">
            <div className="relative w-full" style={{ paddingBottom: "60%" }}>
              <Image
                src={primaryImage.url}
                alt={p.titleUk}
                fill
                className="object-cover"
                unoptimized
                priority
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="bg-white/90 backdrop-blur-sm text-navy-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                  {getPropertyTypeLabel(p.type)}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full shadow-sm"
                  style={{ backgroundColor: accentColor, color: "#1a2744" }}>
                  {p.listingType === "SALE" ? "Продаж" : p.listingType === "RENT" ? "Оренда" : "Добова оренда"}
                </span>
              </div>
            </div>

            {otherImages.length > 0 && (
              <div className="flex gap-1 p-1 bg-gray-100">
                {otherImages.map(img => (
                  <div key={img.id} className="relative flex-1" style={{ paddingBottom: "20%" }}>
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      className="object-cover rounded"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Price & title */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-2xl font-extrabold text-navy-900 mb-1">
            {formatPrice(p.price, p.currency)}
          </p>
          <h1 className="text-base font-semibold text-gray-700 leading-snug mb-3">{p.titleUk}</h1>

          {locationParts.length > 0 && (
            <div className="flex items-start gap-1.5 text-sm text-gray-500">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <span>{locationParts.join(", ")}</span>
            </div>
          )}
        </div>

        {/* Key params */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Параметри</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Maximize2 className="w-4 h-4 text-gray-400" />
              <span><strong>{p.areaSqm}</strong> м² загальна</span>
            </div>
            {p.rooms != null && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <BedDouble className="w-4 h-4 text-gray-400" />
                <span><strong>{p.rooms}</strong> кімнат</span>
              </div>
            )}
            {p.bedrooms != null && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <BedDouble className="w-4 h-4 text-gray-400" />
                <span><strong>{p.bedrooms}</strong> спалень</span>
              </div>
            )}
            {p.bathrooms != null && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Bath className="w-4 h-4 text-gray-400" />
                <span><strong>{p.bathrooms}</strong> санвузлів</span>
              </div>
            )}
            {p.floor != null && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Layers className="w-4 h-4 text-gray-400" />
                <span><strong>{p.floor}</strong>{p.totalFloors ? `/${p.totalFloors}` : ""} поверх</span>
              </div>
            )}
            {p.yearBuilt != null && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{p.yearBuilt} р. побудови</span>
              </div>
            )}
            {p.kitchenSqm != null && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-4 h-4 flex-shrink-0 text-gray-400 text-center font-bold text-xs">К</span>
                <span><strong>{p.kitchenSqm}</strong> м² кухня</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {p.descriptionUk && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Опис</h2>
            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: p.descriptionUk.replace(/\n/g, "<br>") }}
            />
          </div>
        )}

        {/* Agent card */}
        {agent && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Ваш агент</h2>
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2"
                style={{ borderColor: accentColor }}>
                {agent.photoUrl ? (
                  <Image src={agent.photoUrl} alt={agent.name ?? ""} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: accentColor }}>
                    {agent.name?.[0]?.toUpperCase() ?? "А"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy-900">{agent.name}</p>
                <p className="text-xs text-gray-400">Житлова компанія Progress</p>
              </div>
            </div>

            {agent.phone && (
              <div className="mt-4 flex flex-col gap-2">
                <a href={`tel:${agent.phone}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm text-white transition"
                  style={{ backgroundColor: accentColor }}>
                  <Phone className="w-4 h-4" />
                  Зателефонувати
                </a>
                <a href={`https://wa.me/${agent.phone.replace(/\D/g, "")}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  WhatsApp
                </a>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Житлова компанія Progress · Івано-Франківськ
        </p>
      </div>
    </div>
  );
}
