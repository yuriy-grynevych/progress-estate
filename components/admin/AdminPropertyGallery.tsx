"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ImageOff, Sparkles } from "lucide-react";
import { isExternalImage } from "@/lib/cloudinary";

interface GalleryImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Props {
  images: GalleryImage[];
  title: string;
  isNew?: boolean;
  isRent?: boolean;
}

export default function AdminPropertyGallery({ images, title, isNew, isRent }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const mainImg = images.find((i) => i.isPrimary) ?? images[0];
  const otherImages = images.filter((i) => i !== mainImg);
  const thumbs = otherImages.slice(0, 4);
  const allImages = mainImg ? [mainImg, ...otherImages] : images;

  function openAt(img: GalleryImage) {
    setLightboxIndex(allImages.findIndex((i) => i.id === img.id));
  }

  function prev() {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + allImages.length) % allImages.length));
  }

  function next() {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % allImages.length));
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    setTouchStart(null);
  }

  return (
    <>
      {/* Gallery row */}
      <div className="flex flex-shrink-0">
        {/* Main image */}
        <div
          className="relative w-[240px] sm:w-[360px] aspect-[4/3] flex-shrink-0 bg-gray-100 overflow-hidden cursor-pointer"
          onClick={() => mainImg && openAt(mainImg)}
        >
          {mainImg ? (
            <Image
              src={mainImg.url}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 240px, 360px"
              quality={65}
              unoptimized={isExternalImage(mainImg.url)}
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ImageOff className="w-10 h-10" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isNew && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" /> НОВИНКА
              </span>
            )}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isRent ? "bg-navy-700 text-white" : "bg-gold-400 text-white"
              }`}
            >
              {isRent ? "ОРЕНДА" : "ПРОДАЖ"}
            </span>
          </div>
        </div>

        {/* Thumbnails 2×2 */}
        {thumbs.length > 0 && (
          <div className="hidden sm:grid grid-cols-2 w-[144px] gap-0.5 flex-shrink-0 bg-gray-100">
            {[0, 1, 2, 3].map((i) =>
              thumbs[i] ? (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden cursor-pointer"
                  onClick={() => openAt(thumbs[i])}
                >
                  <Image
                    src={thumbs[i].url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="72px"
                    quality={40}
                    unoptimized={isExternalImage(thumbs[i].url)}
                    loading="lazy"
                  />
                </div>
              ) : (
                <div key={i} className="aspect-square bg-gray-50" />
              )
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
          onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
          onTouchEnd={handleTouchEnd}
        >
          <button
            className="absolute top-4 right-4 text-white p-2.5 bg-white/10 hover:bg-white/20 rounded-full z-10"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
          >
            <X className="w-6 h-6" />
          </button>

          {allImages.length > 1 && (
            <>
              <button
                className="absolute left-3 sm:left-6 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full z-10"
                onClick={(e) => { e.stopPropagation(); prev(); }}
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                className="absolute right-3 sm:right-6 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full z-10"
                onClick={(e) => { e.stopPropagation(); next(); }}
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}

          <div
            className="relative w-full max-w-[90vw] mx-16 aspect-[4/3]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={allImages[lightboxIndex].url}
              alt=""
              fill
              className="object-contain"
              sizes="90vw"
              quality={85}
              unoptimized={isExternalImage(allImages[lightboxIndex].url)}
              priority
            />
          </div>

          <div className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-sm select-none">
            {lightboxIndex + 1} / {allImages.length}
          </div>
        </div>
      )}
    </>
  );
}
