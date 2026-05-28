"use client";
import { useState } from "react";
import { Save, Check } from "lucide-react";

interface Props {
  initial: { target: string; label: string; from: string };
}

export default function SalesPlanForm({ initial }: Props) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/company-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales_plan_target: values.target,
          sales_plan_label: values.label,
          sales_plan_from: values.from,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Ціль (кількість продажів)</label>
          <input
            type="number" min="0"
            value={values.target}
            onChange={(e) => setValues((v) => ({ ...v, target: e.target.value }))}
            placeholder="26"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 transition"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Опис плану</label>
          <input
            type="text"
            value={values.label}
            onChange={(e) => setValues((v) => ({ ...v, label: e.target.value }))}
            placeholder="Квартальний план Q2 2026"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 transition"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Рахувати з дати</label>
          <input
            type="date"
            value={values.from}
            onChange={(e) => setValues((v) => ({ ...v, from: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 transition"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50"
      >
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "Збережено!" : saving ? "Збереження..." : "Зберегти план"}
      </button>
    </div>
  );
}
