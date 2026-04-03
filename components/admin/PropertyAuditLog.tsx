"use client";

import { useState } from "react";
import { History, X, ChevronDown, ChevronUp } from "lucide-react";

interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  createdAt: string;
}

const FIELD_LABELS: Record<string, string> = {
  titleUk: "Назва (UA)",
  titleEn: "Назва (EN)",
  price: "Ціна",
  status: "Статус",
  listingType: "Тип угоди",
  type: "Тип нерухомості",
  district: "Район",
  address: "Адреса",
  areaSqm: "Площа",
  rooms: "Кімнати",
  floor: "Поверх",
  assignedUserId: "Агент",
};

export default function PropertyAuditLog({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<AuditEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (logs) { setOpen(!open); return; }
    setLoading(true);
    setOpen(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/audit`);
      const data = await res.json();
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleString("uk-UA", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={load}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2 text-navy-900 font-semibold">
          <History className="w-5 h-5 text-gray-400" />
          Історія змін
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-6 py-4">
          {loading && <p className="text-sm text-gray-400">Завантаження...</p>}
          {logs && logs.length === 0 && (
            <p className="text-sm text-gray-400">Змін не зафіксовано</p>
          )}
          {logs && logs.length > 0 && (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border-l-2 border-gold-200 pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-navy-900">{log.userName}</span>
                    <span className="text-xs text-gray-400">{fmt(log.createdAt)}</span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(log.changes).map(([field, { from, to }]) => (
                      <div key={field} className="text-xs text-gray-600 flex flex-wrap gap-1 items-center">
                        <span className="font-medium text-gray-700">{FIELD_LABELS[field] ?? field}:</span>
                        <span className="bg-red-50 text-red-500 px-1.5 py-0.5 rounded line-through">
                          {String(from ?? "—")}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                          {String(to ?? "—")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
