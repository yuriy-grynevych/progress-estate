"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPES } from "@/lib/constants";

export default function HeroSection() {
  const locale = useLocale();
  const router = useRouter();
  const [listingType, setListingType] = useState<"SALE" | "RENT">("SALE");
  const [propertyType, setPropertyType] = useState("");
  const [search, setSearch] = useState("");
  const isUk = locale === "uk";

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set("listingType", listingType);
    if (propertyType) params.set("type", propertyType);
    if (search) params.set("search", search);
    router.push(`/${locale}/listings?${params.toString()}`);
  };

  return (
    <section className="relative min-h-screen flex items-center bg-black overflow-hidden">
      {/* Background photo of Ivano-Frankivsk — CC0 Public Domain */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("/hero-bg.jpg")`,
        }}
      />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
        <div className="max-w-3xl">
          <div className="mb-6" id="hero-logo" style={{ mixBlendMode: "screen" }}>
            <Image
              src="/logo-hero.png"
              alt="Progress Estate"
              width={480}
              height={480}
              className="w-48 sm:w-56 lg:w-64 h-auto"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            {isUk ? "Знайдіть своє ідеальне житло" : "Find Your Perfect Home"}
          </h1>
          <p className="text-lg text-white/70 mb-10 max-w-xl">
            {isUk
              ? "Надійний партнер у виборі нерухомості в Івано-Франківську та регіоні"
              : "Your trusted real estate partner in Ivano-Frankivsk and the region"}
          </p>

          <div className="bg-white rounded-2xl shadow-2xl p-2">
            <div className="flex rounded-xl overflow-hidden bg-gray-100 p-1 mb-3">
              {(["SALE", "RENT"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setListingType(type)}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all",
                    listingType === type
                      ? "bg-black text-white shadow"
                      : "text-gray-600 hover:text-navy-900"
                  )}
                >
                  {type === "SALE"
                    ? isUk ? "Купити" : "Buy"
                    : isUk ? "Орендувати" : "Rent"}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={isUk ? "Пошук за адресою або районом" : "Search by address or district"}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-900 text-sm"
                />
              </div>
              <div className="relative sm:w-48">
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full appearance-none pl-4 pr-8 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-900 text-sm text-gray-700 bg-white"
                >
                  <option value="">{isUk ? "Всі типи" : "All Types"}</option>
                  {PROPERTY_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {isUk ? pt.labelUk : pt.labelEn}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={handleSearch}
                className="bg-gold-400 hover:bg-gold-500 text-navy-900 font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                {isUk ? "Шукати" : "Search"}
              </button>
            </div>
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
