"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Phone, Mail, User, Trash2, Edit2, X, Check,
  ChevronDown, Calendar, MessageSquare, Filter
} from "lucide-react";

type Agent = { id: string; name: string | null; email: string };

type Contact = {
  id: string;
  type: "CLIENT" | "OWNER";
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  source: string | null;
  followUpAt: string | null;
  followUpSent: boolean;
  createdAt: string;
  assignedUser: { id: string; name: string | null; email: string } | null;
};

interface Props {
  initialContacts: Contact[];
  agents: Agent[];
  role: "ADMIN" | "EMPLOYEE";
  currentUserId: string;
}

const EMPTY_FORM = {
  type: "CLIENT" as "CLIENT" | "OWNER",
  name: "",
  phone: "",
  email: "",
  notes: "",
  source: "",
  followUpAt: "",
  assignedUserId: "",
};

export default function ContactsManager({ initialContacts, agents, role, currentUserId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [activeTab, setActiveTab] = useState<"CLIENT" | "OWNER">("CLIENT");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<typeof EMPTY_FORM & { followUpSent: boolean }>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterAgent, setFilterAgent] = useState<string>("");
  const [error, setError] = useState("");

  const filtered = contacts.filter((c) => {
    if (c.type !== activeTab) return false;
    if (filterAgent && c.assignedUser?.id !== filterAgent) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        false
      );
    }
    return true;
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          type: activeTab,
          email: form.email || undefined,
          followUpAt: form.followUpAt || null,
          assignedUserId: role === "ADMIN" ? (form.assignedUserId || currentUserId) : undefined,
        }),
      });
      if (!res.ok) throw new Error("Помилка збереження");
      const created: Contact = await res.json();
      setContacts((prev) => [created, ...prev]);
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
    } catch {
      setError("Не вдалося зберегти контакт");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error();
      const updated: Contact = await res.json();
      setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
    } catch {
      setError("Не вдалося оновити контакт");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Видалити контакт?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  function startEdit(c: Contact) {
    setEditingId(c.id);
    setEditForm({
      name: c.name,
      phone: c.phone ?? "",
      email: c.email ?? "",
      notes: c.notes ?? "",
      source: c.source ?? "",
      followUpAt: c.followUpAt ? c.followUpAt.slice(0, 10) : "",
      assignedUserId: c.assignedUser?.id ?? "",
      followUpSent: c.followUpSent,
    });
  }

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  const isOverdue = (c: Contact) =>
    c.followUpAt && !c.followUpSent && new Date(c.followUpAt) < new Date();

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {(["CLIENT", "OWNER"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab
                ? "bg-white text-navy-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "CLIENT" ? "Клієнти" : "Власники"}
            <span className="ml-2 text-xs text-gray-400">
              ({contacts.filter((c) => c.type === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Пошук..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm w-full focus:outline-none focus:border-navy-400"
            />
          </div>
          {/* Agent filter - ADMIN only */}
          {role === "ADMIN" && agents.length > 0 && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-sm appearance-none bg-white focus:outline-none focus:border-navy-400"
              >
                <option value="">Всі агенти</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); }}
          className="flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition w-full sm:w-auto sm:self-start"
        >
          <Plus className="w-4 h-4" />
          Додати {activeTab === "CLIENT" ? "клієнта" : "власника"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-navy-900 mb-4">
            Новий {activeTab === "CLIENT" ? "клієнт" : "власник"}
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ім'я *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-navy-400"
                placeholder="Ім'я та прізвище"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Телефон</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-navy-400"
                placeholder="+380..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-navy-400"
                placeholder="email@..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Джерело</label>
              <input
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-navy-400"
                placeholder="OLX, дзвінок, сайт..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Нагадати (дата)</label>
              <input
                type="date"
                value={form.followUpAt}
                onChange={(e) => setForm((f) => ({ ...f, followUpAt: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-navy-400"
              />
            </div>
            {role === "ADMIN" && agents.length > 0 && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Агент</label>
                <select
                  value={form.assignedUserId}
                  onChange={(e) => setForm((f) => ({ ...f, assignedUserId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-navy-400"
                >
                  <option value="">Мені (за замовч.)</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Нотатки</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-navy-400 resize-none"
                placeholder="Що шукає, побажання..."
              />
            </div>
            {error && <p className="sm:col-span-2 text-red-500 text-xs">{error}</p>}
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl transition"
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium rounded-xl transition disabled:opacity-50"
              >
                {saving ? "Збереження..." : "Зберегти"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Немає {activeTab === "CLIENT" ? "клієнтів" : "власників"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className={`bg-white border rounded-2xl p-4 shadow-sm ${
                isOverdue(c) ? "border-amber-300 bg-amber-50" : "border-gray-200"
              }`}
            >
              {editingId === c.id ? (
                /* Edit mode */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ім'я</label>
                    <input
                      value={editForm.name ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-navy-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Телефон</label>
                    <input
                      value={editForm.phone ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-navy-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input
                      value={editForm.email ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-navy-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Джерело</label>
                    <input
                      value={editForm.source ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, source: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-navy-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Нагадати</label>
                    <input
                      type="date"
                      value={editForm.followUpAt ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, followUpAt: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-navy-400"
                    />
                  </div>
                  {role === "ADMIN" && agents.length > 0 && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Агент</label>
                      <select
                        value={editForm.assignedUserId ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, assignedUserId: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-navy-400"
                      >
                        <option value="">— не призначено —</option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Нотатки</label>
                    <textarea
                      rows={2}
                      value={editForm.notes ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-navy-400 resize-none"
                    />
                  </div>
                  {error && <p className="sm:col-span-2 text-red-500 text-xs">{error}</p>}
                  <div className="sm:col-span-2 flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl"
                    >
                      <X className="w-3.5 h-3.5" /> Скасувати
                    </button>
                    <button
                      onClick={() => handleSaveEdit(c.id)}
                      disabled={saving}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-navy-900 text-white rounded-xl disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Зберегти
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy-900 text-sm">{c.name}</span>
                      {c.source && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {c.source}
                        </span>
                      )}
                      {isOverdue(c) && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          Нагадування прострочено
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-navy-700">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-navy-700">
                          <Mail className="w-3 h-3" /> {c.email}
                        </a>
                      )}
                      {c.followUpAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Нагадати: {fmt(c.followUpAt)}
                          {c.followUpSent && (
                            <span className="text-green-600 font-medium">(надіслано)</span>
                          )}
                        </span>
                      )}
                      {role === "ADMIN" && c.assignedUser && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {c.assignedUser.name ?? c.assignedUser.email}
                        </span>
                      )}
                    </div>
                    {c.notes && (
                      <p className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5 leading-relaxed">
                        {c.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(c)}
                      className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deleting === c.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
