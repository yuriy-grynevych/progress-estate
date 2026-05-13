"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const LISTING_TYPES = [
  { value: "", label: "Всі" },
  { value: "SALE", label: "Продаж" },
  { value: "RENT", label: "Оренда" },
  { value: "DAILY_RENT", label: "Подобова" },
];

const STATUSES = [
  { value: "", label: "Всі статуси" },
  { value: "ACTIVE", label: "Активне" },
  { value: "INACTIVE", label: "Неактивне" },
  { value: "SOLD", label: "Продано" },
  { value: "RENTED", label: "Здано" },
];

function StatusDrop({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const label = STATUSES.find((s) => s.value === value)?.label ?? "Всі статуси";
  const active = !!value;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-sm py-2 px-4 rounded-full border transition-all ${
          active
            ? "border-navy-900 bg-navy-50 text-navy-900 font-semibold"
            : "border-gray-300 text-gray-700 hover:border-gray-400 bg-white"
        }`}
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 py-1.5 min-w-[160px]">
          {STATUSES.map(({ value: v, label: l }) => (
            <button
              key={v}
              onClick={() => { onChange(v); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
                value === v ? "font-semibold text-navy-900 bg-gray-50/80" : "text-gray-700"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPropertyFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  function push(overrides: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`/admin/properties?${params.toString()}`);
  }

  const isMine = sp.get("mine") === "1";
  const listingType = sp.get("listingType") ?? "";
  const status = sp.get("status") ?? "";

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center">
      {/* Мої нерухомості */}
      <button
        onClick={() => push({ mine: isMine ? "" : "1" })}
        className={`text-sm py-2 px-4 rounded-full border transition-all font-medium ${
          isMine
            ? "border-gold-500 bg-gold-500 text-white"
            : "border-gray-300 text-gray-700 hover:border-gray-400 bg-white"
        }`}
      >
        ★ Мої нерухомості
      </button>

      {/* Тип оголошення — стиль як на клієнтській сторінці */}
      <div className="flex items-center gap-0.5">
        {LISTING_TYPES.map(({ value, label }) => (
          <button
            key={value || "all"}
            onClick={() => push({ listingType: value })}
            className={`text-sm py-2 px-4 rounded-full transition-all font-medium ${
              listingType === value
                ? "bg-navy-900 text-white"
                : "text-gray-600 hover:text-navy-900 bg-transparent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Статус — custom dropdown */}
      <StatusDrop value={status} onChange={(v) => push({ status: v })} />
    </div>
  );
}
