"use client";
import { useState } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

interface District {
  id: string;
  value: string;
  labelUk: string;
  labelEn: string;
  order: number;
}

export default function DistrictsManager({ initialDistricts }: { initialDistricts: District[] }) {
  const [districts, setDistricts] = useState<District[]>(initialDistricts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<District>>({});
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState({ value: "", labelUk: "", labelEn: "", order: 0 });
  const [saving, setSaving] = useState(false);

  async function saveEdit(d: District) {
    setSaving(true);
    await fetch("/api/districts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: d.id, ...editForm }),
    });
    setDistricts((prev) => prev.map((x) => (x.id === d.id ? { ...x, ...editForm } as District : x)));
    setEditingId(null);
    setSaving(false);
  }

  async function deleteDistrict(id: string) {
    if (!confirm("Видалити район?")) return;
    await fetch("/api/districts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDistricts((prev) => prev.filter((x) => x.id !== id));
  }

  async function addDistrict() {
    if (!newForm.value || !newForm.labelUk) return;
    setSaving(true);
    const res = await fetch("/api/districts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (res.ok) {
      const reloaded = await fetch("/api/districts").then((r) => r.json());
      setDistricts(reloaded);
      setNewForm({ value: "", labelUk: "", labelEn: "", order: 0 });
      setAdding(false);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 font-medium">
              <th className="px-4 py-2.5">Назва (UA)</th>
              <th className="px-4 py-2.5">Назва (EN)</th>
              <th className="px-4 py-2.5">Ключ</th>
              <th className="px-4 py-2.5 w-10">Порядок</th>
              <th className="px-4 py-2.5 text-right">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {districts.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50 transition">
                {editingId === d.id ? (
                  <>
                    <td className="px-3 py-2">
                      <input value={editForm.labelUk ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, labelUk: e.target.value }))}
                        className="w-full border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-navy-900" />
                    </td>
                    <td className="px-3 py-2">
                      <input value={editForm.labelEn ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, labelEn: e.target.value }))}
                        className="w-full border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-navy-900" />
                    </td>
                    <td className="px-3 py-2">
                      <input value={editForm.value ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, value: e.target.value }))}
                        className="w-full border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-navy-900 font-mono" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={editForm.order ?? 0} onChange={(e) => setEditForm((f) => ({ ...f, order: Number(e.target.value) }))}
                        className="w-16 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-navy-900" />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => saveEdit(d)} disabled={saving} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition"><X className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 font-medium text-navy-900">{d.labelUk}</td>
                    <td className="px-4 py-2.5 text-gray-500">{d.labelEn}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{d.value}</td>
                    <td className="px-4 py-2.5 text-gray-400">{d.order}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditingId(d.id); setEditForm({ value: d.value, labelUk: d.labelUk, labelEn: d.labelEn, order: d.order }); }}
                          className="p-1.5 text-gray-400 hover:text-navy-900 hover:bg-gray-100 rounded-lg transition"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteDistrict(d.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {adding && (
              <tr className="bg-gold-50">
                <td className="px-3 py-2">
                  <input value={newForm.labelUk} onChange={(e) => setNewForm((f) => ({ ...f, labelUk: e.target.value }))}
                    placeholder="Назва UA" className="w-full border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-navy-900" />
                </td>
                <td className="px-3 py-2">
                  <input value={newForm.labelEn} onChange={(e) => setNewForm((f) => ({ ...f, labelEn: e.target.value }))}
                    placeholder="Name EN" className="w-full border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-navy-900" />
                </td>
                <td className="px-3 py-2">
                  <input value={newForm.value} onChange={(e) => setNewForm((f) => ({ ...f, value: e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
                    placeholder="klucz_wartosci" className="w-full border rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-navy-900" />
                </td>
                <td className="px-3 py-2">
                  <input type="number" value={newForm.order} onChange={(e) => setNewForm((f) => ({ ...f, order: Number(e.target.value) }))}
                    className="w-16 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-navy-900" />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={addDistrict} disabled={saving || !newForm.value || !newForm.labelUk}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-40"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setAdding(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition"><X className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!adding && (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-navy-900 transition px-2 py-1.5">
          <Plus className="w-4 h-4" /> Додати район
        </button>
      )}
    </div>
  );
}
