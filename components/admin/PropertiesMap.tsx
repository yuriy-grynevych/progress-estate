"use client";
import { useEffect, useRef, useState } from "react";

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
  APARTMENT: "Квартира",
  HOUSE: "Будинок",
  COMMERCIAL: "Комерція",
  LAND: "Земля",
  OFFICE: "Офіс",
  ROOM: "Кімната",
  APARTMENT_PREMIUM: "Апартаменти",
  VILLA: "Вілла",
  PENTHOUSE: "Пентхаус",
  TOWNHOUSE: "Таунхаус",
};

type FilterType = "ALL" | "SALE" | "RENT";

export default function PropertiesMap({ properties }: { properties: MapProperty[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [filter, setFilter] = useState<FilterType>("ALL");
  const [showInferred, setShowInferred] = useState(true);

  const saleCount = properties.filter((p) => p.listingType === "SALE").length;
  const rentCount = properties.filter((p) => p.listingType === "RENT").length;
  const exactCount = properties.filter((p) => p.coordsSource === "exact").length;
  const approxCount = properties.filter((p) => p.coordsSource !== "exact").length;

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import("leaflet").then((L) => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current!, { zoomControl: false }).setView([48.9226, 24.7111], 13);
      mapInstance.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap | © CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);

      redrawMarkers(L, map, filter, showInferred);

      if (properties.length > 0) {
        const bounds = L.latLngBounds(properties.map((p) => [p.latitude, p.longitude]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    import("leaflet").then((L) => redrawMarkers(L, mapInstance.current, filter, showInferred));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, showInferred]);

  function redrawMarkers(L: any, map: any, currentFilter: FilterType, currentShowInferred: boolean) {
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const toShow = properties.filter((p) => {
      if (currentFilter !== "ALL" && p.listingType !== currentFilter) return false;
      if (!currentShowInferred && p.coordsSource !== "exact") return false;
      return true;
    });

    toShow.forEach((p) => {
      const isSale = p.listingType === "SALE";
      const isExact = p.coordsSource === "exact";
      const isJk = p.coordsSource === "jk";

      const price = p.price >= 1_000_000
        ? `${(p.price / 1_000_000).toFixed(1).replace(".0", "")} млн`
        : p.price >= 1000
        ? `${Math.round(p.price / 1000)}к`
        : String(p.price);
      const priceLabel = `${price} ${p.currency}`;

      // Styl jak lun.ua: zaokrąglony prostokąt z ceną
      // exact = solid, jk/district = lekka przezroczystość
      const opacity = isExact ? "1" : isJk ? "0.85" : "0.70";
      const bg = isSale ? "#e8591a" : "#1a6ee8";        // pomarańczowy=sprzedaż, niebieski=wynajem
      const shadow = isSale
        ? "0 2px 8px rgba(232,89,26,0.45)"
        : "0 2px 8px rgba(26,110,232,0.45)";
      const borderStyle = isExact ? "none" : `2px dashed rgba(255,255,255,0.7)`;

      const iconHtml = `
        <div style="
          display:flex;align-items:center;gap:5px;
          background:${bg};color:white;
          padding:5px 10px 5px 8px;
          border-radius:20px;
          font-size:12px;font-weight:800;
          white-space:nowrap;
          box-shadow:${shadow};
          border:${borderStyle};
          opacity:${opacity};
          line-height:1;
        ">
          <span style="
            width:8px;height:8px;border-radius:50%;
            background:rgba(255,255,255,0.9);
            flex-shrink:0;
            ${!isExact ? "border:1.5px dashed rgba(255,255,255,0.6);" : ""}
          "></span>
          ${priceLabel}
        </div>`;

      const icon = L.divIcon({
        html: iconHtml,
        iconAnchor: [50, 16],
        className: "",
      });

      const propType = typeLabels[p.type] ?? p.type;
      const listLabel = isSale ? "Продаж" : p.listingType === "RENT" ? "Оренда" : "Подобово";

      const imgHtml = p.imageUrl
        ? `<img src="${
            p.imageUrl.startsWith("http")
              ? p.imageUrl
              : `https://res.cloudinary.com/dz3tveb47/image/upload/w_240,q_75/${p.imageUrl}`
          }" style="width:100%;height:110px;object-fit:cover;border-radius:10px;margin-bottom:10px;display:block;" />`
        : "";

      const accuracyBadge = isExact
        ? `<span style="background:#dcfce7;color:#166534;font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;">📍 GPS</span>`
        : isJk
        ? `<span style="background:#e0f2fe;color:#0369a1;font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;">🏗 ${p.sourceName ?? "ЖК"}</span>`
        : `<span style="background:#fef9c3;color:#854d0e;font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;">📌 ${p.sourceName ?? p.district ?? "Район"}</span>`;

      const fullPrice = `${Number(p.price).toLocaleString("uk-UA")} ${p.currency}`;

      const popupHtml = `
        <div style="min-width:210px;max-width:250px;font-family:system-ui,sans-serif;padding:2px;">
          ${imgHtml}
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;margin-bottom:4px;">
            <div style="font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${propType} · ${listLabel}</div>
            ${accuracyBadge}
          </div>
          <div style="font-size:13px;font-weight:700;color:#111827;line-height:1.35;margin-bottom:6px;">${p.titleUk}</div>
          <div style="font-size:18px;font-weight:900;color:${bg};margin-bottom:6px;">${fullPrice}</div>
          ${p.district ? `<div style="font-size:11px;color:#6b7280;margin-bottom:8px;">📍 ${p.district}</div>` : ""}
          <div style="display:flex;gap:6px;">
            <a href="/admin/properties/${p.id}" style="flex:1;background:#111827;color:white;text-decoration:none;font-size:11px;font-weight:700;padding:7px 0;border-radius:8px;text-align:center;display:block;">✏️ Редагувати</a>
            <a href="/uk/listings/${p.slug}" target="_blank" rel="noopener" style="flex:1;background:${bg};color:white;text-decoration:none;font-size:11px;font-weight:700;padding:7px 0;border-radius:8px;text-align:center;display:block;">На сайті →</a>
          </div>
        </div>`;

      const marker = L.marker([p.latitude, p.longitude], { icon })
        .addTo(map)
        .bindPopup(popupHtml, { maxWidth: 270, className: "property-popup" });

      markersRef.current.push(marker);
    });
  }

  const btnBase = "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border";
  const btnActive = "bg-navy-900 text-white border-navy-900 shadow-sm";
  const btnInactive = "bg-white text-gray-600 border-gray-200 hover:border-navy-300";

  const shownCount = properties.filter((p) => {
    if (filter !== "ALL" && p.listingType !== filter) return false;
    if (!showInferred && p.coordsSource !== "exact") return false;
    return true;
  }).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(["ALL", "SALE", "RENT"] as FilterType[]).map((f) => {
            const label = f === "ALL" ? `Всі (${properties.length})` : f === "SALE" ? `Продаж (${saleCount})` : `Оренда (${rentCount})`;
            return (
              <button key={f} onClick={() => setFilter(f)} className={`${btnBase} ${filter === f ? btnActive : btnInactive}`}>
                {label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowInferred((v) => !v)}
          className={`${btnBase} ${showInferred ? "bg-orange-500 text-white border-orange-500 shadow-sm" : btnInactive}`}
        >
          📌 Приблизні ({approxCount})
        </button>

        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
          <span>На карті: <b className="text-navy-900">{shownCount}</b></span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e8591a] inline-block" />
            Продаж
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1a6ee8] inline-block" />
            Оренда
          </span>
          <span className="text-gray-400">· GPS: {exactCount} / ЖК: {properties.filter(p=>p.coordsSource==="jk").length} / Район: {properties.filter(p=>p.coordsSource==="district").length}</span>
        </div>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        style={{ height: "calc(100vh - 230px)", minHeight: 500 }}
        className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
      />
    </div>
  );
}
