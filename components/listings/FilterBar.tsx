"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { PROPERTY_TYPES, DISTRICTS_IF } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";

interface FilterBarProps {
  locale: string;
  searchParams: Record<string, string | undefined>;
}

function DropFilter({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
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
          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap",
          value
            ? "bg-black text-white border-black"
            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
        )}
      >
        {label}
        <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 transition-transform", open && "rotate-180")} />
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

  // Local state for price/area ranges (applied on button click)
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

  const hasFilters = Object.keys(searchParams).some((k) => k !== "page" && searchParams[k]);

  const listingType = searchParams.listingType ?? "";
  const propertyType = searchParams.type ?? "";
  const district = searchParams.district ?? "";
  const rooms = searchParams.rooms ?? "";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-3">
      {/* Row 1: Продаж / Оренда tabs */}
      <div className="flex gap-2">
        {[
          { v: "SALE", uk: "Продаж", en: "Sale" },
          { v: "RENT", uk: "Оренда", en: "Rent" },
        ].map((opt) => (
          <button
            key={opt.v}
            onClick={() => set("listingType", listingType === opt.v ? null : opt.v)}
            className={cn(
              "px-6 py-2 rounded-xl font-semibold text-sm border transition-colors",
              listingType === opt.v
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
            )}
          >
            {isUk ? opt.uk : opt.en}
          </button>
        ))}
      </div>

      {/* Row 2: Property type pills */}
      <div className="flex flex-wrap gap-2">
        {PROPERTY_TYPES.map((pt) => (
          <button
            key={pt.value}
            onClick={() => set("type", propertyType === pt.value ? null : pt.value)}
            className={cn(
              "px-4 py-1.5 rounded-xl text-sm font-medium border transition-colors",
              propertyType === pt.value
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
            )}
          >
            {isUk ? pt.labelUk : pt.labelEn}
          </button>
        ))}
      </div>

      {/* Row 3: dropdown filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Район */}
        <DropFilter
          label={district ? (isUk ? DISTRICTS_IF.find((d) => d.value === district)?.labelUk : DISTRICTS_IF.find((d) => d.value === district)?.labelEn) ?? (isUk ? "Район" : "District") : (isUk ? "Район" : "District")}
          value={district}
        >
          {(close) => (
            <>
              <button
                onClick={() => { set("district", null); close(); }}
                className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", !district && "font-semibold")}
              >
                {isUk ? "Всі райони" : "All districts"}
              </button>
              {DISTRICTS_IF.map((d) => (
                <button
                  key={d.value}
                  onClick={() => { set("district", d.value); close(); }}
                  className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", district === d.value && "font-semibold text-gold-500")}
                >
                  {isUk ? d.labelUk : d.labelEn}
                </button>
              ))}
            </>
          )}
        </DropFilter>

        {/* К-ть кімнат */}
        <DropFilter
          label={rooms ? `${rooms}${rooms === "4" ? "+" : ""} ${isUk ? "кімн." : "rooms"}` : (isUk ? "К-ть кімнат" : "Rooms")}
          value={rooms}
        >
          {(close) => (
            <>
              <button onClick={() => { set("rooms", null); close(); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", !rooms && "font-semibold")}>
                {isUk ? "Будь-яка" : "Any"}
              </button>
              {["1", "2", "3", "4"].map((r) => (
                <button
                  key={r}
                  onClick={() => { set("rooms", r); close(); }}
                  className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", rooms === r && "font-semibold text-gold-500")}
                >
                  {r}{r === "4" ? "+" : ""} {isUk ? "кімнат" : "rooms"}
                </button>
              ))}
            </>
          )}
        </DropFilter>

        {/* Sort */}
        <DropFilter
          label={
            searchParams.sort === "price_asc" ? (isUk ? "Ціна ↑" : "Price ↑") :
            searchParams.sort === "price_desc" ? (isUk ? "Ціна ↓" : "Price ↓") :
            searchParams.sort === "areaSqm_desc" ? (isUk ? "Площа ↓" : "Area ↓") :
            (isUk ? "Сортування" : "Sort")
          }
          value={searchParams.sort}
        >
          {(close) => (
            <>
              {[
                { v: "", uk: "Нові спочатку", en: "Newest first" },
                { v: "price_asc", uk: "Ціна: зростання", en: "Price: low to high" },
                { v: "price_desc", uk: "Ціна: спадання", en: "Price: high to low" },
                { v: "areaSqm_desc", uk: "Площа: більша", en: "Area: largest first" },
              ].map((s) => (
                <button
                  key={s.v}
                  onClick={() => { set("sort", s.v || null); close(); }}
                  className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", (searchParams.sort ?? "") === s.v && "font-semibold text-gold-500")}
                >
                  {isUk ? s.uk : s.en}
                </button>
              ))}
            </>
          )}
        </DropFilter>

        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors ml-auto"
          >
            <X className="w-3.5 h-3.5" />
            {isUk ? "Скинути" : "Clear"}
          </button>
        )}
      </div>

      {/* Row 4: Price + Area ranges */}
      <div className="flex flex-wrap items-end gap-3 pt-1 border-t border-gray-100">
        {/* Ціна */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{isUk ? "Ціна" : "Price"}</span>
          <input
            type="number"
            placeholder="0"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-28 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <span className="text-gray-400 text-sm">₴ —</span>
          <input
            type="number"
            placeholder="∞"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-28 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <span className="text-gray-400 text-sm">₴</span>
        </div>

        {/* Площа */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{isUk ? "Площа" : "Area"}</span>
          <input
            type="number"
            placeholder="0"
            value={areaMin}
            onChange={(e) => setAreaMin(e.target.value)}
            className="w-20 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <span className="text-gray-400 text-sm">м² —</span>
          <input
            type="number"
            placeholder="∞"
            value={areaMax}
            onChange={(e) => setAreaMax(e.target.value)}
            className="w-20 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <span className="text-gray-400 text-sm">м²</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={clearAll}
            className="px-4 py-1.5 text-sm border border-gray-200 rounded-xl hover:border-gray-400 transition-colors text-gray-700"
          >
            {isUk ? "Скинути фільтр" : "Reset"}
          </button>
          <button
            onClick={applyRanges}
            className="px-5 py-1.5 text-sm bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold"
          >
            {isUk ? "Фільтрувати" : "Filter"}
          </button>
        </div>
      </div>
    </div>
  );
}
