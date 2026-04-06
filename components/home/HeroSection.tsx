"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  const locale = useLocale();
  const router = useRouter();
  const isUk = locale === "uk";

  return (
    <section className="relative min-h-screen flex flex-col bg-black">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("/hero-bg.jpg")` }}
      />
      <div className="absolute inset-0 bg-black/60" />

      {/* All content — vertically centered, left-aligned */}
      <div className="relative flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-16">
          <div className="max-w-3xl">
            <Image
              src="/logo-progress.png"
              alt="Житлова компанія Progress"
              width={600}
              height={185}
              className="w-56 sm:w-72 lg:w-80 h-auto rounded-xl mb-10"
            />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              {isUk ? "Знайдіть своє ідеальне житло" : "Find Your Perfect Home"}
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-xl">
              {isUk
                ? "Надійний партнер у виборі нерухомості в Івано-Франківську та регіоні"
                : "Your trusted real estate partner in Ivano-Frankivsk and the region"}
            </p>
            <button
              onClick={() => router.push(`/${locale}/listings`)}
              className="inline-flex items-center gap-3 bg-gold-400 hover:bg-gold-500 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-colors shadow-xl"
            >
              {isUk ? "Каталог нерухомості" : "Property Catalog"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 60L1440 60L1440 0C1440 0 1080 60 720 60C360 60 0 0 0 0L0 60Z"
            fill="black"
          />
        </svg>
      </div>
    </section>
  );
}
