"use client";
import { useEffect, useRef } from "react";

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
};

export default function PropertiesMap({ properties }: { properties: MapProperty[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import("leaflet").then((L) => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current!).setView([48.9226, 24.7111], 13);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      properties.forEach((p) => {
        const listType = p.listingType === "SALE" ? "Продаж" : "Оренда";
        const propType = typeLabels[p.type] ?? p.type;
        const price = `${Number(p.price).toLocaleString("uk-UA")} ${p.currency}`;
        const bgColor = p.listingType === "SALE" ? "#0a1628" : "#d4a017";
        const textColor = p.listingType === "SALE" ? "#ffffff" : "#0a1628";

        const icon = L.divIcon({
          html: `<div style="background:${bgColor};color:${textColor};padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.35);border:2px solid white;line-height:1.4;">${price}</div>`,
          iconAnchor: [40, 14],
          className: "",
        });

        const imgHtml = p.imageUrl
          ? `<img src="${p.imageUrl}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:8px;display:block;" />`
          : "";

        const popupHtml = `
          <div style="min-width:190px;max-width:230px;font-family:system-ui,sans-serif;">
            ${imgHtml}
            <div style="font-size:10px;color:#d4a017;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:3px;">${propType} · ${listType}</div>
            <div style="font-size:13px;font-weight:700;color:#0a1628;line-height:1.3;margin-bottom:5px;">${p.titleUk}</div>
            <div style="font-size:15px;font-weight:800;color:#0a1628;margin-bottom:5px;">${price}</div>
            ${p.district ? `<div style="font-size:11px;color:#6b7280;margin-bottom:8px;">📍 ${p.district}</div>` : ""}
            <div style="display:flex;gap:6px;">
              <a href="/admin/properties/${p.id}" style="flex:1;background:#0a1628;color:white;text-decoration:none;font-size:11px;font-weight:600;padding:5px 8px;border-radius:7px;text-align:center;">✏️ Ред.</a>
              <a href="/uk/listings/${p.slug}" target="_blank" rel="noopener" style="flex:1;background:#d4a017;color:#0a1628;text-decoration:none;font-size:11px;font-weight:600;padding:5px 8px;border-radius:7px;text-align:center;">На сайті →</a>
            </div>
          </div>
        `;

        L.marker([p.latitude, p.longitude], { icon })
          .addTo(map)
          .bindPopup(popupHtml, { maxWidth: 250, className: "property-popup" });
      });

      if (properties.length > 0) {
        const bounds = L.latLngBounds(properties.map((p) => [p.latitude, p.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
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

  return (
    <div
      ref={mapRef}
      style={{ height: "calc(100vh - 180px)", minHeight: 500 }}
      className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
    />
  );
}
