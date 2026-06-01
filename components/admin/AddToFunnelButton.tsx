"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitMerge } from "lucide-react";

export default function AddToFunnelButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function addToFunnel() {
    setLoading(true);
    try {
      await fetch(`/api/inquiries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inFunnel: true }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={addToFunnel}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-navy-200 text-navy-700 hover:bg-navy-50 transition disabled:opacity-50"
      title="Додати до воронки продажів"
    >
      <GitMerge className="w-3.5 h-3.5" />
      {loading ? "..." : "До воронки"}
    </button>
  );
}
