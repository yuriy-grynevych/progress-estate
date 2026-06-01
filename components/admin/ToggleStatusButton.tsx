"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const STATUS_CONFIG: Record<string, { label: string; cls: string; toggle?: boolean }> = {
  ACTIVE:   { label: "Активне",   cls: "bg-green-100 text-green-700 hover:bg-green-200", toggle: true },
  INACTIVE: { label: "Неактивне", cls: "bg-gray-100 text-gray-500 hover:bg-gray-200",   toggle: true },
  SOLD:     { label: "Продано",   cls: "bg-red-100 text-red-600 cursor-default" },
  RENTED:   { label: "Здано",     cls: "bg-blue-100 text-blue-600 cursor-default" },
  DEPOSIT:  { label: "Завдаток",  cls: "bg-amber-100 text-amber-700 cursor-default" },
};

interface Changer {
  userName: string;
  photoUrl?: string | null;
  accentColor?: string | null;
}

interface Props {
  id: string;
  field: "status" | "isFeatured";
  currentValue: string | boolean;
  isFeatured?: boolean;
  changer?: Changer | null;
}

export default function ToggleStatusButton({ id, field, currentValue, isFeatured, changer }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const cfg = STATUS_CONFIG[currentValue as string];
    if (!cfg?.toggle) return;
    setLoading(true);
    if (field === "status") {
      const newStatus = currentValue === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await fetch(`/api/properties/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } else {
      await fetch(`/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !currentValue }),
      });
    }
    setLoading(false);
    router.refresh();
  }

  if (field === "status") {
    const cfg = STATUS_CONFIG[currentValue as string] ?? STATUS_CONFIG.INACTIVE;
    const changerColor = changer?.accentColor ?? "#C9A84C";
    return (
      <div className="flex flex-col gap-1 items-start">
        <button
          onClick={toggle}
          disabled={loading || !cfg.toggle}
          title={cfg.toggle ? "Натисніть для зміни" : undefined}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition ${cfg.cls}`}
        >
          {loading ? "..." : cfg.label}
          {changer && currentValue !== "ACTIVE" && (
            <>
              <div
                className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
                style={{ backgroundColor: changerColor }}
                title={changer.userName}
              >
                {changer.photoUrl ? (
                  <Image src={changer.photoUrl} alt={changer.userName} width={14} height={14} className="object-cover object-top w-full h-full" unoptimized />
                ) : (
                  changer.userName[0]?.toUpperCase() ?? "?"
                )}
              </div>
              <span className="font-medium">{changer.userName}</span>
            </>
          )}
        </button>
        {currentValue === "ACTIVE" && isFeatured && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-600">
            🔥 Гаряча пропозиція
          </span>
        )}
      </div>
    );
  }

  const featured = Boolean(currentValue);
  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-medium px-2.5 py-1 rounded-full transition ${
        featured
          ? "bg-gold-100 text-gold-700 hover:bg-gold-200"
          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
      }`}
    >
      {loading ? "..." : featured ? "★ Виділене" : "☆ Звичайне"}
    </button>
  );
}
