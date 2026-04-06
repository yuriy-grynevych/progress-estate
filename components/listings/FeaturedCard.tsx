import Link from "next/link";
import Image from "next/image";
import { ImageOff, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { PropertyWithImages } from "@/types";

interface FeaturedCardProps {
  property: PropertyWithImages;
  locale: string;
}

function isNew(d: Date | string) {
  return Date.now() - new Date(d).getTime() < 4 * 24 * 60 * 60 * 1000;
}

export default function FeaturedCard({ property, locale }: FeaturedCardProps) {
  const isUk = locale === "uk";
  const title = isUk ? property.titleUk : property.titleEn;
  const images = property.images.sort((a, b) => a.order - b.order);
  const mainImage = images.find((i) => i.isPrimary) ?? images[0];
  const isRent = property.listingType === "RENT";
  const fresh = isNew(property.createdAt);

  const details = [
    { label: isUk ? "Площа" : "Area",    value: property.areaSqm ? `${property.areaSqm} м²` : null },
    { label: isUk ? "Кімнати" : "Rooms",  value: property.rooms ?? null },
    { label: isUk ? "Поверх" : "Floor",   value: property.floor && property.totalFloors ? `${property.floor}/${property.totalFloors}` : null },
    { label: isUk ? "Район" : "District", value: property.district ?? null },
  ].filter((d) => d.value !== null);

  return (
    <Link href={`/${locale}/listings/${property.slug}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gold-300 transition-all duration-300 overflow-hidden h-full flex flex-col">

        {/* Photo */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden flex-shrink-0">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ImageOff className="w-10 h-10" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {fresh && (
              <span className="flex items-center gap-1 text-xs font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-lg">
                <Sparkles className="w-3 h-3" /> {isUk ? "НОВИНКА" : "NEW"}
              </span>
            )}
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              isRent ? "bg-navy-700 text-white" : "bg-gold-400 text-white"
            }`}>
              {isRent ? (isUk ? "ОРЕНДА" : "RENT") : (isUk ? "ПРОДАЖ" : "SALE")}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <div className="text-xl font-bold text-navy-900 mb-1">
            {formatPrice(property.price, property.currency, locale)}
            {isRent && <span className="text-sm font-normal text-gray-400 ml-1">/міс</span>}
          </div>
          <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-3 group-hover:text-gold-600 transition-colors line-clamp-2 flex-1">
            {title}
          </h3>
          {details.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-gray-100">
              {details.map((d) => (
                <div key={d.label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{d.label}</p>
                  <p className="text-sm font-semibold text-navy-900 truncate">{String(d.value)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Link>
  );
}
