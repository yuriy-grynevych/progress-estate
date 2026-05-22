"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Search, Check, Share2, ExternalLink } from "lucide-react";
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

type Collection = {
  id: string;
  name: string;
  slug: string;
  items: { property: Property }[];
};

export default function EditCollectionPage() {
  const params = useParams();
  const id = params.id as string;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [search, setSearch] = useState("");
  const [jk, setJk] = useState("");
  const [type, setType] = useState("");
  const [listingType, setListingType] = useState("");
  const [rooms, setRooms] = useState("");
  const [district, setDistrict] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadCollection() {
      const res = await fetch(`/api/collections/${id}`);
      if (!res.ok) { window.location.href = "/admin/collections"; return; }
      const col: Collection = await res.json();
      setName(col.name);
      setSlug(col.slug);
      setSelectedIds(new Set(col.items.map((item) => item.property.id)));
    }
    loadCollection();
  }, [id]);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    const combined = [search, jk].filter(Boolean).join(" ");
    if (combined) p.set("search", combined);
    if (type) p.set("type", type);
    if (listingType) p.set("listingType", listingType);
    if (rooms) p.set("rooms", rooms);
    if (district) p.set("district", district);
    try {
      const res = await fetch(`/api/properties/list?${p}`);
      if (res.ok) setProperties(await res.json());
    } finally {
      setLoading(false);
    }
  }, [search, jk, type, listingType, rooms, district]);

  useEffect(() => {
    const t = setTimeout(fetchProperties, 300);
    return () => clearTimeout(t);
  }, [fetchProperties]);

  function toggleSelect(propId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(propId)) next.delete(propId);
      else next.add(propId);
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim()) { alert("Введіть назву колекції"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), propertyIds: Array.from(selectedIds) }),
      });
      if (res.ok) {
        window.location.href = "/admin/collections";
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Помилка при збереженні: " + (err.error ?? res.status));
      }
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}/c/${slug}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const el = document.createElement("textarea");
        el.value = url;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Посилання: " + url);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-navy-900">Редагування колекції</h1>
        <div className="flex items-center gap-2">
          {slug && (
            <button
              onClick={copyLink}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              <Share2 className="w-4 h-4" />
              {copied ? "Скопійовано!" : "Публічне посилання"}
            </button>
          )}
          {slug && (
            <a
              href={`/c/${slug}`}
              target="_blank"
              className="text-gray-400 hover:text-navy-900 transition p-2 rounded-xl hover:bg-gray-100"
              title="Переглянути публічну сторінку"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-black/90 transition disabled:opacity-50"
          >
            {saving ? "Зберігаємо…" : "Зберегти"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <label className="block text-sm font-semibold text-navy-900 mb-1.5">Назва колекції</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-sm font-semibold text-navy-900 mb-3">
          Фільтри ({selectedIds.size} обрано)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук за назвою…"
              className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>
          <input
            type="text"
            value={jk}
            onChange={(e) => setJk(e.target.value)}
            placeholder="ЖК (напр. Княгинин)"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
          />
          <input
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Район…"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
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
              className={`flex items-center gap-4 px-4 py-4 border-b border-gray-100 cursor-pointer transition ${
                selected ? "bg-gold-50 border-l-4 border-l-gold-500" : "hover:bg-gray-50"
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                selected ? "bg-gold-500 border-gold-500" : "border-gray-300"
              }`}>
                {selected && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="w-36 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {img ? (
                  <Image src={img} alt={p.titleUk} width={144} height={96} className="object-cover w-full h-full" unoptimized />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy-900 line-clamp-2 leading-snug mb-1">{p.titleUk}</p>
                <p className="text-xs text-gray-500">
                  {TYPE_LABELS[p.type] ?? p.type}
                  {p.rooms ? ` · ${p.rooms} кім.` : ""}
                  {` · ${p.areaSqm} м²`}
                </p>
                {p.district && <p className="text-xs text-gray-400 mt-0.5">{p.district}</p>}
              </div>
              <div className="text-base font-bold text-navy-900 flex-shrink-0">
                {formatPrice(p.price, p.currency)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
