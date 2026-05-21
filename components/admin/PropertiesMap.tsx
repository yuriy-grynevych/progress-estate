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

// ЖК reference data from lun.ua — Івано-Франківськ
const JK_LOCATIONS = [
  { name: "Manhattan Up",      lat: 48.9208, lng: 24.6867, district: "Набережна" },
  { name: "HydroPark DeLuxe", lat: 48.9116, lng: 24.6917, district: "Парковий" },
  { name: "Prostir",           lat: 48.9032, lng: 24.6983, district: "Опришівці" },
  { name: "PORTO FRANKO",      lat: 48.9240, lng: 24.7110, district: "Центр" },
  { name: "WAWEL",             lat: 48.9329, lng: 24.7501, district: "Вовчинець" },
  { name: "URBN",              lat: 48.8888, lng: 24.6881, district: "Крихівці" },
  { name: "ЛИПКИ 2",           lat: 48.9153, lng: 24.7316, district: "Незалежності" },
  { name: "Comfort Park 2",    lat: 48.9109, lng: 24.7105, district: "Нім. колонія" },
  { name: "NOVATOR",           lat: 48.9033, lng: 24.6972, district: "Опришівці" },
  { name: "Protezione",        lat: 48.9160, lng: 24.7050, district: "Парковий" },
  { name: "Senat",             lat: 48.9239, lng: 24.6945, district: "Центр" },
  { name: "Family Park",       lat: 48.9300, lng: 24.7200, district: "Парковий" },
  { name: "Green Side",        lat: 48.9350, lng: 24.7450, district: "Вовчинець" },
  { name: "Central Park",      lat: 48.9220, lng: 24.7080, district: "Центр" },
  { name: "Millennium",        lat: 48.9180, lng: 24.7030, district: "Центр" },
  { name: "Акварелі",          lat: 48.9140, lng: 24.6960, district: "Парковий" },
  { name: "Гармонія",          lat: 48.9070, lng: 24.6820, district: "Парковий" },
  { name: "PARK AVENUE premium", lat: 48.9155, lng: 24.7330, district: "Пасічна" },
  { name: "Липські вежі",      lat: 48.9145, lng: 24.7280, district: "Незалежності" },
  { name: "Містечко Південне", lat: 48.8960, lng: 24.7200, district: "Опришівці" },
  { name: "Містечко Молодіжне", lat: 48.9428, lng: 24.6961, district: "Пасічна" },
  { name: "СКАНДИНАВІЯ",       lat: 48.9380, lng: 24.7100, district: "Угорники" },
  { name: "Столичний Квартал", lat: 48.9260, lng: 24.7150, district: "Центр" },
];

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

  const filtered = properties.filter((p) =>
    filter === "ALL" ? true : p.listingType === filter
  );

  const saleCount = properties.filter((p) => p.listingType === "SALE").length;
  const rentCount = properties.filter((p) => p.listingType === "RENT").length;

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

      // CartoDB Positron — clean light tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | © <a href="https://carto.com/attributions">CARTO</a> | ЖК: <a href="https://lun.ua/if" target="_blank">lun.ua</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      // Zoom controls (top-right)
      L.control.zoom({ position: "topright" }).addTo(map);

      // Draw all property markers
      redrawMarkers(L, map);

      // ЖК layer
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

  // Re-draw markers when filter changes
  useEffect(() => {
    if (!mapInstance.current) return;
    import("leaflet").then((L) => {
      redrawMarkers(L, mapInstance.current);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Toggle ЖК layer
  useEffect(() => {
    if (!mapInstance.current) return;
    import("leaflet").then((L) => {
      if (showJk) {
        drawJkLayer(L, mapInstance.current);
      } else {
        if (jkLayerRef.current) {
          mapInstance.current.removeLayer(jkLayerRef.current);
          jkLayerRef.current = null;
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showJk]);

  function redrawMarkers(L: any, map: any) {
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const toShow = properties.filter((p) =>
      filter === "ALL" ? true : p.listingType === filter
    );

    toShow.forEach((p) => {
      const isSale = p.listingType === "SALE";
      const isRent = p.listingType === "RENT";
      const bgColor = isSale ? "#0a1628" : isRent ? "#d4a017" : "#6b7280";
      const textColor = isSale ? "#ffffff" : "#0a1628";
      const price = formatPrice(p.price, p.currency);
      const propType = typeLabels[p.type] ?? p.type;

      const icon = L.divIcon({
        html: `<div style="background:${bgColor};color:${textColor};padding:4px 10px;border-radius:20px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.30);border:2px solid white;line-height:1.4;letter-spacing:0.01em;">${price}</div>`,
        iconAnchor: [44, 14],
        className: "",
      });

      const imgHtml = p.imageUrl
        ? `<img src="${p.imageUrl.startsWith("http") ? p.imageUrl : `https://res.cloudinary.com/dz3tveb47/image/upload/w_220,q_70/${p.imageUrl}`}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px;display:block;" />`
        : "";

      const listLabel = isSale ? "Продаж" : isRent ? "Оренда" : "Подобово";
      const districtHtml = p.district
        ? `<div style="font-size:11px;color:#6b7280;margin-bottom:8px;display:flex;align-items:center;gap:3px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${p.district}</div>`
        : "";

      const popupHtml = `
        <div style="min-width:200px;max-width:240px;font-family:system-ui,sans-serif;">
          ${imgHtml}
          <div style="font-size:10px;color:${bgColor};font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">${propType} · ${listLabel}</div>
          <div style="font-size:13px;font-weight:700;color:#0a1628;line-height:1.35;margin-bottom:4px;">${p.titleUk}</div>
          <div style="font-size:16px;font-weight:800;color:#0a1628;margin-bottom:4px;">${price}</div>
          ${districtHtml}
          <div style="display:flex;gap:6px;margin-top:4px;">
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

    JK_LOCATIONS.forEach((jk) => {
      const icon = L.divIcon({
        html: `<div style="background:rgba(59,130,246,0.90);color:white;padding:3px 8px;border-radius:12px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(59,130,246,0.4);border:1.5px solid white;line-height:1.4;">🏗 ${jk.name}</div>`,
        iconAnchor: [50, 12],
        className: "",
      });

      L.marker([jk.lat, jk.lng], { icon, zIndexOffset: -100 })
        .addTo(group)
        .bindTooltip(`<b>${jk.name}</b><br><span style="font-size:11px;color:#6b7280">${jk.district}</span>`, {
          direction: "top",
          offset: [0, -8],
        });
    });

    group.addTo(map);
    jkLayerRef.current = group;
  }

  const btnBase = "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border";
  const btnActive = "bg-navy-900 text-white border-navy-900 shadow";
  const btnInactive = "bg-white text-gray-600 border-gray-200 hover:border-navy-300";

  return (
    <div className="flex flex-col gap-3">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter */}
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1">
          {(["ALL", "SALE", "RENT"] as FilterType[]).map((f) => {
            const label = f === "ALL" ? `Всі (${properties.length})` : f === "SALE" ? `Продаж (${saleCount})` : `Оренда (${rentCount})`;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`${btnBase} ${filter === f ? btnActive : btnInactive}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ЖК toggle */}
        <button
          onClick={() => setShowJk((v) => !v)}
          className={`${btnBase} flex items-center gap-1.5 ${showJk ? "bg-blue-600 text-white border-blue-600 shadow" : btnInactive}`}
        >
          <span className="text-base leading-none">🏗</span>
          ЖК з lun.ua {showJk ? "(вкл)" : "(викл)"}
        </button>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-navy-900 inline-block shadow" />
            Продаж
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gold-500 inline-block shadow" />
            Оренда
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow" />
            ЖК (lun.ua)
          </span>
        </div>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        style={{ height: "calc(100vh - 230px)", minHeight: 480 }}
        className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
      />
    </div>
  );
}
