"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

export default function InquiryAssignSelect({
  id,
  currentAgentId,
  agents,
}: {
  id: string;
  currentAgentId: string | null;
  agents: Agent[];
}) {
  const router = useRouter();
  const [agentId, setAgentId] = useState(currentAgentId ?? "");
  const [loading, setLoading] = useState(false);

  async function handleChange(newAgentId: string) {
    setLoading(true);
    setAgentId(newAgentId);
    await fetch(`/api/inquiries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedUserId: newAgentId || null }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <select
      value={agentId}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className="text-xs font-medium px-2 py-1 rounded-full border border-gray-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy-900 disabled:opacity-50"
    >
      <option value="">— Не призначено —</option>
      {agents.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name ?? a.email}
        </option>
      ))}
    </select>
  );
}
