"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";
import { DISTRICTS_IF } from "@/lib/constants";
import { cn } from "@/lib/utils";

const PRIMARY_TYPES = [
  { value: "APARTMENT", label: "Квартира" },
  { value: "ROOM",      label: "Кімната" },
  { value: "HOUSE",     label: "Будинок" },
  { value: "COMMERCIAL",label: "Комерція" },
  { value: "OFFICE",    label: "Офіс" },
  { value: "LAND",      label: "Земля" },
];

const CONDITIONS = [
  { value: "no_renovation",     label: "Без ремонту" },
  { value: "cosmetic",          label: "Косметичний ремонт" },
  { value: "good",              label: "Хороший стан" },
  { value: "euro_renovation",   label: "Євроремонт" },
  { value: "author_renovation", label: "Авторський ремонт" },
  { value: "new_building",      label: "Новобудова" },
];

const STATUSES = [
  { value: "ACTIVE",   label: "Активне" },
  { value: "INACTIVE", label: "Неактивне" },
  { value: "SOLD",     label: "Продано" },
  { value: "RENTED",   label: "Здано" },
];

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
          "flex items-center justify-between gap-1.5 text-sm py-2 px-3 rounded-xl border transition-all w-full",
          active
            ? "border-navy-900 bg-navy-50 text-navy-900 font-semibold"
            : "border-gray-200 text-gray-600 hover:border-gray-400 bg-white"
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
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
    <button
      onClick={onClick}
      className={cn("w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50", active && "font-semibold text-navy-900 bg-gray-50/80")}
    >
      {children}
    </button>
  );
}

export default function AdminPropertySidebar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [extraOpen, setExtraOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [priceMin, setPriceMin] = useState(sp.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(sp.get("priceMax") ?? "");
  const [areaMin, setAreaMin] = useState(sp.get("areaMin") ?? "");
  const [areaMax, setAreaMax] = useState(sp.get("areaMax") ?? "");
  const [floorMin, setFloorMin] = useState(sp.get("floorMin") ?? "");
  const [floorMax, setFloorMax] = useState(sp.get("floorMax") ?? "");

  const listingType  = sp.get("listingType") ?? "";
  const rooms        = sp.get("rooms") ?? "";
  const condition    = sp.get("condition") ?? "";
  const status       = sp.get("status") ?? "";
  const propertyType = sp.get("type") ?? "";
  const district     = sp.get("district") ?? "";
  const isMine       = sp.get("mine") === "1";

  const hasFilters = ["listingType","rooms","condition","status","type","district","priceMin","priceMax","areaMin","areaMax","floorMin","floorMax","mine","search"].some((k) => sp.get(k));

  const extraActiveCount = [sp.get("areaMin"),sp.get("areaMax"),sp.get("floorMin"),sp.get("floorMax"),sp.get("type"),sp.get("district"),sp.get("search")].filter(Boolean).length;

  function push(overrides: Record<string, string | null>) {
    const params = new URLSearchParams(
      Array.from(sp.entries()) as [string, string][]
    );
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v); else params.delete(k);
    }
    params.delete("page");
    router.push(`/admin/properties?${params.toString()}`);
  }

  function applyRanges() {
    push({ priceMin: priceMin || null, priceMax: priceMax || null, areaMin: areaMin || null, areaMax: areaMax || null, floorMin: floorMin || null, floorMax: floorMax || null });
  }

  function clearAll() {
    setPriceMin(""); setPriceMax(""); setAreaMin(""); setAreaMax(""); setFloorMin(""); setFloorMax("");
    router.push("/admin/properties");
    setMobileOpen(false);
    setExtraOpen(false);
  }

  const districtLabel  = district ? (DISTRICTS_IF.find(d => d.value === district)?.labelUk ?? district) : "Район";
  const conditionLabel = condition ? (CONDITIONS.find(c => c.value === condition)?.label ?? condition) : "Стан";
  const statusLabel    = status ? (STATUSES.find(s => s.value === status)?.label ?? status) : "Всі статуси";

  const sidebar = (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-navy-900 text-base">Фільтри</h2>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-400 transition font-medium flex items-center gap-1">
            <X className="w-3 h-3" /> Скинути
          </button>
        )}
      </div>

      {/* Мої нерухомості */}
      <button
        onClick={() => push({ mine: isMine ? null : "1" })}
        className={cn(
          "w-full py-2 rounded-xl text-sm font-semibold border transition-all",
          isMine ? "bg-gold-500 border-gold-500 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-gold-400 hover:text-gold-600"
        )}
      >
        ★ Мої нерухомості
      </button>

      {/* Тип оголошення */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl">
        {[
          { v: "",           label: "Всі" },
          { v: "SALE",       label: "Продаж" },
          { v: "RENT",       label: "Оренда" },
          { v: "DAILY_RENT", label: "Подобова" },
        ].map((o) => (
          <button
            key={o.v || "all"}
            onClick={() => push({ listingType: o.v || null })}
            className={cn(
              "flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all",
              listingType === o.v ? "bg-white text-navy-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Ціна */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Ціна</p>
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

      {/* К-ть кімнат */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">К-ть кімнат</p>
        <div className="flex gap-1.5">
          {["", "1", "2", "3", "4"].map((r) => (
            <button key={r || "all"}
              onClick={() => push({ rooms: r || null })}
              className={cn(
                "flex-1 py-2 text-xs font-semibold rounded-xl border transition-all",
                rooms === r ? "bg-navy-900 text-white border-navy-900" : "bg-white text-gray-600 border-gray-200 hover:border-navy-300"
              )}>
              {r ? `${r}${r === "4" ? "+" : ""}` : "Всі"}
            </button>
          ))}
        </div>
      </div>

      {/* Стан */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Стан</p>
        <Drop label={conditionLabel} active={!!condition}>
          {(close) => (<>
            <DropItem active={!condition} onClick={() => { push({ condition: null }); close(); }}>Будь-який</DropItem>
            {CONDITIONS.map((c) => (
              <DropItem key={c.value} active={condition === c.value} onClick={() => { push({ condition: c.value }); close(); }}>{c.label}</DropItem>
            ))}
          </>)}
        </Drop>
      </div>

      {/* Статус */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Статус</p>
        <Drop label={statusLabel} active={!!status}>
          {(close) => (<>
            <DropItem active={!status} onClick={() => { push({ status: null }); close(); }}>Всі статуси</DropItem>
            {STATUSES.map((s) => (
              <DropItem key={s.value} active={status === s.value} onClick={() => { push({ status: s.value }); close(); }}>{s.label}</DropItem>
            ))}
          </>)}
        </Drop>
      </div>

      {/* Більше фільтрів */}
      <button
        onClick={() => setExtraOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
          extraOpen || extraActiveCount > 0
            ? "border-navy-900 bg-navy-50 text-navy-900"
            : "border-gray-200 text-gray-500 hover:border-gray-400 bg-white"
        )}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Більше фільтрів
          {extraActiveCount > 0 && (
            <span className="bg-navy-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{extraActiveCount}</span>
          )}
        </span>
        {extraOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {extraOpen && (
        <div className="space-y-2.5 pt-1 border-t border-gray-100">
          {/* Площа */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Площа, м²</p>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="від" value={areaMin}
                onChange={(e) => setAreaMin(e.target.value)}
                onBlur={applyRanges}
                onKeyDown={(e) => e.key === "Enter" && applyRanges()}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900/20 bg-white" />
              <span className="text-gray-300">—</span>
              <input type="number" placeholder="до" value={areaMax}
                onChange={(e) => setAreaMax(e.target.value)}
                onBlur={applyRanges}
                onKeyDown={(e) => e.key === "Enter" && applyRanges()}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900/20 bg-white" />
            </div>
          </div>

          {/* Поверх */}
          <Drop
            label={floorMin || floorMax ? `Поверх: ${floorMin || "?"} — ${floorMax || "?"}` : "Поверх"}
            active={!!floorMin || !!floorMax}
          >
            {(close) => (
              <div className="px-3 py-3 space-y-2">
                <p className="text-xs text-gray-500">Поверх від — до</p>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="1" value={floorMin} onChange={(e) => setFloorMin(e.target.value)} min="1"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                  <span className="text-gray-400">—</span>
                  <input type="number" placeholder="∞" value={floorMax} onChange={(e) => setFloorMax(e.target.value)} min="1"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                </div>
                <button onClick={() => { applyRanges(); close(); }} className="w-full py-1.5 bg-black text-white text-sm rounded-lg">
                  Застосувати
                </button>
              </div>
            )}
          </Drop>

          {/* Вулиця / пошук */}
          <Drop label={sp.get("search") ? `🔍 ${sp.get("search")}` : "Вулиця / пошук"} active={!!sp.get("search")}>
            {(close) => (
              <div className="px-3 py-2.5">
                <input
                  type="text"
                  placeholder="Назва вулиці або ЖК..."
                  defaultValue={sp.get("search") ?? ""}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      push({ search: (e.target as HTMLInputElement).value || null });
                      close();
                    }
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">Enter для пошуку</p>
              </div>
            )}
          </Drop>

          {/* Тип нерухомості */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Тип нерухомості</p>
            <div className="flex flex-wrap gap-1.5">
              {PRIMARY_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  onClick={() => push({ type: propertyType === pt.value ? null : pt.value })}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-xl border transition-all",
                    propertyType === pt.value
                      ? "bg-navy-900 text-white border-navy-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-navy-300 hover:text-navy-900"
                  )}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Район */}
          <Drop label={districtLabel} active={!!district}>
            {(close) => (<>
              <DropItem active={!district} onClick={() => { push({ district: null }); close(); }}>Всі райони</DropItem>
              {DISTRICTS_IF.map((d) => (
                <DropItem key={d.value} active={district === d.value} onClick={() => { push({ district: d.value }); close(); }}>
                  {d.labelUk}
                </DropItem>
              ))}
            </>)}
          </Drop>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white shadow-sm hover:border-gray-400 transition mb-4"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Фільтри
        {hasFilters && <span className="w-2 h-2 rounded-full bg-gold-400" />}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-navy-900 text-lg">Фільтри</h2>
              <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidebar}
            <button onClick={() => setMobileOpen(false)} className="mt-5 w-full py-3 bg-navy-900 text-white rounded-xl text-sm font-semibold">
              Показати результати
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
          {sidebar}
        </div>
      </aside>
    </>
  );
}
