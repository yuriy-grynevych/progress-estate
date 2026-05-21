"use client";
import { useEffect, useRef, useState } from "react";
import { JK_PATTERNS } from "@/lib/map-data";

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

function formatPrice(price: number, currency: string) {
  return `${price.toLocaleString("uk-UA")} ${currency}`;
}

type FilterType = "ALL" | "SALE" | "RENT";

export default function PropertiesMap({ properties }: { properties: MapProperty[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const jkLayerRef = useRef<any>(null);

  const [filter, setFilter] = useState<FilterType>("ALL");
  const [showJk, setShowJk] = useState(true);
  const [showInferred, setShowInferred] = useState(true);

  const saleCount = properties.filter((p) => p.listingType === "SALE").length;
  const rentCount = properties.filter((p) => p.listingType === "RENT").length;
  const exactCount = properties.filter((p) => p.coordsSource === "exact").length;
  const jkCount = properties.filter((p) => p.coordsSource === "jk").length;
  const districtCount = properties.filter((p) => p.coordsSource === "district").length;

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
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | © <a href="https://carto.com/attributions">CARTO</a> | ЖК: <a href="https://lun.ua/if" target="_blank">lun.ua</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);

      redrawMarkers(L, map, filter, showInferred);
      if (showJk) drawJkLayer(L, map);

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

  useEffect(() => {
    if (!mapInstance.current) return;
    import("leaflet").then((L) => {
      if (showJk) drawJkLayer(L, mapInstance.current);
      else if (jkLayerRef.current) {
        mapInstance.current.removeLayer(jkLayerRef.current);
        jkLayerRef.current = null;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showJk]);

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
      const price = formatPrice(p.price, p.currency);
      const propType = typeLabels[p.type] ?? p.type;
      const isExact = p.coordsSource === "exact";
      const isJk = p.coordsSource === "jk";

      // Kolor markera zależy od dokładności coords
      const bgColor = isExact
        ? (isSale ? "#0a1628" : "#d4a017")
        : isJk
        ? (isSale ? "#1e40af" : "#d97706")
        : (isSale ? "#64748b" : "#a16207");

      const textColor = isSale ? "#ffffff" : (isExact ? "#0a1628" : "#ffffff");

      // Dokładność: exact = solid, jk = dashed border, district = dotted
      const border = isExact
        ? "2.5px solid white"
        : isJk
        ? "2px dashed white"
        : "2px dotted white";

      const opacity = isExact ? "1" : isJk ? "0.88" : "0.72";

      const icon = L.divIcon({
        html: `<div style="background:${bgColor};color:${textColor};padding:4px 10px;border-radius:20px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.28);border:${border};line-height:1.4;letter-spacing:0.01em;opacity:${opacity};">${price}</div>`,
        iconAnchor: [44, 14],
        className: "",
      });

      const imgHtml = p.imageUrl
        ? `<img src="${p.imageUrl.startsWith("http") ? p.imageUrl : `https://res.cloudinary.com/dz3tveb47/image/upload/w_220,q_70/${p.imageUrl}`}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px;display:block;" />`
        : "";

      const listLabel = isSale ? "Продаж" : p.listingType === "RENT" ? "Оренда" : "Подобово";

      const coordsBadge = isExact
        ? `<span style="background:#d1fae5;color:#065f46;font-size:9px;font-weight:700;padding:2px 6px;border-radius:6px;">📍 GPS</span>`
        : isJk
        ? `<span style="background:#dbeafe;color:#1e40af;font-size:9px;font-weight:700;padding:2px 6px;border-radius:6px;">🏗 ЖК: ${p.sourceName ?? ""}</span>`
        : `<span style="background:#fef9c3;color:#854d0e;font-size:9px;font-weight:700;padding:2px 6px;border-radius:6px;">📌 Район: ${p.sourceName ?? p.district ?? ""}</span>`;

      const districtHtml = p.district
        ? `<div style="font-size:11px;color:#6b7280;margin-bottom:5px;">📍 ${p.district}</div>`
        : "";

      const popupHtml = `
        <div style="min-width:200px;max-width:240px;font-family:system-ui,sans-serif;">
          ${imgHtml}
          <div style="font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">${propType} · ${listLabel}</div>
          <div style="font-size:13px;font-weight:700;color:#0a1628;line-height:1.35;margin-bottom:4px;">${p.titleUk}</div>
          <div style="font-size:16px;font-weight:800;color:#0a1628;margin-bottom:5px;">${price}</div>
          ${districtHtml}
          <div style="margin-bottom:8px;">${coordsBadge}</div>
          <div style="display:flex;gap:6px;">
            <a href="/admin/properties/${p.id}" style="flex:1;background:#0a1628;color:white;text-decoration:none;font-size:11px;font-weight:700;padding:6px 8px;border-radius:8px;text-align:center;display:block;">✏️ Редагувати</a>
            <a href="/uk/listings/${p.slug}" target="_blank" rel="noopener" style="flex:1;background:#d4a017;color:#0a1628;text-decoration:none;font-size:11px;font-weight:700;padding:6px 8px;border-radius:8px;text-align:center;display:block;">Сайт →</a>
          </div>
        </div>
      `;

      const marker = L.marker([p.latitude, p.longitude], { icon })
        .addTo(map)
        .bindPopup(popupHtml, { maxWidth: 260, className: "property-popup" });

      markersRef.current.push(marker);
    });
  }

  function drawJkLayer(L: any, map: any) {
    if (jkLayerRef.current) {
      map.removeLayer(jkLayerRef.current);
    }
    const group = L.layerGroup();
    JK_PATTERNS.forEach((jk) => {
      const icon = L.divIcon({
        html: `<div style="background:rgba(59,130,246,0.85);color:white;padding:3px 7px;border-radius:10px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(59,130,246,0.35);border:1.5px solid white;line-height:1.4;">🏗 ${jk.name}</div>`,
        iconAnchor: [50, 12],
        className: "",
      });
      L.marker([jk.lat, jk.lng], { icon, zIndexOffset: -100 })
        .addTo(group)
        .bindTooltip(`<b>${jk.name}</b>`, { direction: "top", offset: [0, -8] });
    });
    group.addTo(map);
    jkLayerRef.current = group;
  }

  const btnBase = "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border";
  const btnActive = "bg-navy-900 text-white border-navy-900 shadow-sm";
  const btnInactive = "bg-white text-gray-600 border-gray-200 hover:border-navy-300";

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Listing type filter */}
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

        {/* ЖК reference layer */}
        <button onClick={() => setShowJk((v) => !v)} className={`${btnBase} flex items-center gap-1.5 ${showJk ? "bg-blue-600 text-white border-blue-600 shadow-sm" : btnInactive}`}>
          🏗 ЖК (lun.ua)
        </button>

        {/* Show/hide inferred */}
        <button onClick={() => setShowInferred((v) => !v)} className={`${btnBase} flex items-center gap-1.5 ${showInferred ? "bg-amber-500 text-white border-amber-500 shadow-sm" : btnInactive}`}>
          📌 Приблизні ({jkCount + districtCount})
        </button>

        {/* Legend */}
        <div className="ml-auto hidden sm:flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-navy-900 inline-block" />GPS точні ({exactCount})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block border border-dashed border-white" />По ЖК ({jkCount})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />По районі ({districtCount})</span>
        </div>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        style={{ height: "calc(100vh - 240px)", minHeight: 480 }}
        className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
      />
    </div>
  );
}
