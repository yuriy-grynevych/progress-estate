"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { DISTRICTS_IF, RESIDENTIAL_COMPLEXES_IF } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ChevronDown, SlidersHorizontal, X, ChevronUp } from "lucide-react";

interface FilterBarProps {
  locale: string;
  searchParams: Record<string, string | undefined>;
}

// ── Маленький дроп-компонент ────────────────────────────────────────────────
function Drop({
  label,
  active,
  children,
  wide,
}: {
  label: string;
  active?: boolean;
  children: (close: () => void) => React.ReactNode;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center justify-between gap-1.5 text-sm py-2 px-3 rounded-xl border transition-all duration-150 w-full",
          active
            ? "border-navy-900 bg-navy-50 text-navy-900 font-semibold"
            : "border-gray-200 text-gray-600 hover:border-gray-400 bg-white"
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform duration-150", open && "rotate-180")} />
      </button>
      {open && (
        <div className={cn(
          "absolute top-full left-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 py-1.5 max-h-60 overflow-y-auto",
          wide ? "w-64" : "w-full min-w-[180px]"
        )}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function DropItem({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={cn("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", active && "font-semibold text-navy-900 bg-gray-50/80")}>
      {children}
    </button>
  );
}

// ── Дані ───────────────────────────────────────────────────────────────────
const PRIMARY_TYPES = [
  { value: "APARTMENT",  uk: "Квартира",  en: "Apartment" },
  { value: "ROOM",       uk: "Кімната",   en: "Room" },
  { value: "HOUSE",      uk: "Будинок",   en: "House" },
  { value: "COMMERCIAL", uk: "Комерція",  en: "Commercial" },
  { value: "OFFICE",     uk: "Офіс",      en: "Office" },
  { value: "LAND",       uk: "Земля",     en: "Land" },
];

const CONDITIONS = [
  { value: "no_renovation",     uk: "Без ремонту",        en: "No renovation" },
  { value: "cosmetic",          uk: "Косметичний ремонт",  en: "Cosmetic" },
  { value: "good",              uk: "Хороший стан",        en: "Good condition" },
  { value: "euro_renovation",   uk: "Євроремонт",          en: "Euro renovation" },
  { value: "author_renovation", uk: "Авторський ремонт",   en: "Designer" },
  { value: "new_building",      uk: "Новобудова",          en: "New building" },
];

const GOV_PROGRAMS = [
  { value: "eoselia",       uk: "єОселя",        en: "eOselia" },
  { value: "evidnovlennia", uk: "єВідновлення",   en: "eVidnovlennia" },
  { value: "veterans_fund", uk: "Фонд ветеранів", en: "Veterans Fund" },
  { value: "mortgage_7",    uk: "Іпотека 7%",     en: "Mortgage 7%" },
  { value: "mortgage_3",    uk: "Іпотека 3%",     en: "Mortgage 3%" },
  { value: "ukrgasbank",    uk: "УкрГазБанк",     en: "UkrGasBank" },
];

const RENOVATION_TYPES = [
  { value: "Сирець",            uk: "Сирець",            en: "Shell" },
  { value: "Житловий стан",     uk: "Житловий стан",     en: "Liveable" },
  { value: "Євроремонт",        uk: "Євроремонт",         en: "Euro" },
  { value: "Авторський дизайн", uk: "Авторський дизайн", en: "Designer" },
];

const WALL_TYPES = [
  { value: "Цегла",   uk: "Цегла",   en: "Brick" },
  { value: "Моноліт", uk: "Моноліт", en: "Monolith" },
  { value: "Панель",  uk: "Панель",  en: "Panel" },
];

const GAS_TYPES = [
  { value: "Індивідуальне газове", uk: "Індивідуальне газове", en: "Individual gas" },
  { value: "Дахова котельня",      uk: "Дахова котельня",      en: "Roof boiler" },
  { value: "Центральне",           uk: "Центральне",           en: "Central" },
  { value: "Електрика",            uk: "Електрика",            en: "Electric" },
];

// ── Головний компонент ─────────────────────────────────────────────────────
export default function FilterBar({ locale, searchParams }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isUk = locale === "uk";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);

  // Local state for range inputs
  const [priceMin, setPriceMin] = useState(searchParams.priceMin ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.priceMax ?? "");
  const [areaMin, setAreaMin] = useState(searchParams.areaMin ?? "");
  const [areaMax, setAreaMax] = useState(searchParams.areaMax ?? "");
  const [floorMin, setFloorMin] = useState(searchParams.floorMin ?? "");
  const [floorMax, setFloorMax] = useState(searchParams.floorMax ?? "");
  const [developer, setDeveloper] = useState(searchParams.developer ?? "");

  const sp = searchParams;
  const listingType   = sp.listingType ?? "";
  const propertyType  = sp.type ?? "";
  const district      = sp.district ?? "";
  const rooms         = sp.rooms ?? "";
  const condition     = sp.condition ?? "";
  const govProgram    = sp.govProgram ?? "";
  const renovationType = sp.renovationType ?? "";
  const wallType      = sp.wallType ?? "";
  const gasType       = sp.gasType ?? "";
  const complex       = sp.complex ?? "";

  // Кількість активних «додаткових» фільтрів
  const extraActiveCount = [
    sp.areaMin, sp.areaMax, sp.floorMin, sp.floorMax, sp.developer,
    sp.complex, sp.condition, sp.govProgram, sp.renovationType, sp.wallType,
    sp.gasType, sp.search,
  ].filter(Boolean).length;

  const buildParams = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams(
      Object.entries(sp).filter(([, v]) => v != null) as [string, string][]
    );
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v); else params.delete(k);
    }
    params.delete("page");
    return params.toString();
  };

  const set = (key: string, value: string | null) =>
    router.push(`${pathname}?${buildParams({ [key]: value })}`);

  const applyRanges = () => {
    router.push(`${pathname}?${buildParams({
      priceMin: priceMin || null,
      priceMax: priceMax || null,
      areaMin: areaMin || null,
      areaMax: areaMax || null,
      floorMin: floorMin || null,
      floorMax: floorMax || null,
      developer: developer || null,
    })}`);
  };

  const clearAll = () => {
    setPriceMin(""); setPriceMax(""); setAreaMin(""); setAreaMax("");
    setFloorMin(""); setFloorMax(""); setDeveloper("");
    router.push(pathname);
    setMobileOpen(false);
    setExtraOpen(false);
  };

  const hasFilters = Object.keys(sp).some((k) => k !== "page" && sp[k]);

  // ── Label helpers ──────────────────────────────────────────────────────
  const districtLabel   = district ? (DISTRICTS_IF.find(d => d.value === district)?.[isUk ? "labelUk" : "labelEn"] ?? district) : (isUk ? "Район" : "District");
  const conditionLabel  = condition ? (CONDITIONS.find(c => c.value === condition)?.[isUk ? "uk" : "en"] ?? condition) : (isUk ? "Стан" : "Condition");
  const govLabel        = govProgram ? (GOV_PROGRAMS.find(g => g.value === govProgram)?.[isUk ? "uk" : "en"] ?? govProgram) : (isUk ? "Держпрограми" : "Gov. Programs");
  const renovLabel      = renovationType ? (RENOVATION_TYPES.find(r => r.value === renovationType)?.[isUk ? "uk" : "en"] ?? renovationType) : (isUk ? "Ремонт" : "Renovation");
  const wallLabel       = wallType ? (WALL_TYPES.find(w => w.value === wallType)?.[isUk ? "uk" : "en"] ?? wallType) : (isUk ? "Тип стін" : "Walls");
  const gasLabel        = gasType ? (GAS_TYPES.find(g => g.value === gasType)?.[isUk ? "uk" : "en"] ?? gasType) : (isUk ? "Опалення" : "Heating");
  const complexLabel    = complex ? `ЖК: ${complex}` : (isUk ? "ЖК" : "Complex");
  const developerLabel  = developer ? `🏗 ${developer}` : (isUk ? "Забудовник" : "Developer");
  const sortLabel =
    sp.sort === "price_asc"    ? (isUk ? "Ціна ↑"  : "Price ↑")  :
    sp.sort === "price_desc"   ? (isUk ? "Ціна ↓"  : "Price ↓")  :
    sp.sort === "areaSqm_desc" ? (isUk ? "Площа ↓" : "Area ↓")   :
    (isUk ? "Сортування" : "Sort");

  // ── Зміст сайдбара ────────────────────────────────────────────────────
  const sidebar = (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-navy-900 text-base">{isUk ? "Фільтри" : "Filters"}</h2>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-400 transition-colors font-medium flex items-center gap-1">
            <X className="w-3 h-3" />
            {isUk ? "Скинути" : "Clear"}
          </button>
        )}
      </div>

      {/* ── ПРОДАЖ / ОРЕНДА / ПОДОБОВО ── */}
      <div className="flex gap-1.5 p-1 bg-gray-100 rounded-2xl">
        {[
          { v: "",           uk: "Всі",      en: "All" },
          { v: "SALE",       uk: "Продаж",   en: "Sale" },
          { v: "RENT",       uk: "Оренда",   en: "Rent" },
          { v: "DAILY_RENT", uk: "Подобово", en: "Daily" },
        ].map((o) => (
          <button key={o.v} onClick={() => set("listingType", o.v || null)}
            className={cn(
              "flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150",
              listingType === o.v
                ? "bg-white text-navy-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}>
            {isUk ? o.uk : o.en}
          </button>
        ))}
      </div>

      {/* ── ТИП НЕРУХОМОСТІ ── */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
          {isUk ? "Тип нерухомості" : "Property type"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRIMARY_TYPES.map((pt) => (
            <button key={pt.value}
              onClick={() => set("type", propertyType === pt.value ? null : pt.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-xl border transition-all duration-150",
                propertyType === pt.value
                  ? "bg-navy-900 text-white border-navy-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-navy-300 hover:text-navy-900"
              )}>
              {isUk ? pt.uk : pt.en}
            </button>
          ))}
        </div>
      </div>

      {/* ── РАЙОН ── */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
          {isUk ? "Район" : "District"}
        </p>
        <Drop label={districtLabel} active={!!district}>
          {(close) => (<>
            <DropItem active={!district} onClick={() => { set("district", null); close(); }}>
              {isUk ? "Всі райони" : "All districts"}
            </DropItem>
            {DISTRICTS_IF.map((d) => (
              <DropItem key={d.value} active={district === d.value} onClick={() => { set("district", d.value); close(); }}>
                {isUk ? d.labelUk : d.labelEn}
              </DropItem>
            ))}
          </>)}
        </Drop>
      </div>

      {/* ── ЦІНА ── */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
          {isUk ? "Ціна, $" : "Price, $"}
        </p>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="від" value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            onBlur={applyRanges}
            onKeyDown={(e) => e.key === "Enter" && applyRanges()}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 bg-white" />
          <span className="text-gray-300 font-light">—</span>
          <input type="number" placeholder="до" value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            onBlur={applyRanges}
            onKeyDown={(e) => e.key === "Enter" && applyRanges()}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 bg-white" />
        </div>
      </div>

      {/* ── КІМНАТИ ── */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
          {isUk ? "К-ть кімнат" : "Rooms"}
        </p>
        <div className="flex gap-1.5">
          {["", "1", "2", "3", "4"].map((r) => (
            <button key={r} onClick={() => set("rooms", r || null)}
              className={cn(
                "flex-1 py-2 text-xs font-semibold rounded-xl border transition-all duration-150",
                rooms === r
                  ? "bg-navy-900 text-white border-navy-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-navy-300"
              )}>
              {r ? `${r}${r === "4" ? "+" : ""}` : (isUk ? "Всі" : "All")}
            </button>
          ))}
        </div>
      </div>

      {/* ── БІЛЬШЕ ФІЛЬТРІВ ── */}
      <button
        onClick={() => setExtraOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150",
          extraOpen || extraActiveCount > 0
            ? "border-navy-900 bg-navy-50 text-navy-900"
            : "border-gray-200 text-gray-500 hover:border-gray-400 bg-white"
        )}>
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {isUk ? "Більше фільтрів" : "More filters"}
          {extraActiveCount > 0 && (
            <span className="bg-navy-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {extraActiveCount}
            </span>
          )}
        </span>
        {extraOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* ── ДОДАТКОВІ ФІЛЬТРИ (collapsed) ── */}
      {extraOpen && (
        <div className="space-y-2.5 pt-1 border-t border-gray-100">

          {/* Площа */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              {isUk ? "Площа, м²" : "Area, m²"}
            </p>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="від" value={areaMin}
                onChange={(e) => setAreaMin(e.target.value)}
                onBlur={applyRanges}
                onKeyDown={(e) => e.key === "Enter" && applyRanges()}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 bg-white" />
              <span className="text-gray-300">—</span>
              <input type="number" placeholder="до" value={areaMax}
                onChange={(e) => setAreaMax(e.target.value)}
                onBlur={applyRanges}
                onKeyDown={(e) => e.key === "Enter" && applyRanges()}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 bg-white" />
            </div>
          </div>

          {/* Поверх */}
          <Drop
            label={floorMin || floorMax ? `${isUk ? "Поверх" : "Floor"}: ${floorMin || "?"} — ${floorMax || "?"}` : (isUk ? "Поверх" : "Floor")}
            active={!!floorMin || !!floorMax}>
            {(close) => (
              <div className="px-3 py-3 space-y-2">
                <p className="text-xs text-gray-500">{isUk ? "Поверх від — до" : "Floor from — to"}</p>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="1" value={floorMin} onChange={(e) => setFloorMin(e.target.value)} min="1"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
                  <span className="text-gray-400">—</span>
                  <input type="number" placeholder="∞" value={floorMax} onChange={(e) => setFloorMax(e.target.value)} min="1"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
                </div>
                <button onClick={() => { applyRanges(); close(); }} className="w-full py-1.5 bg-black text-white text-sm rounded-lg">
                  {isUk ? "Застосувати" : "Apply"}
                </button>
              </div>
            )}
          </Drop>

          {/* Пошук / Вулиця */}
          <Drop label={sp.search ? `🔍 ${sp.search}` : (isUk ? "Вулиця / пошук" : "Street / search")} active={!!sp.search}>
            {(close) => (
              <div className="px-3 py-2.5">
                <input type="text" placeholder={isUk ? "Назва вулиці або ЖК..." : "Street or complex name..."} defaultValue={sp.search ?? ""}
                  onKeyDown={(e) => { if (e.key === "Enter") { set("search", (e.target as HTMLInputElement).value || null); close(); } }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" autoFocus />
                <p className="text-xs text-gray-400 mt-1">{isUk ? "Enter для пошуку" : "Press Enter"}</p>
              </div>
            )}
          </Drop>

          {/* Стан */}
          <Drop label={conditionLabel} active={!!condition}>
            {(close) => (<>
              <DropItem active={!condition} onClick={() => { set("condition", null); close(); }}>
                {isUk ? "Будь-який" : "Any"}
              </DropItem>
              {CONDITIONS.map((c) => (
                <DropItem key={c.value} active={condition === c.value} onClick={() => { set("condition", c.value); close(); }}>
                  {isUk ? c.uk : c.en}
                </DropItem>
              ))}
            </>)}
          </Drop>

          {/* ЖК */}
          <Drop label={complexLabel} active={!!complex} wide>
            {(close) => (
              <div className="px-3 py-2.5">
                <input type="text" placeholder={isUk ? "Назва ЖК..." : "Complex name..."} defaultValue={complex}
                  list="filter-complexes"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      set("complex", (e.target as HTMLInputElement).value || null);
                      close();
                    }
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" autoFocus />
                <datalist id="filter-complexes">
                  {RESIDENTIAL_COMPLEXES_IF.map((n) => <option key={n} value={n} />)}
                </datalist>
                <p className="text-xs text-gray-400 mt-1">{isUk ? "Enter для вибору" : "Press Enter"}</p>
              </div>
            )}
          </Drop>

          {/* Забудовник */}
          <Drop label={developerLabel} active={!!developer}>
            {(close) => (
              <div className="px-3 py-2.5">
                <input type="text" placeholder={isUk ? "Назва забудовника..." : "Developer name..."} value={developer}
                  onChange={(e) => setDeveloper(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { applyRanges(); close(); } }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" autoFocus />
                <p className="text-xs text-gray-400 mt-1">{isUk ? "Enter для пошуку" : "Press Enter"}</p>
              </div>
            )}
          </Drop>

          {/* Держпрограми */}
          <Drop label={govLabel} active={!!govProgram}>
            {(close) => (<>
              <DropItem active={!govProgram} onClick={() => { set("govProgram", null); close(); }}>
                {isUk ? "Всі програми" : "All programs"}
              </DropItem>
              {GOV_PROGRAMS.map((g) => (
                <DropItem key={g.value} active={govProgram === g.value} onClick={() => { set("govProgram", g.value); close(); }}>
                  {isUk ? g.uk : g.en}
                </DropItem>
              ))}
            </>)}
          </Drop>

          {/* Ремонт */}
          <Drop label={renovLabel} active={!!renovationType}>
            {(close) => (<>
              <DropItem active={!renovationType} onClick={() => { set("renovationType", null); close(); }}>
                {isUk ? "Будь-який" : "Any"}
              </DropItem>
              {RENOVATION_TYPES.map((r) => (
                <DropItem key={r.value} active={renovationType === r.value} onClick={() => { set("renovationType", r.value); close(); }}>
                  {isUk ? r.uk : r.en}
                </DropItem>
              ))}
            </>)}
          </Drop>

          {/* Тип стін */}
          <Drop label={wallLabel} active={!!wallType}>
            {(close) => (<>
              <DropItem active={!wallType} onClick={() => { set("wallType", null); close(); }}>
                {isUk ? "Будь-який" : "Any"}
              </DropItem>
              {WALL_TYPES.map((w) => (
                <DropItem key={w.value} active={wallType === w.value} onClick={() => { set("wallType", w.value); close(); }}>
                  {isUk ? w.uk : w.en}
                </DropItem>
              ))}
            </>)}
          </Drop>

          {/* Опалення / Газ */}
          <Drop label={gasLabel} active={!!gasType}>
            {(close) => (<>
              <DropItem active={!gasType} onClick={() => { set("gasType", null); close(); }}>
                {isUk ? "Будь-яке" : "Any"}
              </DropItem>
              {GAS_TYPES.map((g) => (
                <DropItem key={g.value} active={gasType === g.value} onClick={() => { set("gasType", g.value); close(); }}>
                  {isUk ? g.uk : g.en}
                </DropItem>
              ))}
            </>)}
          </Drop>

          {/* Сортування */}
          <Drop label={sortLabel} active={!!sp.sort}>
            {(close) => (<>
              {[
                { v: "",             uk: "Нові спочатку",   en: "Newest first" },
                { v: "price_asc",    uk: "Ціна: зростання", en: "Price: low to high" },
                { v: "price_desc",   uk: "Ціна: спадання",  en: "Price: high to low" },
                { v: "areaSqm_desc", uk: "Площа: більша",   en: "Area: largest" },
              ].map((s) => (
                <DropItem key={s.v} active={(sp.sort ?? "") === s.v} onClick={() => { set("sort", s.v || null); close(); }}>
                  {isUk ? s.uk : s.en}
                </DropItem>
              ))}
            </>)}
          </Drop>
        </div>
      )}

    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile trigger */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white shadow-sm hover:border-gray-400 transition mb-4">
        <SlidersHorizontal className="w-4 h-4" />
        {isUk ? "Фільтри" : "Filters"}
        {hasFilters && <span className="w-2 h-2 rounded-full bg-gold-400" />}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-navy-900 text-lg">{isUk ? "Фільтри" : "Filters"}</h2>
              <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidebar}
            <button onClick={() => setMobileOpen(false)}
              className="mt-5 w-full py-3 bg-navy-900 text-white rounded-xl text-sm font-semibold hover:bg-navy-800 transition">
              {isUk ? "Показати результати" : "Show results"}
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
          {sidebar}
        </div>
      </aside>
    </>
  );
}
