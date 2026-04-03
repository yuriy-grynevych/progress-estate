"use client";

import { useState, useRef } from "react";
import { Trash2, UserPlus, Building2, Camera, Phone, Copy, Check } from "lucide-react";
import Image from "next/image";

interface Employee {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  agentToken: string;
  createdAt: string | Date;
  _count: { assignedProperties: number };
}

export default function UsersManager({ initialUsers }: { initialUsers: Employee[] }) {
  const [users, setUsers] = useState<Employee[]>(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error === "Email already exists" ? "Цей email вже існує" : "Помилка створення");
        return;
      }
      const newUser = await res.json();
      setUsers((prev) => [{ ...newUser, _count: { assignedProperties: 0 } }, ...prev]);
      setForm({ name: "", email: "", password: "", phone: "" });
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Видалити цього працівника?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function uploadAvatar(userId: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("userId", userId);
    const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
    if (res.ok) {
      const { photoUrl } = await res.json();
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, photoUrl } : u));
    }
  }

  async function savePhone(userId: string) {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneValue }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, phone: phoneValue } : u));
      setEditingPhone(null);
    }
  }

  function copyToken(user: Employee) {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/uk/listings?agent=${user.agentToken}`;
    navigator.clipboard.writeText(url);
    setCopied(user.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-navy-800 transition"
        >
          <UserPlus className="w-4 h-4" />
          Додати працівника
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={createUser} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-navy-900">Новий працівник</h2>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Ім'я</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                placeholder="Іван Петренко"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Телефон</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                placeholder="+380..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                placeholder="ivan@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Пароль</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                placeholder="Мін. 6 символів"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-navy-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-navy-800 transition disabled:opacity-50"
            >
              {loading ? "Створення..." : "Створити"}
            </button>
          </div>
        </form>
      )}

      {/* Users list */}
      <div className="space-y-3">
        {users.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm px-6 py-8 text-center text-gray-400 text-sm">
            Немає працівників. Додайте першого.
          </div>
        )}
        {users.map((u) => (
          <div key={u.id} className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                  {u.photoUrl ? (
                    <Image src={u.photoUrl} alt={u.name ?? ""} width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                      {u.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRefs.current[u.id]?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-navy-900 text-white rounded-full flex items-center justify-center hover:bg-navy-800 transition"
                  title="Завантажити фото"
                >
                  <Camera className="w-3 h-3" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(el) => { fileInputRefs.current[u.id] = el; }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAvatar(u.id, file);
                    e.target.value = "";
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-navy-900">{u.name ?? "—"}</p>
                    <p className="text-gray-400 text-sm">{u.email}</p>
                  </div>
                  <button
                    onClick={() => deleteUser(u.id)}
                    className="text-gray-300 hover:text-red-500 transition flex-shrink-0"
                    title="Видалити"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Phone */}
                <div className="mt-2 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {editingPhone === u.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={phoneValue}
                        onChange={(e) => setPhoneValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") savePhone(u.id);
                          if (e.key === "Escape") setEditingPhone(null);
                        }}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 w-40"
                        placeholder="+380..."
                      />
                      <button onClick={() => savePhone(u.id)} className="text-xs text-navy-900 font-medium hover:underline">Зберегти</button>
                      <button onClick={() => setEditingPhone(null)} className="text-xs text-gray-400 hover:underline">Відмінити</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingPhone(u.id); setPhoneValue(u.phone ?? ""); }}
                      className="text-sm text-gray-500 hover:text-navy-900 transition"
                    >
                      {u.phone || <span className="text-gray-300 italic">Додати телефон</span>}
                    </button>
                  )}
                </div>

                {/* Stats + token */}
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Building2 className="w-3.5 h-3.5" />
                    {u._count.assignedProperties} об'єктів
                  </span>
                  <button
                    onClick={() => copyToken(u)}
                    className="flex items-center gap-1.5 text-xs bg-gold-50 text-gold-600 hover:bg-gold-100 px-2.5 py-1 rounded-lg transition font-medium"
                    title="Скопіювати посилання агента"
                  >
                    {copied === u.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === u.id ? "Скопійовано!" : "Посилання агента"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
