"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { PROPERTY_TYPES, DISTRICTS_IF } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

interface FilterBarProps {
  locale: string;
  searchParams: Record<string, string | undefined>;
}

function DropFilter({
  label,
  active,
  children,
}: {
  label: string;
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
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between gap-1 text-sm py-2 px-3 border rounded-xl transition-colors",
          active
            ? "border-black text-black font-semibold bg-gray-50"
            : "border-gray-200 text-gray-600 hover:border-gray-400 bg-white"
        )}
      >
        <span>{label}</span>
        <ChevronDown className={cn("w-4 h-4 flex-shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 w-full py-2 max-h-56 overflow-y-auto">
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const [priceMin, setPriceMin] = useState(searchParams.priceMin ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.priceMax ?? "");
  const [areaMin, setAreaMin] = useState(searchParams.areaMin ?? "");
  const [areaMax, setAreaMax] = useState(searchParams.areaMax ?? "");

  const buildParams = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v != null) as [string, string][]
    );
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v); else params.delete(k);
    }
    params.delete("page");
    return params.toString();
  };

  const set = (key: string, value: string | null) => {
    router.push(`${pathname}?${buildParams({ [key]: value })}`);
  };

  const applyRanges = () => {
    router.push(`${pathname}?${buildParams({
      priceMin: priceMin || null,
      priceMax: priceMax || null,
      areaMin: areaMin || null,
      areaMax: areaMax || null,
    })}`);
  };

  const clearAll = () => {
    setPriceMin(""); setPriceMax(""); setAreaMin(""); setAreaMax("");
    router.push(pathname);
    setMobileOpen(false);
  };

  const hasFilters = Object.keys(searchParams).some((k) => k !== "page" && searchParams[k]);
  const listingType = searchParams.listingType ?? "";
  const propertyType = searchParams.type ?? "";
  const district = searchParams.district ?? "";
  const rooms = searchParams.rooms ?? "";

  const districtLabel = district
    ? ((isUk
        ? DISTRICTS_IF.find((d) => d.value === district)?.labelUk
        : DISTRICTS_IF.find((d) => d.value === district)?.labelEn) ?? (isUk ? "Район" : "District"))
    : (isUk ? "Район" : "District");

  const roomsLabel = rooms
    ? `${rooms}${rooms === "4" ? "+" : ""} ${isUk ? "кімн." : "rm."}`
    : (isUk ? "К-ть кімнат" : "Rooms");

  const sortLabel =
    searchParams.sort === "price_asc" ? (isUk ? "Ціна ↑" : "Price ↑") :
    searchParams.sort === "price_desc" ? (isUk ? "Ціна ↓" : "Price ↓") :
    searchParams.sort === "areaSqm_desc" ? (isUk ? "Площа ↓" : "Area ↓") :
    (isUk ? "Сортування" : "Sort");

  const sidebar = (
    <div className="space-y-4">
      {/* Row 1: Продаж / Оренда */}
      <div className="flex gap-2">
        {[
          { v: "SALE", uk: "Продаж", en: "Sale" },
          { v: "RENT", uk: "Оренда", en: "Rent" },
        ].map((opt) => (
          <button
            key={opt.v}
            onClick={() => set("listingType", listingType === opt.v ? null : opt.v)}
            className={cn(
              "flex-1 py-2 rounded-xl font-semibold text-sm border-2 transition-colors",
              listingType === opt.v
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
            )}
          >
            {isUk ? opt.uk : opt.en}
          </button>
        ))}
      </div>

      {/* Row 2: Property type pills with underline */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          {isUk ? "Тип нерухомості" : "Property type"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_TYPES.map((pt) => (
            <button
              key={pt.value}
              onClick={() => set("type", propertyType === pt.value ? null : pt.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                propertyType === pt.value
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              )}
            >
              {isUk ? pt.labelUk : pt.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdowns */}
      <div className="space-y-2">
        <DropFilter label={districtLabel} active={!!district}>
          {(close) => (
            <>
              <button onClick={() => { set("district", null); close(); }}
                className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", !district && "font-semibold")}>
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

        <DropFilter label={roomsLabel} active={!!rooms}>
          {(close) => (
            <>
              <button onClick={() => { set("rooms", null); close(); }}
                className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", !rooms && "font-semibold")}>
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

        <DropFilter label={sortLabel} active={!!searchParams.sort}>
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

      {/* Ціна */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          {isUk ? "Ціна" : "Price"}
        </p>
        <div className="flex items-center gap-1.5">
          <input type="number" placeholder="0" value={priceMin} onChange={(e) => setPriceMin(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
          <span className="text-gray-400 text-sm flex-shrink-0">—</span>
          <input type="number" placeholder="∞" value={priceMax} onChange={(e) => setPriceMax(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
        </div>
        <p className="text-xs text-gray-400 mt-1">₴</p>
      </div>

      {/* Площа */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          {isUk ? "Загальна площа" : "Total area"}
        </p>
        <div className="flex items-center gap-1.5">
          <input type="number" placeholder="0" value={areaMin} onChange={(e) => setAreaMin(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
          <span className="text-gray-400 text-sm flex-shrink-0">—</span>
          <input type="number" placeholder="∞" value={areaMax} onChange={(e) => setAreaMax(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
        </div>
        <p className="text-xs text-gray-400 mt-1">м²</p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2 pt-1">
        <button onClick={applyRanges}
          className="w-full py-2.5 text-sm bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold">
          {isUk ? "Фільтрувати" : "Filter"}
        </button>
        {hasFilters && (
          <button onClick={clearAll}
            className="w-full py-2 text-sm border border-gray-200 rounded-xl hover:border-gray-400 transition-colors text-gray-600">
            {isUk ? "Скинути фільтр" : "Reset filters"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium bg-white shadow-sm hover:border-gray-400 transition mb-4"
      >
        <SlidersHorizontal className="w-4 h-4" />
        {isUk ? "Фільтри" : "Filters"}
        {hasFilters && <span className="w-2 h-2 rounded-full bg-gold-400" />}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative ml-auto w-full max-w-sm bg-white h-full overflow-y-auto p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-navy-900 text-lg">{isUk ? "Фільтри" : "Filters"}</h2>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
          {sidebar}
        </div>
      </aside>
    </>
  );
}
