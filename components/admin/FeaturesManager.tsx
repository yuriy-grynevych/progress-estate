"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";

interface Feature {
  id: string;
  value: string;
  labelUk: string;
  labelEn: string;
  order: number;
}

export default function FeaturesManager({ initialFeatures }: { initialFeatures: Feature[] }) {
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  const [labelUk, setLabelUk] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function addFeature(e: React.FormEvent) {
    e.preventDefault();
    if (!labelUk.trim() || !labelEn.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/features", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelUk: labelUk.trim(), labelEn: labelEn.trim() }),
    });
    if (res.ok) {
      const f = await res.json();
      setFeatures((prev) => [...prev, f]);
      setLabelUk("");
      setLabelEn("");
    } else {
      setError("Помилка додавання");
    }
    setLoading(false);
  }

  async function deleteFeature(id: string) {
    if (!confirm("Видалити цю зручність? Вона зникне зі списку при додаванні нерухомості (у вже збережених об'єктах залишиться).")) return;
    await fetch(`/api/features/${id}`, { method: "DELETE" });
    setFeatures((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Add form */}
      <form onSubmit={addFeature} className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-36">
          <label className="text-xs font-medium text-gray-500 block mb-1">Назва (УКР)</label>
          <input
            value={labelUk}
            onChange={(e) => setLabelUk(e.target.value)}
            placeholder="Джакузі"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
          />
        </div>
        <div className="flex-1 min-w-36">
          <label className="text-xs font-medium text-gray-500 block mb-1">Назва (ENG)</label>
          <input
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
            placeholder="Jacuzzi"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !labelUk.trim() || !labelEn.trim()}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/90 transition disabled:opacity-50 h-[38px]"
        >
          <Plus className="w-4 h-4" />
          Додати
        </button>
      </form>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {features.map((f) => (
          <div key={f.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
            <div>
              <span className="text-sm font-medium text-navy-900">{f.labelUk}</span>
              <span className="text-xs text-gray-400 ml-2">{f.labelEn}</span>
            </div>
            <button
              onClick={() => deleteFeature(f.id)}
              className="text-gray-300 hover:text-red-500 transition ml-2 flex-shrink-0"
              title="Видалити"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
