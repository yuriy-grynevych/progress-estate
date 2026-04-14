"use client";
import { useEffect, useRef } from "react";

export default function PropertyMap({
  lat,
  lng,
  title,
}: {
  lat: number;
  lng: number;
  title: string;
}) {
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

      const map = L.map(mapRef.current!).setView([lat, lng], 15);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.divIcon({
        html: `<div style="background:#0a1628;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #d4af37;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        className: "",
      });

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<strong>${title}</strong>`)
        .openPopup();
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lng, title]);

  return (
    <div>
      <div
        ref={mapRef}
        style={{ height: 300 }}
        className="rounded-xl overflow-hidden"
      />
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-3 text-sm text-gold-500 hover:text-gold-600 font-medium"
      >
        Відкрити в Google Maps →
      </a>
    </div>
  );
}
