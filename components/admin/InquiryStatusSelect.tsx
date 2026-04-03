"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statuses = [
  { value: "NEW", label: "Нове", color: "bg-blue-100 text-blue-700" },
  { value: "READ", label: "Прочитане", color: "bg-gray-100 text-gray-600" },
  { value: "REPLIED", label: "Відповідь", color: "bg-green-100 text-green-700" },
  { value: "ARCHIVED", label: "Архів", color: "bg-red-100 text-red-600" },
];

export default function InquiryStatusSelect({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleChange(newStatus: string) {
    setLoading(true);
    setStatus(newStatus);
    await fetch(`/api/inquiries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  const current = statuses.find((s) => s.value === status);

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy-900 ${
        current?.color ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {statuses.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
