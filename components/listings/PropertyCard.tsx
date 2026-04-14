import Link from "next/link";
import Image from "next/image";
import { ImageOff, Sparkles, Flame } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { PropertyWithImages } from "@/types";

function isNew(d: Date | string) {
  return Date.now() - new Date(d).getTime() < 4 * 24 * 60 * 60 * 1000;
}

interface PropertyCardProps {
  property: PropertyWithImages;
  locale: string;
}

export default function PropertyCard({ property, locale }: PropertyCardProps) {
  const isUk = locale === "uk";
  const title = isUk ? property.titleUk : property.titleEn;
  const images = property.images.sort((a, b) => a.order - b.order);
  const mainImage = images.find((i) => i.isPrimary) ?? images[0];
  const thumbs = images.filter((i) => i !== mainImage).slice(0, 4);
  const isRent = property.listingType === "RENT";
  const fresh = isNew(property.createdAt);

  const details = [
    { label: isUk ? "площа" : "area",   value: property.areaSqm ? `${property.areaSqm}м²` : "—" },
    { label: isUk ? "к-сть кімнат" : "rooms",  value: property.rooms ?? "—" },
    { label: isUk ? "поверх" : "floor",  value: property.floor && property.totalFloors ? `${property.floor}/${property.totalFloors}` : property.floor ?? "—" },
    { label: isUk ? "район" : "district", value: property.district ?? "—" },
    { label: isUk ? "вулиця" : "street",  value: property.address ?? "—" },
    { label: isUk ? "тип" : "type",       value: isUk
        ? (property.type === "APARTMENT" ? "Квартира"
          : property.type === "HOUSE" ? "Будинок"
          : property.type === "COMMERCIAL" ? "Комерція"
          : property.type === "LAND" ? "Земля"
          : property.type === "OFFICE" ? "Офіс"
          : property.type)
        : property.type },
  ];

  return (
    <Link href={`/${locale}/listings/${property.slug}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gold-300 transition-all duration-300 overflow-hidden">
        <div className="flex flex-col sm:flex-row">

          {/* Main photo */}
          <div className="relative sm:w-[42%] aspect-[4/3] sm:aspect-auto flex-shrink-0 bg-gray-100 overflow-hidden">
            {mainImage ? (
              <Image
                key={mainImage.url}
                src={mainImage.url}
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, 40vw"
                quality={45}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-300 gap-2">
                <ImageOff className="w-10 h-10" />
                <span className="text-xs">Фото відсутнє</span>
              </div>
            )}
            {/* Badges */}
            <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
              {fresh && (
                <span className="flex items-center gap-1 text-xs font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-lg">
                  <Sparkles className="w-3 h-3" /> {isUk ? "НОВИНКА" : "NEW"}
                </span>
              )}
              {property.isFeatured && (
                <span className="flex items-center gap-1 text-xs font-bold bg-red-500 text-white px-2.5 py-1 rounded-lg">
                  <Flame className="w-3 h-3" /> {isUk ? "ГАРЯЧА" : "HOT"}
                </span>
              )}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                isRent ? "bg-navy-700 text-white" : "bg-gold-400 text-white"
              }`}>
                {isRent ? (isUk ? "ОРЕНДА" : "RENT") : (isUk ? "ПРОДАЖ" : "SALE")}
              </span>
            </div>
          </div>

          {/* Thumbnails 2×2 */}
          <div className="hidden sm:grid grid-cols-2 sm:w-[22%] flex-shrink-0 gap-0.5 bg-gray-100">
            {[0, 1, 2, 3].map((i) => {
              const img = thumbs[i];
              return img ? (
                <div key={i} className="relative aspect-square overflow-hidden bg-gray-200">
                  <Image
                    key={img.url}
                    src={img.url}
                    alt={`${title} ${i + 2}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    sizes="10vw"
                    quality={25}
                    loading="lazy"
                  />
                </div>
              ) : (
                <div key={i} className="aspect-square bg-gray-100" />
              );
            })}
          </div>

          {/* Info */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              <div className="text-2xl font-bold text-navy-900 mb-2">
                {formatPrice(property.price, property.currency, locale)}
                {isRent && <span className="text-sm font-normal text-gray-400 ml-1">/міс</span>}
              </div>
              <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-4 group-hover:text-gold-600 transition-colors line-clamp-2">
                {title}
              </h3>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              {details.map((d) => (
                <div key={d.label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">{d.label}</p>
                  <p className="text-sm font-semibold text-navy-900 truncate">{String(d.value)}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}
