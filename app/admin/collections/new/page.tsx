"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Search, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Квартира",
  ROOM: "Кімната",
  HOUSE: "Будинок",
  APARTMENT_PREMIUM: "Преміум квартира",
  VILLA: "Вілла",
  PENTHOUSE: "Пентхаус",
  TOWNHOUSE: "Таунхаус",
  DUPLEX: "Дуплекс",
  COMMERCIAL: "Комерція",
  OFFICE: "Офіс",
  RETAIL: "Рітейл",
  WAREHOUSE: "Склад",
  INDUSTRIAL: "Виробничe",
  FOOD_SERVICE: "Громадське харчування",
  SERVICE_OBJECT: "Сервісний об'єкт",
  OTHER_OBJECT: "Інший об'єкт",
  SHOP: "Магазин",
  HOTEL_ROOM: "Номер готелю",
  WHOLE_BUILDING: "Ціла будівля",
  LAND: "Земля",
  LAND_INDIVIDUAL: "Земля ІЖС",
  LAND_GARDEN: "Садова ділянка",
  LAND_FARM: "Фермерська ділянка",
  LAND_COMMERCIAL: "Комерційна земля",
  GARAGE: "Гараж",
  PARKING: "Паркінг",
};

const LISTING_LABELS: Record<string, string> = {
  SALE: "Продаж",
  RENT: "Оренда",
  DAILY_RENT: "Подобова оренда",
};

type Property = {
  id: string;
  slug: string;
  titleUk: string;
  price: number;
  currency: string;
  type: string;
  listingType: string;
  areaSqm: number;
  rooms: number | null;
  district: string | null;
  address: string | null;
  images: { url: string }[];
};

export default function NewCollectionPage() {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [listingType, setListingType] = useState("");
  const [rooms, setRooms] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    if (listingType) params.set("listingType", listingType);
    if (rooms) params.set("rooms", rooms);
    try {
      const res = await fetch(`/api/properties/list?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } finally {
      setLoading(false);
    }
  }, [search, type, listingType, rooms]);

  useEffect(() => {
    const t = setTimeout(fetchProperties, 300);
    return () => clearTimeout(t);
  }, [fetchProperties]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim()) {
      alert("Введіть назву колекції");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), propertyIds: Array.from(selectedIds) }),
      });
      if (res.ok) {
        const col = await res.json();
        window.location.href = `/admin/collections/${col.id}`;
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Помилка при збереженні: " + (err.error ?? res.status));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Нова колекція</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-black/90 transition disabled:opacity-50"
        >
          {saving ? "Зберігаємо…" : "Зберегти"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <label className="block text-sm font-semibold text-navy-900 mb-1.5">
          Назва колекції
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Наприклад: Квартири ЖК Княгинин"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-sm font-semibold text-navy-900 mb-3">
          Фільтри ({selectedIds.size} обрано)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук…"
              className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
          >
            <option value="">Всі типи</option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select
            value={listingType}
            onChange={(e) => setListingType(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
          >
            <option value="">Продаж/Оренда</option>
            {Object.entries(LISTING_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select
            value={rooms}
            onChange={(e) => setRooms(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
          >
            <option value="">К-сть кімнат</option>
            {[1, 2, 3, 4, 5].map((r) => (
              <option key={r} value={r}>{r}+</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading && (
          <div className="text-center py-10 text-gray-400 text-sm">Завантаження…</div>
        )}
        {!loading && properties.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">Об'єктів не знайдено</div>
        )}
        {!loading && properties.map((p) => {
          const selected = selectedIds.has(p.id);
          const img = p.images[0]?.url;
          return (
            <div
              key={p.id}
              onClick={() => toggleSelect(p.id)}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition ${
                selected ? "bg-gold-50" : "hover:bg-gray-50"
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                selected ? "bg-gold-500 border-gold-500" : "border-gray-300"
              }`}>
                {selected && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {img ? (
                  <Image src={img} alt={p.titleUk} width={64} height={48} className="object-cover w-full h-full" unoptimized />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy-900 truncate">{p.titleUk}</p>
                <p className="text-xs text-gray-400 truncate">
                  {TYPE_LABELS[p.type] ?? p.type} · {p.areaSqm} м²
                  {p.rooms ? ` · ${p.rooms} кім.` : ""}
                  {p.district ? ` · ${p.district}` : ""}
                </p>
              </div>
              <div className="text-sm font-bold text-navy-900 flex-shrink-0">
                {formatPrice(p.price, p.currency)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
