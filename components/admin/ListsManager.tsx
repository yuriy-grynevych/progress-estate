"use client";

import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";

interface ListsManagerProps {
  initialJk: string[];
  initialDevelopers: string[];
  initialStreets: string[];
}

function EditableList({
  title,
  description,
  items,
  onChange,
}: {
  title: string;
  description: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [newItem, setNewItem] = useState("");
  const [search, setSearch] = useState("");

  const filtered = search
    ? items.filter(i => i.toLowerCase().includes(search.toLowerCase()))
    : items;

  function add() {
    const v = newItem.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v].sort((a, b) => a.localeCompare(b, "uk")));
    setNewItem("");
  }

  function remove(item: string) {
    onChange(items.filter(i => i !== item));
  }

  return (
    <div>
      <h3 className="font-semibold text-navy-900 text-sm mb-0.5">{title}</h3>
      <p className="text-xs text-gray-400 mb-3">{description} — {items.length} шт.</p>

      {/* Add new */}
      <div className="flex gap-2 mb-3">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="Додати новий..."
          className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy-400 bg-white"
        />
        <button
          type="button"
          onClick={add}
          disabled={!newItem.trim()}
          className="px-3 py-1.5 bg-navy-900 text-white text-sm rounded-lg hover:bg-navy-800 disabled:opacity-40 transition flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Пошук..."
        className="w-full px-3 py-1.5 text-sm border border-gray-100 rounded-lg focus:outline-none focus:border-gray-300 bg-gray-50 mb-2"
      />

      {/* List */}
      <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">Нічого не знайдено</p>
        )}
        {filtered.map(item => (
          <div key={item} className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 group">
            <span className="text-sm text-navy-900">{item}</span>
            <button
              type="button"
              onClick={() => remove(item)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ListsManager({ initialJk, initialDevelopers, initialStreets }: ListsManagerProps) {
  const [jk, setJk] = useState<string[]>(initialJk);
  const [developers, setDevelopers] = useState<string[]>(initialDevelopers);
  const [streets, setStreets] = useState<string[]>(initialStreets);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/company-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jk_list: JSON.stringify(jk),
          developers_list: JSON.stringify(developers),
          streets_list: JSON.stringify(streets),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EditableList
          title="ЖК (житлові комплекси)"
          description="Список ЖК у фільтрах та формі нерухомості"
          items={jk}
          onChange={setJk}
        />
        <EditableList
          title="Забудовники"
          description="Список забудовників у фільтрах"
          items={developers}
          onChange={setDevelopers}
        />
        <EditableList
          title="Вулиці"
          description="Підказки при автозаповненні адреси"
          items={streets}
          onChange={setStreets}
        />
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 disabled:opacity-50 transition"
      >
        <Save className="w-4 h-4" />
        {saving ? "Збереження..." : saved ? "Збережено ✓" : "Зберегти списки"}
      </button>
    </div>
  );
}
