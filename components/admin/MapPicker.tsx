"use client";
import { useEffect, useRef } from "react";

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

const DEFAULT_LAT = 48.9226;
const DEFAULT_LNG = 24.7111;

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import("leaflet").then((L) => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const initLat = lat ?? DEFAULT_LAT;
      const initLng = lng ?? DEFAULT_LNG;

      const map = L.map(mapRef.current!).setView([initLat, initLng], lat ? 15 : 13);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.divIcon({
        html: `<div style="background:#0a1628;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #c99383;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        className: "",
      });

      if (lat && lng) {
        const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
        markerRef.current = marker;
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onChange(Math.round(pos.lat * 1e6) / 1e6, Math.round(pos.lng * 1e6) / 1e6);
        });
      }

      map.on("click", (e: any) => {
        const { lat: cLat, lng: cLng } = e.latlng;
        const roundedLat = Math.round(cLat * 1e6) / 1e6;
        const roundedLng = Math.round(cLng * 1e6) / 1e6;

        if (markerRef.current) {
          markerRef.current.setLatLng([roundedLat, roundedLng]);
        } else {
          const marker = L.marker([roundedLat, roundedLng], { icon, draggable: true }).addTo(map);
          markerRef.current = marker;
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            onChange(Math.round(pos.lat * 1e6) / 1e6, Math.round(pos.lng * 1e6) / 1e6);
          });
        }
        onChange(roundedLat, roundedLng);
      });
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div
        ref={mapRef}
        style={{ height: 300 }}
        className="rounded-xl overflow-hidden border border-gray-200"
      />
      <p className="text-xs text-gray-400 mt-2">
        Клікніть на карті щоб встановити місцезнаходження. Маркер можна перетягувати.
      </p>
    </div>
  );
}
