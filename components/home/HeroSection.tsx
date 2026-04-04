"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPES, DISTRICTS_IF } from "@/lib/constants";

function Dropdown({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 pt-3 pb-2.5 flex flex-col gap-0.5 hover:bg-gray-50 transition-colors rounded-xl"
      >
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-none">{label}</span>
        <span className={cn("text-sm font-semibold flex items-center justify-between gap-1", selected ? "text-gray-900" : "text-gray-400")}>
          {selected ? selected.label : placeholder}
          <ChevronDown className={cn("w-4 h-4 flex-shrink-0 transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 min-w-[180px] py-2 max-h-64 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className={cn("w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors", !value && "font-semibold text-gold-500")}
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn("w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors", value === opt.value && "font-semibold text-gold-500 bg-gold-50")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HeroSection() {
  const locale = useLocale();
  const router = useRouter();
  const [listingType, setListingType] = useState<"SALE" | "RENT">("SALE");
  const [propertyType, setPropertyType] = useState("");
  const [district, setDistrict] = useState("");
  const [search, setSearch] = useState("");
  const isUk = locale === "uk";

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set("listingType", listingType);
    if (propertyType) params.set("type", propertyType);
    if (district) params.set("district", district);
    if (search) params.set("search", search);
    router.push(`/${locale}/listings?${params.toString()}`);
  };

  const listingOptions = [
    { value: "SALE", label: isUk ? "Купити" : "Buy" },
    { value: "RENT", label: isUk ? "Орендувати" : "Rent" },
  ];

  const typeOptions = PROPERTY_TYPES.map((t) => ({
    value: t.value,
    label: isUk ? t.labelUk : t.labelEn,
  }));

  const districtOptions = DISTRICTS_IF.map((d) => ({
    value: d.value,
    label: isUk ? d.labelUk : d.labelEn,
  }));

  return (
    <section className="relative min-h-screen flex items-center bg-black overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("/hero-bg.jpg")` }}
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
        <div className="max-w-4xl">
          <div id="hero-logo" className="mb-6">
            <Image
              src="/logo-progress.png"
              alt="Житлова компанія Progress"
              width={600}
              height={185}
              className="w-64 sm:w-80 lg:w-96 h-auto rounded-xl"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            {isUk ? "Знайдіть своє ідеальне житло" : "Find Your Perfect Home"}
          </h1>
          <p className="text-lg text-white/70 mb-8 max-w-xl">
            {isUk
              ? "Надійний партнер у виборі нерухомості в Івано-Франківську та регіоні"
              : "Your trusted real estate partner in Ivano-Frankivsk and the region"}
          </p>

          {/* Search bar */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Top row: search bar with columns */}
            <div className="flex items-stretch divide-x divide-gray-100">
              {/* Дія */}
              <Dropdown
                label={isUk ? "Дія" : "Action"}
                value={listingType}
                options={listingOptions}
                onChange={(v) => setListingType(v as "SALE" | "RENT")}
                placeholder={isUk ? "Оберіть" : "Choose"}
              />

              {/* Тип */}
              <Dropdown
                label={isUk ? "Тип нерухомості" : "Property type"}
                value={propertyType}
                options={typeOptions}
                onChange={setPropertyType}
                placeholder={isUk ? "Будь-який" : "Any"}
              />

              {/* Район */}
              <Dropdown
                label={isUk ? "Район" : "District"}
                value={district}
                options={districtOptions}
                onChange={setDistrict}
                placeholder={isUk ? "Будь-який" : "Any"}
              />

              {/* Локація */}
              <div className="flex-1 min-w-0 px-4 pt-3 pb-2.5 flex flex-col gap-0.5">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-none">
                  {isUk ? "Адреса / вулиця" : "Address / street"}
                </span>
                <input
                  type="text"
                  placeholder={isUk ? "напр. вул. Незалежності" : "e.g. Nezalezhnosti st."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal bg-transparent focus:outline-none w-full"
                />
              </div>

              {/* Button */}
              <button
                onClick={handleSearch}
                className="bg-gold-400 hover:bg-gold-500 text-white font-bold px-8 flex items-center gap-2 transition-colors flex-shrink-0"
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">{isUk ? "Шукати" : "Search"}</span>
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
