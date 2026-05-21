"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { cloudinaryUrl } from "@/lib/cloudinary";

export interface MapProperty {
  id: string;
  slug: string;
  titleUk: string;
  price: number;
  currency: string;
  type: string;
  listingType: string;
  district: string | null;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  coordsSource: "exact" | "jk" | "district";
  sourceName?: string;
}

const typeLabels: Record<string, string> = {
  APARTMENT: "Квартира", HOUSE: "Будинок", COMMERCIAL: "Комерція",
  LAND: "Земля", OFFICE: "Офіс", ROOM: "Кімната",
  APARTMENT_PREMIUM: "Апартаменти", VILLA: "Вілла",
  PENTHOUSE: "Пентхаус", TOWNHOUSE: "Таунхаус",
};

type FilterType = "ALL" | "SALE" | "RENT";

function shortPrice(price: number, currency: string) {
  if (currency === "UAH") {
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1).replace(/\.0$/, "")} млн грн`;
    if (price >= 1000) return `${Math.round(price / 1000)}к грн`;
  }
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M ${currency}`;
  if (price >= 1000) return `${Math.round(price / 1000)}к ${currency}`;
  return `${price} ${currency}`;
}

function fullPrice(price: number, currency: string) {
  return `${price.toLocaleString("uk-UA")} ${currency}`;
}

export default function PropertiesMap({ properties }: { properties: MapProperty[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersMapRef = useRef<Map<string, any>>(new Map());

  const [filter, setFilter] = useState<FilterType>("ALL");
  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const visible = properties.filter((p) =>
    filter === "ALL" ? true : p.listingType === filter
  );

  const saleCount = properties.filter((p) => p.listingType === "SALE").length;
  const rentCount = properties.filter((p) => p.listingType === "RENT").length;

  const flyTo = useCallback((p: MapProperty) => {
    if (!mapInstance.current) return;
    mapInstance.current.flyTo([p.latitude, p.longitude], 16, { duration: 0.6 });
    const marker = markersMapRef.current.get(p.id);
    if (marker) marker.openPopup();
    setActiveId(p.id);
  }, []);

  // Scroll list to active item
  useEffect(() => {
    if (!activeId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-id="${activeId}"]`) as HTMLElement;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeId]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import("leaflet").then((L) => {
      // Leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current!, { zoomControl: false }).setView([48.9226, 24.7111], 13);
      mapInstance.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap | © CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      buildMarkers(L, map, properties);

      if (properties.length > 0) {
        const bounds = L.latLngBounds(properties.map((p) => [p.latitude, p.longitude]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    });

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter: show/hide markers
  useEffect(() => {
    if (!mapInstance.current) return;
    markersMapRef.current.forEach((marker, id) => {
      const p = properties.find((x) => x.id === id);
      if (!p) return;
      const shouldShow = filter === "ALL" || p.listingType === filter;
      if (shouldShow) marker.addTo(mapInstance.current);
      else mapInstance.current.removeLayer(marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function buildMarkers(L: any, map: any, props: MapProperty[]) {
    props.forEach((p) => {
      const isSale = p.listingType === "SALE";
      const isExact = p.coordsSource === "exact";
      const bg = isSale ? "#e05a1e" : "#1a5fc8";
      const label = shortPrice(p.price, p.currency);

      // Marker — solid colored pill with price text
      const icon = L.divIcon({
        className: "lun-marker",
        html: `<div style="
          background:${bg};
          color:#fff;
          padding:5px 11px;
          border-radius:20px;
          font:700 12px/1 system-ui,sans-serif;
          white-space:nowrap;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          outline:2px solid rgba(255,255,255,0.8);
          ${!isExact ? "opacity:0.82;" : ""}
        ">${label}</div>`,
        iconAnchor: [45, 14],
        popupAnchor: [0, -16],
      });

      const imgUrl = p.imageUrl
        ? (p.imageUrl.startsWith("http") ? p.imageUrl : cloudinaryUrl(p.imageUrl, { width: 240, quality: 70 }))
        : null;

      const srcBadge = p.coordsSource === "exact"
        ? `<span style="background:#d1fae5;color:#065f46;font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;">📍 GPS</span>`
        : p.coordsSource === "jk"
        ? `<span style="background:#dbeafe;color:#1e40af;font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;">🏗 ${p.sourceName ?? "ЖК"}</span>`
        : `<span style="background:#fef9c3;color:#92400e;font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;">📌 ${p.sourceName ?? p.district ?? "Район"}</span>`;

      const popup = `
        <div style="min-width:210px;max-width:240px;font-family:system-ui,sans-serif;">
          ${imgUrl ? `<img src="${imgUrl}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;">` : ""}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;">${typeLabels[p.type] ?? p.type} · ${isSale ? "Продаж" : "Оренда"}</span>
            ${srcBadge}
          </div>
          <div style="font-size:13px;font-weight:700;color:#111;line-height:1.3;margin-bottom:5px;">${p.titleUk}</div>
          <div style="font-size:17px;font-weight:900;color:${bg};margin-bottom:6px;">${fullPrice(p.price, p.currency)}</div>
          ${p.district ? `<div style="font-size:11px;color:#6b7280;margin-bottom:8px;">📍 ${p.district}</div>` : ""}
          <div style="display:flex;gap:6px;">
            <a href="/admin/properties/${p.id}" style="flex:1;background:#111;color:#fff;text-decoration:none;font-size:11px;font-weight:700;padding:7px 0;border-radius:8px;text-align:center;display:block;">✏️ Ред.</a>
            <a href="/uk/listings/${p.slug}" target="_blank" style="flex:1;background:${bg};color:#fff;text-decoration:none;font-size:11px;font-weight:700;padding:7px 0;border-radius:8px;text-align:center;display:block;">Сайт →</a>
          </div>
        </div>`;

      const marker = L.marker([p.latitude, p.longitude], { icon })
        .addTo(map)
        .bindPopup(popup, { maxWidth: 260 });

      marker.on("click", () => setActiveId(p.id));
      markersMapRef.current.set(p.id, marker);
    });
  }

  const btnCls = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
      active ? "bg-navy-900 text-white border-navy-900 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
    }`;

  return (
    <div className="flex gap-0 rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: "calc(100vh - 190px)", minHeight: 520 }}>

      {/* ── LEFT PANEL ── */}
      <div className="w-[320px] flex-shrink-0 flex flex-col bg-white border-r border-gray-100">
        {/* filters */}
        <div className="p-3 border-b border-gray-100 flex gap-1.5 flex-wrap">
          {(["ALL", "SALE", "RENT"] as FilterType[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={btnCls(filter === f)}>
              {f === "ALL" ? `Всі (${properties.length})` : f === "SALE" ? `Продаж (${saleCount})` : `Оренда (${rentCount})`}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400 self-center">{visible.length} на карті</span>
        </div>

        {/* list */}
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {visible.map((p) => {
            const isSale = p.listingType === "SALE";
            const isActive = activeId === p.id;
            const imgUrl = p.imageUrl
              ? (p.imageUrl.startsWith("http") ? p.imageUrl : cloudinaryUrl(p.imageUrl, { width: 120, quality: 60 }))
              : null;

            return (
              <div
                key={p.id}
                data-id={p.id}
                onClick={() => flyTo(p)}
                className={`flex gap-3 p-3 cursor-pointer border-b border-gray-50 transition-colors ${
                  isActive ? "bg-orange-50 border-l-2 border-l-orange-400" : "hover:bg-gray-50"
                }`}
              >
                {/* thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">🏠</div>
                  )}
                </div>

                {/* info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1 mb-0.5">
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ background: isSale ? "#e05a1e" : "#1a5fc8", fontSize: "10px" }}
                    >
                      {isSale ? "Продаж" : "Оренда"}
                    </span>
                    {p.coordsSource !== "exact" && (
                      <span className="text-[9px] text-gray-400">
                        {p.coordsSource === "jk" ? "🏗" : "📌"}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-2 mb-1">
                    {p.titleUk}
                  </div>
                  <div className="text-sm font-bold" style={{ color: isSale ? "#e05a1e" : "#1a5fc8" }}>
                    {shortPrice(p.price, p.currency)}
                  </div>
                  {p.district && (
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">📍 {p.district}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MAP ── */}
      <div ref={mapRef} className="flex-1" />
    </div>
  );
}
