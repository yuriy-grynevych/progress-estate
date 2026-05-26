"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { cloudinaryUrl } from "@/lib/cloudinary";

export interface MapProperty {
  id: string; slug: string; titleUk: string;
  price: number; currency: string; type: string; listingType: string;
  district: string | null; latitude: number; longitude: number;
  imageUrl: string | null;
  coordsSource: "exact" | "jk" | "district"; sourceName?: string;
  residentialComplex?: string | null;
}

type FilterType = "ALL" | "SALE" | "RENT";

const LABEL_W = 115;
const LABEL_H = 30;
const LABEL_GAP = 8;

function shortPrice(price: number, currency: string) {
  if (currency === "UAH") {
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1).replace(/\.0$/, "")} млн`;
    if (price >= 1000) return `${Math.round(price / 1000)}к`;
  }
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M ${currency}`;
  if (price >= 1000) return `${Math.round(price / 1000)}к ${currency}`;
  return `${price} ${currency}`;
}

function propLabel(p: MapProperty): string {
  return p.residentialComplex || p.sourceName || p.district || "";
}

function loadCss(href: string) {
  if (!document.querySelector(`link[href="${href}"]`)) {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href;
    document.head.appendChild(l);
  }
}
function loadScript(src: string): Promise<void> {
  if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src; s.onload = () => resolve(); s.onerror = () => reject(new Error(`Failed: ${src}`));
    document.head.appendChild(s);
  });
}

type MarkerEntry = {
  marker: any;
  kind: "single" | "cluster";
  dotIcon?: any;
  labelIcon?: any;
  price: number;
  clusterProps?: MapProperty[];
};

export default function PropertiesMap({ properties }: { properties: MapProperty[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const updateLabelsRef = useRef<() => void>(() => {});
  const labelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [filter, setFilter] = useState<FilterType>("ALL");
  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const visible = properties.filter((p) => filter === "ALL" || p.listingType === filter);
  const saleCount = properties.filter((p) => p.listingType === "SALE").length;
  const rentCount = properties.filter((p) => p.listingType === "RENT").length;

  const flyTo = useCallback((p: MapProperty) => {
    if (!mapInstance.current) return;
    mapInstance.current.flyTo([p.latitude, p.longitude], 16, { duration: 0.5 });
    // Find cluster or single marker
    const entry = markersRef.current.get(p.id) ?? markersRef.current.get(`cluster_${p.latitude.toFixed(3)}_${p.longitude.toFixed(3)}`);
    if (entry) setTimeout(() => entry.marker.openPopup(), 550);
    setActiveId(p.id);
  }, []);

  useEffect(() => {
    if (!activeId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-id="${activeId}"]`) as HTMLElement;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeId]);

  function scheduleUpdateLabels(delay = 60) {
    if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
    labelTimerRef.current = setTimeout(() => updateLabelsRef.current(), delay);
  }

  // Show / hide on filter change
  useEffect(() => {
    const map = mapInstance.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    markersRef.current.forEach((entry, key) => {
      if (entry.kind === "cluster") {
        const matchingProps = (entry.clusterProps ?? []).filter(
          (p) => filter === "ALL" || p.listingType === filter
        );
        const show = matchingProps.length > 0;
        const onMap = map.hasLayer(entry.marker);
        if (show) {
          const icon = makeClusterIcon(L, matchingProps.length);
          entry.marker.setIcon(icon);
          entry.marker.setPopupContent(makeClusterPopup(matchingProps));
          if (!onMap) entry.marker.addTo(map);
        } else if (!show && onMap) {
          entry.marker.remove();
        }
      } else {
        const p = properties.find((x) => x.id === key);
        if (!p) return;
        const show = filter === "ALL" || p.listingType === filter;
        const onMap = map.hasLayer(entry.marker);
        if (show && !onMap) entry.marker.addTo(map);
        else if (!show && onMap) entry.marker.remove();
      }
    });
    scheduleUpdateLabels();
  }, [filter, properties]); // eslint-disable-line react-hooks/exhaustive-deps

  function makeClusterIcon(L: any, count: number) {
    return L.divIcon({
      className: "",
      html: `<div style="width:46px;height:46px;border-radius:50%;background:#111827;color:#fff;font:800 14px/1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;border:3px solid rgba(255,255,255,0.95);box-shadow:0 3px 16px rgba(0,0,0,0.55);">+${count}</div>`,
      iconSize: [46, 46],
      iconAnchor: [23, 23],
      popupAnchor: [0, -27],
    });
  }

  function makeClusterPopup(group: MapProperty[]): string {
    const header = propLabel(group[0]);
    const rows = group.map((p) => {
      const loc = propLabel(p);
      const isSale = p.listingType === "SALE";
      const priceColor = isSale ? "#e05a1e" : "#1a5fc8";
      return `<a href="/admin/properties/${p.id}" style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f3f4f6;text-decoration:none;gap:8px;">
        <div style="flex:1;min-width:0;">
          ${loc ? `<div style="font-size:11px;font-weight:700;color:#111827;margin-bottom:1px;">${loc}</div>` : ""}
          <div style="font-size:11px;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.titleUk}</div>
        </div>
        <div style="font-size:13px;font-weight:800;color:${priceColor};flex-shrink:0;">${shortPrice(p.price, p.currency)}</div>
      </a>`;
    }).join("");
    return `<div style="min-width:220px;max-width:265px;font-family:system-ui,sans-serif;padding:2px 0;">
      <div style="font-size:11px;font-weight:700;color:#9ca3af;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em;">${header ? header + " · " : ""}${group.length} квартир</div>
      ${rows}
    </div>`;
  }

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    let cancelled = false;

    async function init() {
      try {
        loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
        await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
        if (cancelled || !mapRef.current) return;

        const L = (window as any).L;
        if (!L) return;
        leafletRef.current = L;

        const container = mapRef.current as any;
        if (container._leaflet_id) container._leaflet_id = undefined;

        const map = L.map(mapRef.current, { zoomControl: false }).setView([48.9226, 24.7111], 13);
        mapInstance.current = map;

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: "© OpenStreetMap | © CARTO",
          subdomains: "abcd", maxZoom: 19,
        }).addTo(map);
        L.control.zoom({ position: "bottomleft" }).addTo(map);

        buildMarkers(L, map, properties);

        const exact = properties.filter((p) => p.coordsSource === "exact");
        const fit = exact.length > 0 ? exact : properties;
        if (fit.length > 0) {
          const bounds = L.latLngBounds(fit.map((p) => [p.latitude, p.longitude]));
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }

        function updateLabels() {
          const entries: Array<{ entry: MarkerEntry; x: number; y: number }> = [];
          markersRef.current.forEach((entry, key) => {
            if (entry.kind === "cluster") return; // clusters always show their badge
            if (!map.hasLayer(entry.marker)) return;
            const pt = map.latLngToContainerPoint(entry.marker.getLatLng());
            entries.push({ entry, x: pt.x, y: pt.y });
          });
          entries.sort((a, b) => b.entry.price - a.entry.price);

          const placed: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
          const hits = (a: { x1: number; y1: number; x2: number; y2: number }) =>
            placed.some((b) => !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2));
          const ANCHOR_Y = LABEL_H + 11;

          entries.forEach(({ entry, x, y }) => {
            const labelBox = {
              x1: x - LABEL_W / 2 - LABEL_GAP, y1: y - ANCHOR_Y - LABEL_GAP,
              x2: x + LABEL_W / 2 + LABEL_GAP, y2: y - 11 + LABEL_GAP,
            };
            const dotBox = { x1: x - 9, y1: y - 9, x2: x + 9, y2: y + 9 };
            if (!hits(labelBox)) {
              entry.marker.setIcon(entry.labelIcon);
              entry.marker.setZIndexOffset(500);
              placed.push(labelBox, dotBox);
            } else {
              entry.marker.setIcon(entry.dotIcon);
              entry.marker.setZIndexOffset(0);
              placed.push(dotBox);
            }
          });
        }

        updateLabelsRef.current = updateLabels;
        map.on("zoomend moveend", () => scheduleUpdateLabels(80));
        setTimeout(updateLabels, 600);
        setTimeout(() => { if (mapInstance.current) mapInstance.current.invalidateSize(); }, 200);
      } catch (err) {
        console.error("[Map] init error:", err);
      }
    }

    init();
    return () => {
      cancelled = true;
      if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildMarkers(L: any, map: any, props: MapProperty[]) {
    // Group by location (3 decimal places ≈ 100 m grid)
    const groups = new Map<string, MapProperty[]>();
    props.forEach((p) => {
      const k = `${p.latitude.toFixed(3)}_${p.longitude.toFixed(3)}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(p);
    });

    groups.forEach((group, locKey) => {
      if (group.length >= 2) {
        // ── Cluster marker ─────────────────────────────────────────
        const lat = group.reduce((s, p) => s + p.latitude, 0) / group.length;
        const lng = group.reduce((s, p) => s + p.longitude, 0) / group.length;

        const icon = makeClusterIcon(L, group.length);
        const popup = makeClusterPopup(group);
        const marker = L.marker([lat, lng], { icon }).bindPopup(popup, { maxWidth: 280 });
        marker.on("click", () => setActiveId(group[0].id));

        const clusterKey = `cluster_${locKey}`;
        markersRef.current.set(clusterKey, {
          marker, kind: "cluster",
          price: Math.max(...group.map((p) => p.price)),
          clusterProps: group,
        });
        // Map each property ID → cluster key so flyTo can find the marker
        group.forEach((p) => {
          markersRef.current.set(p.id, {
            marker, kind: "cluster",
            price: p.price,
            clusterProps: group,
          });
        });
        marker.addTo(map);
      } else {
        // ── Single property marker ──────────────────────────────────
        const p = group[0];
        const isSale = p.listingType === "SALE";
        const bg = isSale ? "#e05a1e" : "#1a5fc8";
        const label = shortPrice(p.price, p.currency);

        const dotIcon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${bg};border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.45);"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -10],
        });
        const labelIcon = L.divIcon({
          className: "",
          html: `<div style="width:${LABEL_W}px;height:${LABEL_H}px;display:flex;align-items:center;justify-content:center;background:${bg};color:#fff;border-radius:5px;font:800 13px/1 system-ui,sans-serif;text-align:center;border:2.5px solid rgba(255,255,255,0.95);box-shadow:0 2px 12px rgba(0,0,0,0.55);box-sizing:border-box;">${label}</div>`,
          iconSize: [LABEL_W, LABEL_H],
          iconAnchor: [Math.round(LABEL_W / 2), LABEL_H + 11],
          popupAnchor: [0, -(LABEL_H + 14)],
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

        const marker = L.marker([p.latitude, p.longitude], { icon: dotIcon }).bindPopup(popup, { maxWidth: 265 });
        marker.on("click", () => setActiveId(p.id));
        markersRef.current.set(p.id, { marker, kind: "single", dotIcon, labelIcon, price: p.price });
        marker.addTo(map);
      }
    });
  }

  const btnCls = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active ? "bg-navy-900 text-white border-navy-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`;

  return (
    <div className="flex rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-full" style={{ minHeight: 480 }}>
      {/* LEFT PANEL */}
      <div className="w-[300px] flex-shrink-0 flex flex-col bg-gray-50 border-r border-gray-200">
        <div className="p-2.5 border-b border-gray-200 bg-white flex gap-1.5 items-center flex-wrap">
          {(["ALL", "SALE", "RENT"] as FilterType[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={btnCls(filter === f)}>
              {f === "ALL" ? `Всі (${properties.length})` : f === "SALE" ? `Продаж (${saleCount})` : `Оренда (${rentCount})`}
            </button>
          ))}
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
          {visible.map((p) => {
            const isSale = p.listingType === "SALE";
            const isActive = activeId === p.id;
            const imgUrl = p.imageUrl
              ? (p.imageUrl.startsWith("http") ? p.imageUrl : cloudinaryUrl(p.imageUrl, { width: 600, quality: 75 }))
              : null;
            const bg = isSale ? "#e05a1e" : "#1a5fc8";
            const loc = propLabel(p);
            return (
              <div
                key={p.id} data-id={p.id} onClick={() => flyTo(p)}
                className={`relative rounded-xl overflow-hidden cursor-pointer flex-shrink-0 transition-all duration-150 ${isActive ? "ring-2 ring-orange-400 shadow-lg scale-[1.01]" : "hover:shadow-md hover:scale-[1.005]"}`}
                style={{ height: 180 }}
              >
                {imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-4xl text-gray-300">🏠</div>
                )}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom,rgba(0,0,0,0.08) 0%,rgba(0,0,0,0) 35%,rgba(0,0,0,0.72) 75%,rgba(0,0,0,0.88) 100%)" }} />
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: bg }}>
                    {isSale ? "Продаж" : "Оренда"}
                  </span>
                  {loc && (
                    <span className="bg-black/40 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm truncate max-w-[120px]">
                      {loc}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="text-white font-bold text-[13px] leading-tight line-clamp-2 mb-1 drop-shadow">{p.titleUk}</div>
                  <div className="font-black text-[15px] leading-none drop-shadow" style={{ color: isSale ? "#fb923c" : "#60a5fa" }}>
                    {shortPrice(p.price, p.currency)}
                  </div>
                  {p.district && (
                    <div className="text-white/70 text-[10px] mt-0.5">📍 {p.district}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAP */}
      <div ref={mapRef} className="flex-1" />
    </div>
  );
}
