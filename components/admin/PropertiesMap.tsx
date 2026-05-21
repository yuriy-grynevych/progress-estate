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
    mapInstance.current.flyTo([p.latitude, p.longitude], 16, { duration: 0.5 });
    const marker = markersMapRef.current.get(p.id);
    if (marker) setTimeout(() => marker.openPopup(), 550);
    setActiveId(p.id);
  }, []);

  // scroll list to active
  useEffect(() => {
    if (!activeId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-id="${activeId}"]`) as HTMLElement;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeId]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import("leaflet").then((L) => {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Ivano-Frankivsk city center, zoom 13
      const map = L.map(mapRef.current!, { zoomControl: false }).setView([48.9226, 24.7111], 13);
      mapInstance.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap | © CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      buildMarkers(L, map, properties);

      // Fit only exact-GPS properties to avoid wrong-coord outliers
      const exactProps = properties.filter((p) => p.coordsSource === "exact");
      const fittable = exactProps.length > 0 ? exactProps : properties;
      if (fittable.length > 0) {
        const bounds = L.latLngBounds(fittable.map((p) => [p.latitude, p.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    });

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filter show/hide
  useEffect(() => {
    if (!mapInstance.current) return;
    markersMapRef.current.forEach((marker, id) => {
      const p = properties.find((x) => x.id === id);
      if (!p) return;
      if (filter === "ALL" || p.listingType === filter) marker.addTo(mapInstance.current);
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

      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${bg};color:#fff;padding:5px 11px;border-radius:20px;font:700 12px/1 system-ui,sans-serif;white-space:nowrap;box-shadow:0 2px 10px rgba(0,0,0,0.4);outline:2.5px solid rgba(255,255,255,0.9);${!isExact ? "opacity:0.80;" : ""}">${label}</div>`,
        iconAnchor: [45, 14],
        popupAnchor: [0, -18],
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
        <div style="min-width:210px;max-width:245px;font-family:system-ui,sans-serif;">
          ${imgUrl ? `<img src="${imgUrl}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;">` : ""}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;">${isSale ? "Продаж" : "Оренда"}</span>
            ${srcBadge}
          </div>
          <div style="font-size:13px;font-weight:700;color:#111;line-height:1.3;margin-bottom:5px;">${p.titleUk}</div>
          <div style="font-size:17px;font-weight:900;color:${bg};margin-bottom:6px;">${p.price.toLocaleString("uk-UA")} ${p.currency}</div>
          ${p.district ? `<div style="font-size:11px;color:#6b7280;margin-bottom:8px;">📍 ${p.district}</div>` : ""}
          <div style="display:flex;gap:6px;">
            <a href="/admin/properties/${p.id}" style="flex:1;background:#111;color:#fff;text-decoration:none;font-size:11px;font-weight:700;padding:7px 0;border-radius:8px;text-align:center;display:block;">✏️ Ред.</a>
            <a href="/uk/listings/${p.slug}" target="_blank" style="flex:1;background:${bg};color:#fff;text-decoration:none;font-size:11px;font-weight:700;padding:7px 0;border-radius:8px;text-align:center;display:block;">Сайт →</a>
          </div>
        </div>`;

      const marker = L.marker([p.latitude, p.longitude], { icon })
        .addTo(map)
        .bindPopup(popup, { maxWidth: 265 });

      marker.on("click", () => setActiveId(p.id));
      markersMapRef.current.set(p.id, marker);
    });
  }

  const btnCls = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
      active ? "bg-navy-900 text-white border-navy-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
    }`;

  return (
    <div
      className="flex rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
      style={{ height: "calc(100vh - 190px)", minHeight: 520 }}
    >
      {/* ── LEFT PANEL ── */}
      <div className="w-[300px] flex-shrink-0 flex flex-col bg-gray-50 border-r border-gray-200">
        {/* filters */}
        <div className="p-2.5 border-b border-gray-200 bg-white flex gap-1.5 items-center">
          {(["ALL", "SALE", "RENT"] as FilterType[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={btnCls(filter === f)}>
              {f === "ALL" ? `Всі (${properties.length})` : f === "SALE" ? `Продаж (${saleCount})` : `Оренда (${rentCount})`}
            </button>
          ))}
        </div>

        {/* list — big photo cards */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
          {visible.map((p) => {
            const isSale = p.listingType === "SALE";
            const isActive = activeId === p.id;
            const imgUrl = p.imageUrl
              ? (p.imageUrl.startsWith("http") ? p.imageUrl : cloudinaryUrl(p.imageUrl, { width: 600, quality: 75 }))
              : null;
            const bg = isSale ? "#e05a1e" : "#1a5fc8";

            return (
              <div
                key={p.id}
                data-id={p.id}
                onClick={() => flyTo(p)}
                className={`relative rounded-xl overflow-hidden cursor-pointer flex-shrink-0 transition-all duration-150 ${
                  isActive ? "ring-2 ring-orange-400 shadow-lg scale-[1.01]" : "hover:shadow-md hover:scale-[1.005]"
                }`}
                style={{ height: 180 }}
              >
                {/* photo */}
                {imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-4xl text-gray-300">🏠</div>
                )}

                {/* gradient overlay */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.72) 75%, rgba(0,0,0,0.88) 100%)" }} />

                {/* top badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span
                    className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: bg }}
                  >
                    {isSale ? "Продаж" : "Оренда"}
                  </span>
                  {p.coordsSource !== "exact" && (
                    <span className="bg-black/40 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                      {p.coordsSource === "jk" ? `🏗 ${p.sourceName ?? "ЖК"}` : `📌 ${p.district ?? "Район"}`}
                    </span>
                  )}
                </div>

                {/* bottom text */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="text-white font-bold text-[13px] leading-tight line-clamp-2 mb-1 drop-shadow">
                    {p.titleUk}
                  </div>
                  <div className="font-black text-[15px] leading-none drop-shadow" style={{ color: isSale ? "#fb923c" : "#60a5fa" }}>
                    {shortPrice(p.price, p.currency)}
                  </div>
                  {p.district && (
                    <div className="text-white/70 text-[10px] mt-0.5 flex items-center gap-0.5">
                      <span>📍</span> {p.district}
                    </div>
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
