"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { PROPERTY_TYPES, DISTRICTS_IF } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  MapPin,
  Road,
  Tag,
  BedDouble,
  Layers,
  Building2,
  LayoutGrid,
  SlidersHorizontal,
} from "lucide-react";

interface FilterBarProps {
  locale: string;
  searchParams: Record<string, string | undefined>;
}

function DropFilter({
  label,
  icon: Icon,
  active,
  children,
}: {
  label: string;
  icon?: React.ElementType;
  active?: boolean;
  children: (close: () => void) => React.ReactNode;
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1 text-sm transition-colors whitespace-nowrap py-2 px-1",
          active ? "text-black font-semibold" : "text-gray-600 hover:text-black"
        )}
      >
        {Icon && <Icon className="w-4 h-4 flex-shrink-0 text-gray-400" />}
        <span>{label}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 min-w-[180px] py-2 max-h-64 overflow-y-auto">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export default function FilterBar({ locale, searchParams }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isUk = locale === "uk";

  const [priceMin, setPriceMin] = useState(searchParams.priceMin ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.priceMax ?? "");
  const [areaMin, setAreaMin] = useState(searchParams.areaMin ?? "");
  const [areaMax, setAreaMax] = useState(searchParams.areaMax ?? "");

  const buildParams = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v != null) as [string, string][]
    );
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("page");
    return params.toString();
  };

  const set = (key: string, value: string | null) => {
    router.push(`${pathname}?${buildParams({ [key]: value })}`);
  };

  const applyRanges = () => {
    router.push(
      `${pathname}?${buildParams({
        priceMin: priceMin || null,
        priceMax: priceMax || null,
        areaMin: areaMin || null,
        areaMax: areaMax || null,
      })}`
    );
  };

  const clearAll = () => {
    setPriceMin(""); setPriceMax(""); setAreaMin(""); setAreaMax("");
    router.push(pathname);
  };

  const listingType = searchParams.listingType ?? "";
  const propertyType = searchParams.type ?? "";
  const district = searchParams.district ?? "";
  const rooms = searchParams.rooms ?? "";

  const districtLabel = district
    ? (isUk
        ? DISTRICTS_IF.find((d) => d.value === district)?.labelUk
        : DISTRICTS_IF.find((d) => d.value === district)?.labelEn) ?? (isUk ? "Район" : "District")
    : (isUk ? "Район" : "District");

  const roomsLabel = rooms
    ? `${rooms}${rooms === "4" ? "+" : ""} ${isUk ? "кімн." : "rm."}`
    : (isUk ? "К-ть кімнат" : "Rooms");

  const sortLabel =
    searchParams.sort === "price_asc" ? (isUk ? "Ціна ↑" : "Price ↑") :
    searchParams.sort === "price_desc" ? (isUk ? "Ціна ↓" : "Price ↓") :
    searchParams.sort === "areaSqm_desc" ? (isUk ? "Площа ↓" : "Area ↓") :
    (isUk ? "Інше" : "Other");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
      {/* Row 1: Продаж / Оренда */}
      <div className="flex gap-3 px-5 pt-4 pb-3">
        {[
          { v: "SALE", uk: "Продаж", en: "Sale" },
          { v: "RENT", uk: "Оренда", en: "Rent" },
        ].map((opt) => (
          <button
            key={opt.v}
            onClick={() => set("listingType", listingType === opt.v ? null : opt.v)}
            className={cn(
              "px-7 py-2 rounded-xl font-semibold text-base border-2 transition-colors",
              listingType === opt.v
                ? "bg-black text-white border-black"
                : "bg-white text-gray-800 border-gray-300 hover:border-gray-500"
            )}
          >
            {isUk ? opt.uk : opt.en}
          </button>
        ))}
      </div>

      {/* Row 2: Property type pills + separator */}
      <div className="flex flex-wrap gap-0 px-5 border-b border-gray-100">
        {PROPERTY_TYPES.map((pt) => (
          <button
            key={pt.value}
            onClick={() => set("type", propertyType === pt.value ? null : pt.value)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors mr-1",
              propertyType === pt.value
                ? "border-black text-black font-semibold"
                : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
            )}
          >
            {isUk ? pt.labelUk : pt.labelEn}
          </button>
        ))}
      </div>

      {/* Row 3: dropdown filters */}
      <div className="flex flex-wrap gap-0 px-4 py-1 border-b border-gray-100 divide-x divide-gray-100">
        <div className="px-2">
          <DropFilter label={districtLabel} icon={MapPin} active={!!district}>
            {(close) => (
              <>
                <button onClick={() => { set("district", null); close(); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", !district && "font-semibold")}>
                  {isUk ? "Всі райони" : "All districts"}
                </button>
                {DISTRICTS_IF.map((d) => (
                  <button key={d.value} onClick={() => { set("district", d.value); close(); }}
                    className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", district === d.value && "font-semibold text-gold-500")}>
                    {isUk ? d.labelUk : d.labelEn}
                  </button>
                ))}
              </>
            )}
          </DropFilter>
        </div>

        <div className="px-2">
          <DropFilter label={isUk ? "Вулиця" : "Street"} icon={Road} active={!!searchParams.search}>
            {(close) => (
              <div className="px-4 py-2">
                <input
                  type="text"
                  placeholder={isUk ? "Назва вулиці..." : "Street name..."}
                  defaultValue={searchParams.search ?? ""}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { set("search", (e.target as HTMLInputElement).value || null); close(); }
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                  autoFocus
                />
              </div>
            )}
          </DropFilter>
        </div>

        <div className="px-2">
          <DropFilter label={roomsLabel} icon={BedDouble} active={!!rooms}>
            {(close) => (
              <>
                <button onClick={() => { set("rooms", null); close(); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", !rooms && "font-semibold")}>
                  {isUk ? "Будь-яка" : "Any"}
                </button>
                {["1", "2", "3", "4"].map((r) => (
                  <button key={r} onClick={() => { set("rooms", r); close(); }}
                    className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", rooms === r && "font-semibold text-gold-500")}>
                    {r}{r === "4" ? "+" : ""} {isUk ? "кімнат" : "rooms"}
                  </button>
                ))}
              </>
            )}
          </DropFilter>
        </div>

        <div className="px-2">
          <DropFilter label={sortLabel} icon={SlidersHorizontal} active={!!searchParams.sort}>
            {(close) => (
              <>
                {[
                  { v: "", uk: "Нові спочатку", en: "Newest first" },
                  { v: "price_asc", uk: "Ціна: зростання", en: "Price: low to high" },
                  { v: "price_desc", uk: "Ціна: спадання", en: "Price: high to low" },
                  { v: "areaSqm_desc", uk: "Площа: більша", en: "Area: largest first" },
                ].map((s) => (
                  <button key={s.v} onClick={() => { set("sort", s.v || null); close(); }}
                    className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", (searchParams.sort ?? "") === s.v && "font-semibold text-gold-500")}>
                    {isUk ? s.uk : s.en}
                  </button>
                ))}
              </>
            )}
          </DropFilter>
        </div>
      </div>

      {/* Row 4: Price + Area ranges */}
      <div className="flex flex-wrap items-end gap-6 px-5 py-3">
        {/* Ціна */}
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1.5">{isUk ? "Ціна" : "Price"}</p>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="0"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-24 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <span className="text-sm text-gray-400">₴ —</span>
            <input
              type="number"
              placeholder="∞"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-28 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <span className="text-sm text-gray-400">₴</span>
          </div>
        </div>

        {/* Площа */}
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1.5">{isUk ? "Загальна площа" : "Total area"}</p>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="0"
              value={areaMin}
              onChange={(e) => setAreaMin(e.target.value)}
              className="w-20 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <span className="text-sm text-gray-400">м² —</span>
            <input
              type="number"
              placeholder="∞"
              value={areaMax}
              onChange={(e) => setAreaMax(e.target.value)}
              className="w-20 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <span className="text-sm text-gray-400">м²</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 ml-auto items-end">
          <button
            onClick={clearAll}
            className="px-5 py-2 text-sm border border-gray-200 rounded-xl hover:border-gray-400 transition-colors text-gray-700 font-medium"
          >
            {isUk ? "Скинути фільтр" : "Reset"}
          </button>
          <button
            onClick={applyRanges}
            className="px-6 py-2 text-sm bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold"
          >
            {isUk ? "Фільтрувати" : "Filter"}
          </button>
        </div>
      </div>
    </div>
  );
}
