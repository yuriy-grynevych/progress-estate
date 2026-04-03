"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { PROPERTY_TYPES, DISTRICTS_IF } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X } from "lucide-react";

interface FilterSidebarProps {
  locale: string;
  searchParams: Record<string, string | undefined>;
}

export default function FilterSidebar({ locale, searchParams }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isUk = locale === "uk";
  const [mobileOpen, setMobileOpen] = useState(false);

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v !== undefined) as [string, string][]
    );
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAll = () => { router.push(pathname); setMobileOpen(false); };
  const hasFilters = Object.keys(searchParams).some((k) => k !== "page" && searchParams[k]);

  const filtersContent = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-navy-900">{isUk ? "Фільтри" : "Filters"}</h2>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-gold-500 hover:text-gold-600 font-medium">
            {isUk ? "Скинути" : "Clear all"}
          </button>
        )}
      </div>

      {/* Listing type */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
          {isUk ? "Тип угоди" : "Type"}
        </label>
        <div className="flex gap-2">
          {[
            { v: "", l: isUk ? "Всі" : "All" },
            { v: "SALE", l: isUk ? "Продаж" : "Sale" },
            { v: "RENT", l: isUk ? "Оренда" : "Rent" },
          ].map((opt) => (
            <button key={opt.v} onClick={() => updateFilter("listingType", opt.v || null)}
              className={cn("flex-1 py-1.5 text-xs rounded-lg border transition-colors",
                (searchParams.listingType ?? "") === opt.v
                  ? "bg-black text-white border-navy-900"
                  : "border-gray-200 text-gray-700 hover:border-navy-300")}>
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {/* Property type */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
          {isUk ? "Тип нерухомості" : "Property Type"}
        </label>
        <div className="space-y-1">
          <button onClick={() => updateFilter("type", null)}
            className={cn("w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors",
              !searchParams.type ? "bg-navy-50 text-navy-900 font-medium" : "text-gray-700 hover:bg-gray-50")}>
            {isUk ? "Всі типи" : "All types"}
          </button>
          {PROPERTY_TYPES.map((pt) => (
            <button key={pt.value} onClick={() => updateFilter("type", pt.value)}
              className={cn("w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors",
                searchParams.type === pt.value
                  ? "bg-navy-50 text-navy-900 font-medium"
                  : "text-gray-700 hover:bg-gray-50")}>
              {isUk ? pt.labelUk : pt.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
          {isUk ? "Ціна" : "Price"}
        </label>
        <div className="flex gap-2">
          <input type="number" placeholder={isUk ? "від" : "from"}
            defaultValue={searchParams.priceMin ?? ""}
            onBlur={(e) => updateFilter("priceMin", e.target.value || null)}
            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-900" />
          <input type="number" placeholder={isUk ? "до" : "to"}
            defaultValue={searchParams.priceMax ?? ""}
            onBlur={(e) => updateFilter("priceMax", e.target.value || null)}
            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-900" />
        </div>
      </div>

      {/* Rooms */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
          {isUk ? "Кімнати" : "Rooms"}
        </label>
        <div className="flex gap-1">
          {["", "1", "2", "3", "4"].map((r) => (
            <button key={r} onClick={() => updateFilter("rooms", r || null)}
              className={cn("flex-1 py-1.5 text-xs rounded-lg border transition-colors",
                (searchParams.rooms ?? "") === r
                  ? "bg-black text-white border-navy-900"
                  : "border-gray-200 text-gray-700 hover:border-navy-300")}>
              {r || (isUk ? "Всі" : "All")}{r === "4" ? "+" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* District */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
          {isUk ? "Район" : "District"}
        </label>
        <select value={searchParams.district ?? ""}
          onChange={(e) => updateFilter("district", e.target.value || null)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-900 bg-white">
          <option value="">{isUk ? "Всі райони" : "All districts"}</option>
          {DISTRICTS_IF.map((d) => (
            <option key={d.value} value={d.value}>{isUk ? d.labelUk : d.labelEn}</option>
          ))}
        </select>
      </div>

      {/* Mobile close button */}
      <button onClick={() => setMobileOpen(false)}
        className="lg:hidden w-full bg-black text-white py-2.5 rounded-xl text-sm font-medium mt-2">
        {isUk ? "Застосувати" : "Apply"}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile filter button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-navy-900 bg-white shadow-sm hover:border-navy-300 transition mb-4"
      >
        <SlidersHorizontal className="w-4 h-4" />
        {isUk ? "Фільтри" : "Filters"}
        {hasFilters && (
          <span className="w-2 h-2 rounded-full bg-gold-400" />
        )}
      </button>

      {/* Mobile drawer overlay */}
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
            {filtersContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
          {filtersContent}
        </div>
      </aside>
    </>
  );
}
