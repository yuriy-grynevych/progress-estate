"use client";
import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { cloudinaryUrl, isExternalImage } from "@/lib/cloudinary";
import type { PropertyImage } from "@prisma/client";

function isVideo(url: string) {
  return /\.(mp4|webm|mov)$/i.test(url);
}

export default function PropertyGallery({
  images,
  title,
}: {
  images: PropertyImage[];
  title: string;
}) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (images.length === 0) {
    return (
      <div className="aspect-[16/9] bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
        <Expand className="w-16 h-16 opacity-30" />
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <>
      <div className="space-y-2">
        <div
          className="relative aspect-[16/9] rounded-xl overflow-hidden cursor-pointer group bg-gray-100"
          onClick={() => setLightbox(true)}
        >
          {isVideo(images[current].url) ? (
            <video
              key={current}
              src={images[current].url}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <Image
              key={current}
              src={cloudinaryUrl(images[current].url, { width: 900, quality: 70 })}
              alt={`${title} - ${current + 1}`}
              fill
              className="object-cover animate-kenburns"
              priority
              quality={55}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 900px"
              unoptimized={isExternalImage(images[current].url)}
              placeholder="blur"
              blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
            />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <Expand className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {current + 1} / {images.length}
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setCurrent(i)}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === current ? "border-gold-400" : "border-transparent"
                }`}
              >
                <Image
                  src={cloudinaryUrl(img.url, { width: 128, quality: 40 })}
                  alt={`${title} - ${i + 1}`}
                  width={64}
                  height={48}
                  className="object-cover w-full h-full"
                  unoptimized={isExternalImage(img.url)}
                  quality={20}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/30 rounded-full p-2 z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 text-white bg-white/20 hover:bg-white/30 rounded-full p-3"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <div
            className="relative w-full max-w-4xl max-h-[80vh] mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideo(images[current].url) ? (
              <video
                src={images[current].url}
                className="max-h-[80vh] mx-auto"
                controls
                autoPlay
                muted
                playsInline
              />
            ) : (
              <Image
                src={cloudinaryUrl(images[current].url, { width: 1600, quality: 90 })}
                alt={title}
                width={1200}
                height={800}
                className="object-contain max-h-[80vh] mx-auto"
                unoptimized={isExternalImage(images[current].url)}
                quality={90}
                priority
              />
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 text-white bg-white/20 hover:bg-white/30 rounded-full p-3"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </>
  );
}
