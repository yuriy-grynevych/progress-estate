"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteCollectionButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Видалити колекцію?")) return;
    setLoading(true);
    try {
      await fetch(`/api/collections/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-gray-400 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
      title="Видалити колекцію"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
