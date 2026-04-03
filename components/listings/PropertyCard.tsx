import Link from "next/link";
import Image from "next/image";
import { BedDouble, Maximize2, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { PropertyWithImages } from "@/types";

interface PropertyCardProps {
  property: PropertyWithImages;
  locale: string;
}

export default function PropertyCard({ property, locale }: PropertyCardProps) {
  const isUk = locale === "uk";
  const title = isUk ? property.titleUk : property.titleEn;
  const primaryImage = property.images.find((i) => i.isPrimary) ?? property.images[0];
  const isRent = property.listingType === "RENT";

  return (
    <Link href={`/${locale}/listings/${property.slug}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-gold-400 transition-all duration-300">
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
              <Maximize2 className="w-12 h-12 opacity-30" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge
              className={
                isRent
                  ? "bg-navy-700 hover:bg-navy-700 text-white text-xs"
                  : "bg-gold-400 hover:bg-gold-400 text-navy-900 text-xs font-semibold"
              }
            >
              {isRent ? (isUk ? "ОРЕНДА" : "RENT") : (isUk ? "ПРОДАЖ" : "SALE")}
            </Badge>
            {property.isFeatured && (
              <Badge className="bg-navy-900 hover:bg-navy-900 text-white text-xs">
                {isUk ? "Виділене" : "Featured"}
              </Badge>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="text-xs text-gray-500 mb-1">
            {property.city}
            {property.district ? `, ${property.district}` : ""}
          </div>
          <h3 className="font-semibold text-navy-900 line-clamp-2 mb-3 group-hover:text-navy-700 transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5" />
              {property.areaSqm} м²
            </span>
            {property.rooms && (
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                {property.rooms} {isUk ? "кімн" : "rooms"}
              </span>
            )}
            {property.floor && property.totalFloors && (
              <span className="flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5" />
                {property.floor}/{property.totalFloors} {isUk ? "пов" : "fl."}
              </span>
            )}
          </div>
          <div>
            <div className="text-lg font-bold text-navy-900">
              {formatPrice(property.price, property.currency, locale)}
              {isRent && (
                <span className="text-sm font-normal text-gray-500"> /міс</span>
              )}
            </div>
            {!isRent && property.areaSqm > 0 && (
              <div className="text-xs text-gray-400">
                {formatPrice(
                  Number(property.price) / property.areaSqm,
                  property.currency,
                  locale
                )}{" "}
                / м²
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
