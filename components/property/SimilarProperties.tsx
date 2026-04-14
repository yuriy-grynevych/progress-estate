import Link from "next/link";
import Image from "next/image";
import { isExternalImage } from "@/lib/cloudinary";
import { formatPrice } from "@/lib/utils";

type SimilarProperty = {
  slug: string;
  titleUk: string;
  titleEn: string;
  price: any;
  currency: string;
  areaSqm: number | null;
  rooms: number | null;
  district: string | null;
  listingType: string;
  images: { url: string }[];
};

export default function SimilarProperties({
  properties,
  locale,
}: {
  properties: SimilarProperty[];
  locale: string;
}) {
  if (properties.length === 0) return null;
  const isUk = locale === "uk";

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-navy-900 mb-4">
        {isUk ? "Схожі пропозиції" : "Similar listings"}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {properties.map((p) => {
          const title = isUk ? p.titleUk : p.titleEn;
          const img = p.images[0]?.url ?? null;
          return (
            <Link
              key={p.slug}
              href={`/${locale}/listings/${p.slug}`}
              className="flex-shrink-0 w-48 group"
            >
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-2">
                {img ? (
                  <Image
                    src={img}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="192px"
                    quality={60}
                    unoptimized={isExternalImage(img)}
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
              <p className="text-sm font-semibold text-navy-900 line-clamp-2 group-hover:text-gold-600 transition-colors leading-snug">
                {title}
              </p>
              <p className="text-sm font-bold text-gold-500 mt-1">
                {formatPrice(Number(p.price), p.currency)}
              </p>
              {(p.areaSqm || p.rooms || p.district) && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {[
                    p.areaSqm && `${p.areaSqm} м²`,
                    p.rooms && `${p.rooms} кімн.`,
                    p.district,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
