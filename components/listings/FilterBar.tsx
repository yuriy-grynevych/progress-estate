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
        <span className="truncate">{label}</span>
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

const CONDITIONS = [
  { value: "no_renovation",     uk: "Без ремонту",        en: "No renovation" },
  { value: "cosmetic",          uk: "Косметичний ремонт",  en: "Cosmetic renovation" },
  { value: "good",              uk: "Хороший стан",        en: "Good condition" },
  { value: "euro_renovation",   uk: "Євроремонт",          en: "Euro renovation" },
  { value: "author_renovation", uk: "Авторський ремонт",   en: "Designer renovation" },
  { value: "new_building",      uk: "Новобудова",          en: "New building" },
];

const GOV_PROGRAMS = [
  { value: "eoselia",        uk: "єОселя",            en: "eOselia" },
  { value: "evidnovlennia",  uk: "єВідновлення",      en: "eVidnovlennia" },
  { value: "veterans_fund",  uk: "Фонд ветеранів",    en: "Veterans Fund" },
  { value: "mortgage_7",     uk: "Іпотека 7%",        en: "Mortgage 7%" },
  { value: "mortgage_3",     uk: "Іпотека 3%",        en: "Mortgage 3%" },
  { value: "ukrgasbank",     uk: "УкрГазБанк",        en: "UkrGasBank" },
];

export default function FilterBar({ locale, searchParams }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isUk = locale === "uk";
  const [mobileOpen, setMobileOpen] = useState(false);

  const [priceMin, setPriceMin] = useState(searchParams.priceMin ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.priceMax ?? "");
  const [areaMin, setAreaMin] = useState(searchParams.areaMin ?? "");
  const [areaMax, setAreaMax] = useState(searchParams.areaMax ?? "");
  const [floorMin, setFloorMin] = useState(searchParams.floorMin ?? "");
  const [floorMax, setFloorMax] = useState(searchParams.floorMax ?? "");
  const [developer, setDeveloper] = useState(searchParams.developer ?? "");
  const [complex, setComplex] = useState(searchParams.complex ?? "");

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

  const applyAll = () => {
    router.push(`${pathname}?${buildParams({
      priceMin: priceMin || null,
      priceMax: priceMax || null,
      areaMin: areaMin || null,
      areaMax: areaMax || null,
      floorMin: floorMin || null,
      floorMax: floorMax || null,
      developer: developer || null,
      complex: complex || null,
    })}`);
  };

  const clearAll = () => {
    setPriceMin(""); setPriceMax(""); setAreaMin(""); setAreaMax("");
    setFloorMin(""); setFloorMax(""); setDeveloper(""); setComplex("");
    router.push(pathname);
    setMobileOpen(false);
  };

  const hasFilters = Object.keys(searchParams).some((k) => k !== "page" && searchParams[k]);
  const listingType  = searchParams.listingType ?? "";
  const propertyType = searchParams.type ?? "";
  const district     = searchParams.district ?? "";
  const rooms        = searchParams.rooms ?? "";
  const condition    = searchParams.condition ?? "";
  const govProgram   = searchParams.govProgram ?? "";

  const districtLabel = district
    ? ((isUk ? DISTRICTS_IF.find(d => d.value === district)?.labelUk : DISTRICTS_IF.find(d => d.value === district)?.labelEn) ?? (isUk ? "Район" : "District"))
    : (isUk ? "Район" : "District");

  const roomsLabel = rooms
    ? `${rooms}${rooms === "4" ? "+" : ""} ${isUk ? "кімн." : "rm."}`
    : (isUk ? "К-ть кімнат" : "Rooms");

  const conditionLabel = condition
    ? (CONDITIONS.find(c => c.value === condition)?.[isUk ? "uk" : "en"] ?? (isUk ? "Стан" : "Condition"))
    : (isUk ? "Усі Стани" : "Condition");

  const govLabel = govProgram
    ? (GOV_PROGRAMS.find(g => g.value === govProgram)?.[isUk ? "uk" : "en"] ?? (isUk ? "Держпрограми" : "Gov. Programs"))
    : (isUk ? "Держпрограми" : "Gov. Programs");

  const sortLabel =
    searchParams.sort === "price_asc"    ? (isUk ? "Ціна ↑"   : "Price ↑")   :
    searchParams.sort === "price_desc"   ? (isUk ? "Ціна ↓"   : "Price ↓")   :
    searchParams.sort === "areaSqm_desc" ? (isUk ? "Площа ↓"  : "Area ↓")    :
    (isUk ? "Сортування" : "Sort");

  const opt = (label: string) => (
    <span className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 block cursor-pointer">{label}</span>
  );

  const sidebar = (
    <div className="space-y-4">
      {/* Продаж / Оренда */}
      <div className="flex gap-2">
        {[{ v: "SALE", uk: "Продаж", en: "Sale" }, { v: "RENT", uk: "Оренда", en: "Rent" }].map((o) => (
          <button key={o.v} onClick={() => set("listingType", listingType === o.v ? null : o.v)}
            className={cn("flex-1 py-2 rounded-xl font-semibold text-sm border-2 transition-colors",
              listingType === o.v ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-300 hover:border-gray-500")}>
            {isUk ? o.uk : o.en}
          </button>
        ))}
      </div>

      {/* Тип нерухомості */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          {isUk ? "Тип нерухомості" : "Property type"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_TYPES.map((pt) => (
            <button key={pt.value} onClick={() => set("type", propertyType === pt.value ? null : pt.value)}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                propertyType === pt.value ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400")}>
              {isUk ? pt.labelUk : pt.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdowns */}
      <div className="space-y-2">

        {/* Район */}
        <DropFilter label={districtLabel} active={!!district}>
          {(close) => (<>
            <button onClick={() => { set("district", null); close(); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", !district && "font-semibold")}>
              {isUk ? "Всі райони" : "All districts"}
            </button>
            {DISTRICTS_IF.map((d) => (
              <button key={d.value} onClick={() => { set("district", d.value); close(); }}
                className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", district === d.value && "font-semibold text-gold-500")}>
                {isUk ? d.labelUk : d.labelEn}
              </button>
            ))}
          </>)}
        </DropFilter>

        {/* Вулиця */}
        <DropFilter label={searchParams.search ? `🔍 ${searchParams.search}` : (isUk ? "Вулиця" : "Street")} active={!!searchParams.search}>
          {(close) => (
            <div className="px-3 py-2">
              <input type="text" placeholder={isUk ? "Назва вулиці..." : "Street name..."} defaultValue={searchParams.search ?? ""}
                onKeyDown={(e) => { if (e.key === "Enter") { set("search", (e.target as HTMLInputElement).value || null); close(); } }}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" autoFocus />
              <p className="text-xs text-gray-400 mt-1">{isUk ? "Натисніть Enter для пошуку" : "Press Enter to search"}</p>
            </div>
          )}
        </DropFilter>

        {/* Усі Стани */}
        <DropFilter label={conditionLabel} active={!!condition}>
          {(close) => (<>
            <button onClick={() => { set("condition", null); close(); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", !condition && "font-semibold")}>
              {isUk ? "Усі стани" : "Any condition"}
            </button>
            {CONDITIONS.map((c) => (
              <button key={c.value} onClick={() => { set("condition", c.value); close(); }}
                className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", condition === c.value && "font-semibold text-gold-500")}>
                {isUk ? c.uk : c.en}
              </button>
            ))}
          </>)}
        </DropFilter>

        {/* К-ть кімнат */}
        <DropFilter label={roomsLabel} active={!!rooms}>
          {(close) => (<>
            <button onClick={() => { set("rooms", null); close(); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", !rooms && "font-semibold")}>
              {isUk ? "Будь-яка" : "Any"}
            </button>
            {["1","2","3","4"].map((r) => (
              <button key={r} onClick={() => { set("rooms", r); close(); }}
                className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", rooms === r && "font-semibold text-gold-500")}>
                {r}{r === "4" ? "+" : ""} {isUk ? "кімнат" : "rooms"}
              </button>
            ))}
          </>)}
        </DropFilter>

        {/* Поверх */}
        <DropFilter label={floorMin || floorMax ? `${isUk ? "Поверх" : "Floor"}: ${floorMin||"?"} — ${floorMax||"?"}` : (isUk ? "Поверх" : "Floor")} active={!!floorMin || !!floorMax}>
          {(close) => (
            <div className="px-3 py-3 space-y-2">
              <p className="text-xs text-gray-500 font-medium">{isUk ? "Поверх від — до" : "Floor from — to"}</p>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="1" value={floorMin} onChange={(e) => setFloorMin(e.target.value)} min="1"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
                <span className="text-gray-400 text-sm">—</span>
                <input type="number" placeholder="∞" value={floorMax} onChange={(e) => setFloorMax(e.target.value)} min="1"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[{l: isUk ? "1-й" : "1st", v: "1", v2: "1"}, {l: isUk ? "Не 1-й" : "Not 1st", v: "2", v2: ""}, {l: isUk ? "Не останній" : "Not top", v: "", v2: ""}].map(() => null)}
              </div>
              <button onClick={() => { applyAll(); close(); }} className="w-full py-1.5 bg-black text-white text-sm rounded-lg">
                {isUk ? "Застосувати" : "Apply"}
              </button>
            </div>
          )}
        </DropFilter>

        {/* Забудовник */}
        <DropFilter label={developer ? `🏗 ${developer}` : (isUk ? "Забудовник" : "Developer")} active={!!developer}>
          {(close) => (
            <div className="px-3 py-2">
              <input type="text" placeholder={isUk ? "Назва забудовника..." : "Developer name..."} value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { applyAll(); close(); } }}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" autoFocus />
              <p className="text-xs text-gray-400 mt-1">{isUk ? "Натисніть Enter" : "Press Enter"}</p>
            </div>
          )}
        </DropFilter>

        {/* ЖК */}
        <DropFilter label={complex ? `🏢 ${complex}` : (isUk ? "ЖК" : "Complex")} active={!!complex}>
          {(close) => (
            <div className="px-3 py-2">
              <input type="text" placeholder={isUk ? "Назва ЖК..." : "Complex name..."} value={complex}
                onChange={(e) => setComplex(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { applyAll(); close(); } }}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" autoFocus />
              <p className="text-xs text-gray-400 mt-1">{isUk ? "Натисніть Enter" : "Press Enter"}</p>
            </div>
          )}
        </DropFilter>

        {/* Державні програми */}
        <DropFilter label={govLabel} active={!!govProgram}>
          {(close) => (<>
            <button onClick={() => { set("govProgram", null); close(); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", !govProgram && "font-semibold")}>
              {isUk ? "Всі програми" : "All programs"}
            </button>
            {GOV_PROGRAMS.map((g) => (
              <button key={g.value} onClick={() => { set("govProgram", g.value); close(); }}
                className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50", govProgram === g.value && "font-semibold text-gold-500")}>
                {isUk ? g.uk : g.en}
              </button>
            ))}
          </>)}
        </DropFilter>

        {/* Сортування */}
        <DropFilter label={sortLabel} active={!!searchParams.sort}>
          {(close) => (<>
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
          </>)}
        </DropFilter>
      </div>

      {/* Ціна */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{isUk ? "Ціна" : "Price"}</p>
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
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{isUk ? "Загальна площа" : "Total area"}</p>
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
        <button onClick={applyAll} className="w-full py-2.5 text-sm bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold">
          {isUk ? "Фільтрувати" : "Filter"}
        </button>
        {hasFilters && (
          <button onClick={clearAll} className="w-full py-2 text-sm border border-gray-200 rounded-xl hover:border-gray-400 transition-colors text-gray-600">
            {isUk ? "Скинути фільтр" : "Reset filters"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium bg-white shadow-sm hover:border-gray-400 transition mb-4">
        <SlidersHorizontal className="w-4 h-4" />
        {isUk ? "Фільтри" : "Filters"}
        {hasFilters && <span className="w-2 h-2 rounded-full bg-gold-400" />}
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative ml-auto w-full max-w-sm bg-white h-full overflow-y-auto p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-navy-900 text-lg">{isUk ? "Фільтри" : "Filters"}</h2>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
          {sidebar}
        </div>
      </aside>
    </>
  );
}
