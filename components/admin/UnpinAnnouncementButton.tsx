"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UnpinAnnouncementButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUnpin() {
    setLoading(true);
    await fetch("/api/admin/chat/pin", { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleUnpin}
      disabled={loading}
      title="Відкріпити оголошення"
      className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition disabled:opacity-50"
    >
      <X className="w-4 h-4 text-white/60 hover:text-white" />
    </button>
  );
}
