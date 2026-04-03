"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";

interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string | null;
  contentUk: string;
  contentEn: string;
  rating: number;
  isPublished: boolean;
  order: number;
}

interface Props {
  initialTestimonials: Testimonial[];
}

const emptyForm = {
  authorName: "",
  authorRole: "",
  contentUk: "",
  contentEn: "",
  rating: 5,
  isPublished: true,
};

export default function TestimonialsManager({ initialTestimonials }: Props) {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/testimonials/${editingId}` : "/api/testimonials";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, order: testimonials.length }),
    });

    if (res.ok) {
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Видалити відгук?")) return;
    await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
    router.refresh();
  }

  async function handleTogglePublish(t: Testimonial) {
    await fetch(`/api/testimonials/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !t.isPublished }),
    });
    setTestimonials((prev) =>
      prev.map((item) =>
        item.id === t.id ? { ...item, isPublished: !item.isPublished } : item
      )
    );
  }

  function startEdit(t: Testimonial) {
    setForm({
      authorName: t.authorName,
      authorRole: t.authorRole ?? "",
      contentUk: t.contentUk,
      contentEn: t.contentEn,
      rating: t.rating,
      isPublished: t.isPublished,
    });
    setEditingId(t.id);
    setShowForm(true);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Відгуки</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm(emptyForm);
          }}
          className="flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-navy-800 transition"
        >
          <Plus className="w-4 h-4" />
          Додати відгук
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-4">
            {editingId ? "Редагувати відгук" : "Новий відгук"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ім'я автора *
                </label>
                <input
                  type="text"
                  value={form.authorName}
                  onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Посада / Роль
                </label>
                <input
                  type="text"
                  value={form.authorRole}
                  onChange={(e) => setForm({ ...form, authorRole: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Текст (UA) *
              </label>
              <textarea
                value={form.contentUk}
                onChange={(e) => setForm({ ...form, contentUk: e.target.value })}
                required
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Текст (EN) *
              </label>
              <textarea
                value={form.contentEn}
                onChange={(e) => setForm({ ...form, contentEn: e.target.value })}
                required
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>
            <div className="flex items-center gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Оцінка
                </label>
                <select
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {"★".repeat(r)}{"☆".repeat(5 - r)}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 mt-4">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="rounded"
                />
                Опублікувати
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-navy-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-navy-800 transition disabled:opacity-60"
              >
                {loading ? "Збереження..." : editingId ? "Зберегти" : "Додати"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
              >
                Скасувати
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {testimonials.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow-sm">
            Немає відгуків
          </div>
        )}
        {testimonials.map((t) => (
          <div
            key={t.id}
            className={`bg-white rounded-2xl p-5 shadow-sm flex gap-4 items-start ${
              !t.isPublished ? "opacity-60" : ""
            }`}
          >
            <GripVertical className="w-4 h-4 text-gray-300 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-navy-900 text-sm">{t.authorName}</span>
                {t.authorRole && (
                  <span className="text-gray-400 text-xs">· {t.authorRole}</span>
                )}
                <span className="text-gold-400 text-xs">{"★".repeat(t.rating)}</span>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2">{t.contentUk}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleTogglePublish(t)}
                className="text-gray-400 hover:text-navy-900 transition"
                title={t.isPublished ? "Приховати" : "Опублікувати"}
              >
                {t.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => startEdit(t)}
                className="text-xs text-navy-900 border border-navy-900/20 hover:bg-navy-50 px-2 py-1 rounded-lg transition"
              >
                Редагувати
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
