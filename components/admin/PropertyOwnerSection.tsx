"use client";

import { useState } from "react";
import { Phone, Mail, User, Link2, X, Search, Plus } from "lucide-react";

interface OwnerContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  source: string | null;
}

interface Props {
  propertyId: string;
  currentOwner: OwnerContact | null;
}

type PanelMode = "search" | "create" | null;

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("380") ? digits.slice(3) : digits;
}

export default function PropertyOwnerSection({ propertyId, currentOwner }: Props) {
  const [owner, setOwner] = useState<OwnerContact | null>(currentOwner);
  const [panel, setPanel] = useState<PanelMode>(null);

  // Search state
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<OwnerContact[]>([]);
  const [searching, setSearching] = useState(false);

  // Create state
  const [createForm, setCreateForm] = useState({ name: "", phone: "", notes: "" });
  const [createError, setCreateError] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function doSearch(q: string) {
    setSearch(q);
    if (!q || q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/contacts?type=OWNER&search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.slice(0, 8));
    } finally {
      setSearching(false);
    }
  }

  async function linkOwner(contact: OwnerContact | null) {
    setSaving(true);
    try {
      await fetch(`/api/properties/${propertyId}/owner`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerContactId: contact?.id ?? null }),
      });
      setOwner(contact);
      closePanel();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setSaving(true);
    setCreateError("");
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "OWNER",
          name: createForm.name.trim(),
          phone: createForm.phone || null,
          notes: createForm.notes || null,
        }),
      });
      if (res.status === 409) {
        setCreateError("Власник з таким телефоном вже є в базі!");
        return;
      }
      if (!res.ok) throw new Error();
      const created: OwnerContact = await res.json();
      await linkOwner(created);
    } catch {
      setCreateError("Не вдалося створити власника");
    } finally {
      setSaving(false);
    }
  }

  function closePanel() {
    setPanel(null);
    setSearch("");
    setResults([]);
    setCreateForm({ name: "", phone: "", notes: "" });
    setCreateError("");
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
          <User className="w-5 h-5 text-gray-400" />
          Власник об'єкта
        </h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-green-600 text-sm font-medium">Збережено ✓</span>}
          {!panel && (
            <>
              <button
                onClick={() => setPanel("search")}
                className="flex items-center gap-1.5 text-xs text-navy-700 hover:text-navy-900 border border-gray-200 px-3 py-1.5 rounded-lg transition"
              >
                <Link2 className="w-3.5 h-3.5" />
                {owner ? "Змінити" : "Прив'язати"}
              </button>
              <button
                onClick={() => setPanel("create")}
                className="flex items-center gap-1.5 text-xs text-navy-700 hover:text-navy-900 border border-gray-200 px-3 py-1.5 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Новий власник
              </button>
              {owner && (
                <button
                  onClick={() => linkOwner(null)}
                  className="text-xs text-red-400 hover:text-red-600 border border-gray-200 px-3 py-1.5 rounded-lg transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Search panel */}
      {panel === "search" && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => doSearch(e.target.value)}
              placeholder="Пошук власника за ім'ям або телефоном..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-navy-400 bg-white"
            />
          </div>
          {searching && <p className="text-xs text-gray-400 px-1">Пошук...</p>}
          {results.length > 0 && (
            <div className="space-y-1 mt-1">
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => linkOwner(c)}
                  disabled={saving}
                  className="w-full text-left px-3 py-2 text-sm bg-white hover:bg-navy-50 rounded-lg border border-gray-100 transition"
                >
                  <span className="font-medium text-navy-900">{c.name}</span>
                  {c.phone && <span className="text-gray-400 ml-2">{c.phone}</span>}
                </button>
              ))}
            </div>
          )}
          {search.length >= 2 && !searching && results.length === 0 && (
            <p className="text-xs text-gray-400 px-1">Нічого не знайдено</p>
          )}
          <button onClick={closePanel} className="mt-2 text-xs text-gray-400 hover:text-gray-600">
            Скасувати
          </button>
        </div>
      )}

      {/* Create panel */}
      {panel === "create" && (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 mb-3">Новий власник</p>
          <form onSubmit={handleCreate} className="space-y-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ім'я *</label>
              <input
                autoFocus
                required
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ім'я та прізвище"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Телефон</label>
              <input
                value={createForm.phone}
                onChange={(e) => setCreateForm((f) => ({ ...f, phone: normalizePhone(e.target.value) }))}
                placeholder="0671234567"
                inputMode="numeric"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Нотатки</label>
              <input
                value={createForm.notes}
                onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Додаткова інформація..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy-400"
              />
            </div>
            {createError && <p className="text-red-500 text-xs">{createError}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={closePanel}
                className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-white transition"
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={saving || !createForm.name.trim()}
                className="flex-1 px-3 py-2 text-sm font-semibold bg-navy-900 text-white rounded-xl hover:bg-navy-800 disabled:opacity-40 transition"
              >
                {saving ? "Збереження..." : "Створити і прив'язати"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Owner info */}
      {owner ? (
        <div className="space-y-2">
          <p className="font-semibold text-navy-900">{owner.name}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {owner.phone && (
              <a href={`tel:${owner.phone}`} className="flex items-center gap-1.5 hover:text-navy-700">
                <Phone className="w-4 h-4 text-gray-400" />
                {owner.phone}
              </a>
            )}
            {owner.email && (
              <a href={`mailto:${owner.email}`} className="flex items-center gap-1.5 hover:text-navy-700">
                <Mail className="w-4 h-4 text-gray-400" />
                {owner.email}
              </a>
            )}
          </div>
          {owner.notes && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mt-1">
              {owner.notes}
            </p>
          )}
          {owner.source && (
            <p className="text-xs text-gray-400">Джерело: {owner.source}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Власника не прив'язано</p>
      )}
    </div>
  );
}
