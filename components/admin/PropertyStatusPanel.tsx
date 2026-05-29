"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const STATUSES = [
  { key: "ACTIVE",   label: "Активне",   dot: "bg-green-500", cls: "bg-green-100 text-green-700 border-green-300" },
  { key: "INACTIVE", label: "Неактивне", dot: "bg-gray-400",  cls: "bg-gray-100 text-gray-600 border-gray-300" },
  { key: "DEPOSIT",  label: "Завдаток",  dot: "bg-amber-500", cls: "bg-amber-100 text-amber-700 border-amber-300" },
  { key: "SOLD",     label: "Продано",   dot: "bg-red-500",   cls: "bg-red-100 text-red-600 border-red-300" },
  { key: "RENTED",   label: "Здано",     dot: "bg-blue-500",  cls: "bg-blue-100 text-blue-700 border-blue-300" },
];

export interface LastStatusChange {
  userName: string;
  photoUrl?: string | null;
  accentColor?: string | null;
  changedAt: string;
}

interface Props {
  propertyId: string;
  currentStatus: string;
  lastChange: LastStatusChange | null;
}

export default function PropertyStatusPanel({ propertyId, currentStatus, lastChange }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState<string | null>(null);

  async function changeStatus(newStatus: string) {
    if (newStatus === status || loading) return;
    setLoading(newStatus);
    await fetch(`/api/properties/${propertyId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatus(newStatus);
    setLoading(null);
    router.refresh();
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gold-300">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Статус</p>
      <div className="grid grid-cols-2 gap-2">
        {STATUSES.map((s) => {
          const isActive = status === s.key;
          return (
            <button
              key={s.key}
              onClick={() => changeStatus(s.key)}
              disabled={loading !== null}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                isActive
                  ? `${s.cls} ring-2 ring-offset-1 ring-current`
                  : "bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600"
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
              {loading === s.key ? "..." : s.label}
            </button>
          );
        })}
      </div>
      {lastChange && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-3">
          <div
            className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: lastChange.accentColor ?? "#C9A84C" }}
          >
            {lastChange.photoUrl ? (
              <Image
                src={lastChange.photoUrl}
                alt={lastChange.userName}
                width={24}
                height={24}
                className="object-cover object-top w-full h-full"
                unoptimized
              />
            ) : (
              <span>{lastChange.userName[0]?.toUpperCase() ?? "?"}</span>
            )}
          </div>
          <span>
            <span className="font-medium text-gray-600">{lastChange.userName}</span>
            {" · "}
            {fmtDate(lastChange.changedAt)}
          </span>
        </div>
      )}
    </div>
  );
}
