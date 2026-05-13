"use client";

import { useRouter, useSearchParams } from "next/navigation";

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
      <button
        onClick={() => push({ mine: isMine ? "" : "1" })}
        className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition border ${
          isMine
            ? "bg-gold-500 border-gold-500 text-white"
            : "bg-white border-gray-200 text-gray-600 hover:border-gold-400 hover:text-gold-600"
        }`}
      >
        ★ Мої нерухомості
      </button>

      <div className="w-px h-5 bg-gray-200" />

      {LISTING_TYPES.map(({ value, label }) => (
        <button
          key={value || "all"}
          onClick={() => push({ listingType: value })}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
            listingType === value
              ? "bg-navy-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {label}
        </button>
      ))}

      <select
        value={status}
        onChange={(e) => push({ status: e.target.value })}
        className="px-3 py-1.5 rounded-xl text-sm border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-navy-900"
      >
        {STATUSES.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
