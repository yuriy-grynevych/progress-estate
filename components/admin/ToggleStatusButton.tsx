"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  field: "status" | "isFeatured";
  currentValue: string | boolean;
}

export default function ToggleStatusButton({ id, field, currentValue }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    let body: Record<string, unknown>;

    if (field === "status") {
      body = { status: currentValue === "ACTIVE" ? "INACTIVE" : "ACTIVE" };
    } else {
      body = { isFeatured: !currentValue };
    }

    await fetch(`/api/properties/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    router.refresh();
  }

  if (field === "status") {
    const isActive = currentValue === "ACTIVE";
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={`text-xs font-medium px-2.5 py-1 rounded-full transition ${
          isActive
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      >
        {loading ? "..." : isActive ? "Активне" : "Неактивне"}
      </button>
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
