"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { FUNNEL_STAGES } from "./InquiryKanban";
import { SOURCE_OPTIONS } from "@/lib/constants";

interface Agent {
  id: string;
  name: string | null;
  email: string;
  accentColor: string | null;
}

interface Props {
  agents: Agent[];
  onCreated: (card: any) => void;
}

export default function AddLeadModal({ agents, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
    source: "",
    funnelStage: "NEW",
    assignedUserId: "",
    deadline: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          assignedUserId: form.assignedUserId || null,
          deadline: form.deadline || null,
          source: form.source || null,
          email: form.email || null,
          phone: form.phone || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onCreated(data);
        setForm({ name: "", phone: "", email: "", message: "", source: "", funnelStage: "NEW", assignedUserId: "", deadline: "" });
        setOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-xl text-sm font-semibold transition"
      >
        <Plus className="w-4 h-4" />
        Нова заявка
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-navy-900">Нова заявка / лід</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Ім'я *</label>
                  <input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Ім'я клієнта"
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Телефон</label>
                  <input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+380..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="email@..."
                    type="email"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900/20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Опис / що шукає *</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    placeholder="Шукає 2к квартиру в центрі до 50 000$..."
                    required
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900/20 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Джерело</label>
                  <select
                    value={form.source}
                    onChange={(e) => set("source", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white"
                  >
                    <option value="">— Не вказано —</option>
                    {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Стадія</label>
                  <select
                    value={form.funnelStage}
                    onChange={(e) => set("funnelStage", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white"
                  >
                    {FUNNEL_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                {agents.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Відповідальний</label>
                    <select
                      value={form.assignedUserId}
                      onChange={(e) => set("assignedUserId", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white"
                    >
                      <option value="">— Не вказано —</option>
                      {agents.map((a) => <option key={a.id} value={a.id}>{a.name ?? a.email}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Дедлайн</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => set("deadline", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                  Скасувати
                </button>
                <button type="submit" disabled={saving || !form.name.trim() || !form.message.trim()}
                  className="flex-1 px-4 py-2 text-sm font-semibold bg-navy-900 text-white rounded-xl hover:bg-navy-800 disabled:opacity-40 transition">
                  {saving ? "Збереження..." : "Додати"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
