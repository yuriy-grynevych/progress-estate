"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

const TYPES = [
  { key: "APARTMENT", label: "Квартира" },
  { key: "HOUSE",     label: "Будинок" },
  { key: "COMMERCIAL",label: "Комерція" },
  { key: "OFFICE",    label: "Офіс" },
  { key: "LAND",      label: "Земля" },
];

interface Props {
  districtOptions?: string[];
}

export default function MapFilterBar({ districtOptions = [] }: Props) {
  const router    = useRouter();
  const pathname  = usePathname();
  const sp        = useSearchParams();
  const [open, setOpen] = useState(false);

  function get(key: string) { return sp.get(key) ?? ""; }

  function push(updates: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v); else params.delete(k);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const rooms    = get("rooms");
  const type     = get("type");
  const district = get("district");
  const priceMin = get("priceMin");
  const priceMax = get("priceMax");
  const areaMin  = get("areaMin");
  const areaMax  = get("areaMax");

  const activeCount = [rooms, type, district, priceMin, priceMax, areaMin, areaMax].filter(Boolean).length;

  const reset = useCallback(() => {
    router.push(pathname);
    setOpen(false);
  }, [router, pathname]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Rooms */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1">
          {["", "1", "2", "3", "4+"].map((r) => (
            <button
              key={r}
              onClick={() => push({ rooms: r === "4+" ? "4" : r })}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                (r === "" && !rooms) || (r === "4+" && rooms === "4") || (r === rooms && r !== "4+")
                  ? "bg-navy-900 text-white"
                  : "text-gray-500 hover:text-navy-900"
              }`}
            >
              {r || "Всі"}
            </button>
          ))}
        </div>

        {/* Type buttons */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1">
          <button
            onClick={() => push({ type: "" })}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${!type ? "bg-navy-900 text-white" : "text-gray-500 hover:text-navy-900"}`}
          >
            Всі типи
          </button>
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => push({ type: type === t.key ? "" : t.key })}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                type === t.key ? "bg-navy-900 text-white" : "text-gray-500 hover:text-navy-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* More filters toggle */}
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
            open || activeCount > 2
              ? "bg-navy-900 text-white border-navy-900"
              : "bg-white text-gray-600 border-gray-200 hover:border-navy-900"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Фільтри{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>

        {activeCount > 0 && (
          <button onClick={reset} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition">
            <X className="w-3.5 h-3.5" /> Скинути
          </button>
        )}
      </div>

      {/* Expanded panel */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-[480px] max-w-[calc(100vw-2rem)]">
          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Ціна, $</p>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="від" value={priceMin}
                  onChange={e => push({ priceMin: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-navy-900" />
                <span className="text-gray-300 text-xs">—</span>
                <input type="number" placeholder="до" value={priceMax}
                  onChange={e => push({ priceMax: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-navy-900" />
              </div>
            </div>

            {/* Area */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Площа, м²</p>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="від" value={areaMin}
                  onChange={e => push({ areaMin: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-navy-900" />
                <span className="text-gray-300 text-xs">—</span>
                <input type="number" placeholder="до" value={areaMax}
                  onChange={e => push({ areaMax: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-navy-900" />
              </div>
            </div>

            {/* District */}
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Район / ЖК</p>
              <input
                type="text"
                list="district-options"
                placeholder="Назва вулиці або ЖК..."
                value={district}
                onChange={e => push({ district: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-navy-900"
              />
              {districtOptions.length > 0 && (
                <datalist id="district-options">
                  {districtOptions.map(d => <option key={d} value={d} />)}
                </datalist>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
