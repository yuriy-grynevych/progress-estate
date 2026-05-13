"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
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
  label, active, children,
}: {
  label: string; active?: boolean;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={cn("flex items-center gap-1 text-sm py-1.5 px-3 rounded-full border transition-all whitespace-nowrap",
          active ? "border-navy-900 bg-navy-50 text-navy-900 font-semibold" : "border-gray-200 text-gray-600 hover:border-gray-400 bg-white"
        )}>
        {label}
        <ChevronDown className={cn("w-3 h-3 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 py-1.5 max-h-60 overflow-y-auto min-w-[170px]">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function DropItem({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors", active && "font-semibold text-navy-900 bg-gray-50/80")}>
      {children}
    </button>
  );
}

export default function AdminPropertySidebar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [extraOpen, setExtraOpen] = useState(false);
  const extraRef = useRef<HTMLDivElement>(null);

  const [priceMin, setPriceMin] = useState(sp.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(sp.get("priceMax") ?? "");
  const [areaMin, setAreaMin]   = useState(sp.get("areaMin") ?? "");
  const [areaMax, setAreaMax]   = useState(sp.get("areaMax") ?? "");

  const listingType  = sp.get("listingType") ?? "";
  const rooms        = sp.get("rooms") ?? "";
  const condition    = sp.get("condition") ?? "";
  const status       = sp.get("status") ?? "";
  const propertyType = sp.get("type") ?? "";
  const district     = sp.get("district") ?? "";
  const isMine       = sp.get("mine") === "1";

  const hasFilters = ["listingType","rooms","condition","status","type","district","priceMin","priceMax","areaMin","areaMax","mine","search"].some((k) => sp.get(k));
  const extraActiveCount = [sp.get("priceMin"),sp.get("priceMax"),sp.get("areaMin"),sp.get("areaMax"),sp.get("type"),sp.get("district"),sp.get("condition"),sp.get("search"),sp.get("rooms")].filter(Boolean).length;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (extraRef.current && !extraRef.current.contains(e.target as Node)) setExtraOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function push(overrides: Record<string, string | null>) {
    const params = new URLSearchParams(Array.from(sp.entries()) as [string, string][]);
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v); else params.delete(k);
    }
    params.delete("page");
    router.push(`/admin/properties?${params.toString()}`);
  }

  function applyRanges() {
    push({ priceMin: priceMin || null, priceMax: priceMax || null, areaMin: areaMin || null, areaMax: areaMax || null });
  }

  function clearAll() {
    setPriceMin(""); setPriceMax(""); setAreaMin(""); setAreaMax("");
    router.push("/admin/properties");
    setExtraOpen(false);
  }

  const districtLabel  = district ? (DISTRICTS_IF.find(d => d.value === district)?.labelUk ?? district) : "Район";
  const conditionLabel = condition ? (CONDITIONS.find(c => c.value === condition)?.label ?? condition) : "Стан";
  const statusLabel    = status ? (STATUSES.find(s => s.value === status)?.label ?? status) : "Всі статуси";

  return (
    <div className="mb-4">
      {/* ── Main filter row ── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Мої нерухомості */}
        <button
          onClick={() => push({ mine: isMine ? null : "1" })}
          className={cn("text-sm py-1.5 px-4 rounded-full border transition-all font-medium whitespace-nowrap",
            isMine ? "border-gold-500 bg-gold-500 text-white" : "border-gray-300 text-gray-700 hover:border-gray-400 bg-white"
          )}
        >
          ★ Мої нерухомості
        </button>

        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

        {/* Тип оголошення */}
        <div className="flex items-center">
          {[
            { v: "", label: "Всі" },
            { v: "SALE", label: "Продаж" },
            { v: "RENT", label: "Оренда" },
          ].map((o) => (
            <button key={o.v || "all"} onClick={() => push({ listingType: o.v || null })}
              className={cn("text-sm py-1.5 px-3 rounded-full transition-all font-medium whitespace-nowrap",
                listingType === o.v ? "bg-navy-900 text-white" : "text-gray-600 hover:text-navy-900"
              )}>
              {o.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

        {/* Статус */}
        <Drop label={statusLabel} active={!!status}>
          {(close) => (<>
            <DropItem active={!status} onClick={() => { push({ status: null }); close(); }}>Всі статуси</DropItem>
            {STATUSES.map((s) => (
              <DropItem key={s.value} active={status === s.value} onClick={() => { push({ status: s.value }); close(); }}>{s.label}</DropItem>
            ))}
          </>)}
        </Drop>

        {/* Більше фільтрів */}
        <div ref={extraRef} className="relative">
          <button
            onClick={() => setExtraOpen((o) => !o)}
            className={cn("flex items-center gap-1.5 text-sm py-1.5 px-3 rounded-full border transition-all font-medium whitespace-nowrap",
              extraOpen || extraActiveCount > 0
                ? "border-navy-900 bg-navy-50 text-navy-900"
                : "border-gray-200 text-gray-600 hover:border-gray-400 bg-white"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Фільтри
            {extraActiveCount > 0 && (
              <span className="bg-navy-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{extraActiveCount}</span>
            )}
            <ChevronDown className={cn("w-3 h-3 text-gray-400 transition-transform", extraOpen && "rotate-180")} />
          </button>

          {extraOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 p-4 w-[480px] max-w-[calc(100vw-2rem)]">
              <div className="grid grid-cols-2 gap-4">
                {/* К-ть кімнат */}
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">К-ть кімнат</p>
                  <div className="flex gap-1.5">
                    {["", "1", "2", "3", "4"].map((r) => (
                      <button key={r || "all"} onClick={() => push({ rooms: r || null })}
                        className={cn("flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-all",
                          rooms === r ? "bg-navy-900 text-white border-navy-900" : "bg-white text-gray-600 border-gray-200 hover:border-navy-300"
                        )}>
                        {r ? `${r}${r === "4" ? "+" : ""}` : "Всі"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ціна */}
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ціна</p>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="від" value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      onBlur={applyRanges} onKeyDown={(e) => e.key === "Enter" && applyRanges()}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900/20 bg-white" />
                    <span className="text-gray-300">—</span>
                    <input type="number" placeholder="до" value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      onBlur={applyRanges} onKeyDown={(e) => e.key === "Enter" && applyRanges()}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900/20 bg-white" />
                  </div>
                </div>

                {/* Площа */}
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Площа, м²</p>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="від" value={areaMin}
                      onChange={(e) => setAreaMin(e.target.value)}
                      onBlur={applyRanges} onKeyDown={(e) => e.key === "Enter" && applyRanges()}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900/20 bg-white" />
                    <span className="text-gray-300">—</span>
                    <input type="number" placeholder="до" value={areaMax}
                      onChange={(e) => setAreaMax(e.target.value)}
                      onBlur={applyRanges} onKeyDown={(e) => e.key === "Enter" && applyRanges()}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900/20 bg-white" />
                  </div>
                </div>

                {/* Стан */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Стан</p>
                  <Drop label={conditionLabel} active={!!condition}>
                    {(close) => (<>
                      <DropItem active={!condition} onClick={() => { push({ condition: null }); close(); }}>Будь-який</DropItem>
                      {CONDITIONS.map((c) => (
                        <DropItem key={c.value} active={condition === c.value} onClick={() => { push({ condition: c.value }); close(); }}>{c.label}</DropItem>
                      ))}
                    </>)}
                  </Drop>
                </div>

                {/* Район */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Район</p>
                  <Drop label={districtLabel} active={!!district}>
                    {(close) => (<>
                      <DropItem active={!district} onClick={() => { push({ district: null }); close(); }}>Всі райони</DropItem>
                      {DISTRICTS_IF.map((d) => (
                        <DropItem key={d.value} active={district === d.value} onClick={() => { push({ district: d.value }); close(); }}>{d.labelUk}</DropItem>
                      ))}
                    </>)}
                  </Drop>
                </div>

                {/* Тип нерухомості */}
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Тип нерухомості</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRIMARY_TYPES.map((pt) => (
                      <button key={pt.value}
                        onClick={() => push({ type: propertyType === pt.value ? null : pt.value })}
                        className={cn("px-3 py-1 text-xs font-medium rounded-xl border transition-all",
                          propertyType === pt.value ? "bg-navy-900 text-white border-navy-900" : "bg-white text-gray-600 border-gray-200 hover:border-navy-300"
                        )}>
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Пошук */}
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Вулиця / ЖК</p>
                  <input type="text" placeholder="Назва вулиці або ЖК..."
                    defaultValue={sp.get("search") ?? ""}
                    onKeyDown={(e) => { if (e.key === "Enter") { push({ search: (e.target as HTMLInputElement).value || null }); setExtraOpen(false); } }}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900/20" />
                  <p className="text-xs text-gray-400 mt-1">Enter для пошуку</p>
                </div>
              </div>

              {hasFilters && (
                <button onClick={clearAll} className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition font-medium">
                  <X className="w-3 h-3" /> Скинути всі фільтри
                </button>
              )}
            </div>
          )}
        </div>

        {/* Clear button */}
        {hasFilters && (
          <button onClick={clearAll} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition font-medium">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
