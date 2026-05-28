"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, CheckCircle, Clock, Phone, Mail, ChevronRight,
  AlertCircle, Plus, X, Trash2, ListTodo, History, CheckCircle2,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Contact = {
  id: string;
  type: "CLIENT" | "OWNER";
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  followUpAt: string | null;
  followUpSent: boolean;
  assignedUser: { id: string; name: string | null } | null;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  isDone: boolean;
  contact: { id: string; name: string; phone: string | null } | null;
};

type ContactOption = { id: string; name: string; phone: string | null };
type Agent = { id: string; name: string | null };

interface Props {
  initialContacts: Contact[];
  initialTasks: Task[];
  contactOptions: ContactOption[];
  agents: Agent[];
  role: "ADMIN" | "EMPLOYEE";
  currentUserId: string;
}

// ─── Grouping helpers ─────────────────────────────────────────────────────────

type Groups<T> = { overdue: T[]; today: T[]; thisWeek: T[]; later: T[]; noDate: T[] };

function getDate(d: string | null) { return d ? new Date(d) : null; }

function groupByDate<T extends { dueAt?: string | null; followUpAt?: string | null }>(items: T[]): Groups<T> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
  const weekEnd    = new Date(todayStart); weekEnd.setDate(weekEnd.getDate() + 7);

  const out: Groups<T> = { overdue: [], today: [], thisWeek: [], later: [], noDate: [] };
  for (const item of items) {
    const raw = (item as any).dueAt ?? (item as any).followUpAt;
    const d = getDate(raw);
    if (!d)          { out.noDate.push(item); continue; }
    if (d < todayStart)    out.overdue.push(item);
    else if (d < todayEnd)  out.today.push(item);
    else if (d < weekEnd)   out.thisWeek.push(item);
    else                    out.later.push(item);
  }
  return out;
}

// ─── Contact card ─────────────────────────────────────────────────────────────

function ContactCard({ contact, onDone, onSnooze, loading, role }: {
  contact: Contact;
  onDone: (id: string) => void;
  onSnooze: (id: string, date: string) => void;
  loading: string | null;
  role: "ADMIN" | "EMPLOYEE";
}) {
  const date = contact.followUpAt
    ? new Date(contact.followUpAt).toLocaleDateString("uk-UA", { day: "numeric", month: "long" })
    : "";
  const isLoading = loading === contact.id;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  return (
    <div className="flex items-start gap-4 py-4 px-5">
      <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0 text-navy-900 font-bold text-sm">
        {contact.name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-navy-900 text-sm">{contact.name}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            contact.type === "CLIENT" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
          }`}>
            {contact.type === "CLIENT" ? "Клієнт" : "Власник"}
          </span>
          {contact.followUpSent && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">надіслано</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-navy-900 transition">
              <Phone className="w-3 h-3" />{contact.phone}
            </a>
          )}
          {contact.email && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Mail className="w-3 h-3" />{contact.email}
            </span>
          )}
        </div>
        {contact.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{contact.notes}</p>}
        {role === "ADMIN" && contact.assignedUser?.name && (
          <p className="text-xs text-gray-400 mt-0.5">Агент: {contact.assignedUser.name}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-gray-400 hidden sm:block">{date}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSnooze(contact.id, tomorrowStr)}
            disabled={isLoading}
            title="Відкласти на 1 день"
            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-amber-500 hover:border-amber-200 transition disabled:opacity-40"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDone(contact.id)}
            disabled={isLoading}
            title="Виконано"
            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-green-600 hover:border-green-200 transition disabled:opacity-40"
          >
            <CheckCircle className="w-3.5 h-3.5" />
          </button>
          <Link
            href="/admin/contacts"
            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-navy-900 hover:border-navy-200 transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onDone, onSnooze, onDelete, loading }: {
  task: Task;
  onDone: (id: string) => void;
  onSnooze: (id: string, date: string) => void;
  onDelete: (id: string) => void;
  loading: string | null;
}) {
  const date = task.dueAt
    ? new Date(task.dueAt).toLocaleDateString("uk-UA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    : null;
  const isLoading = loading === task.id;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  return (
    <div className="flex items-start gap-4 py-4 px-5">
      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
        <ListTodo className="w-4 h-4 text-purple-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-navy-900 text-sm">{task.title}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
            Завдання
          </span>
        </div>
        {task.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
        )}
        {task.contact && (
          <Link href="/admin/contacts" className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1 transition">
            <Phone className="w-3 h-3" />
            {task.contact.name}
            {task.contact.phone && ` · ${task.contact.phone}`}
          </Link>
        )}
        {date && <p className="text-xs text-gray-400 mt-0.5">{date}</p>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onSnooze(task.id, tomorrowStr)}
          disabled={isLoading}
          title="Відкласти на 1 день"
          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-amber-500 hover:border-amber-200 transition disabled:opacity-40"
        >
          <Clock className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDone(task.id)}
          disabled={isLoading}
          title="Виконано"
          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-green-600 hover:border-green-200 transition disabled:opacity-40"
        >
          <CheckCircle className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          disabled={isLoading}
          title="Видалити"
          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Group wrapper ─────────────────────────────────────────────────────────────

function Group({ title, icon, accent, children, count }: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
  count: number;
}) {
  if (count === 0) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className={`flex items-center gap-2 px-5 py-3 border-b border-gray-100 ${accent}`}>
        {icon}
        <span className="font-semibold text-sm">{title}</span>
        <span className="ml-auto text-xs font-bold bg-white/60 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}

// ─── Add Task Modal ───────────────────────────────────────────────────────────

function AddTaskModal({ contactOptions, onClose, onAdd }: {
  contactOptions: ContactOption[];
  onClose: () => void;
  onAdd: (task: Task) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [contactId, setContactId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Введіть назву"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          contactId: contactId || null,
        }),
      });
      if (!res.ok) { setError("Помилка збереження"); return; }
      const task = await res.json();
      onAdd(task);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-navy-900 text-base">Нове завдання</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Назва *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Що потрібно зробити?"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Опис</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Додаткові деталі..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Нагадати</label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Клієнт (необов'язково)</label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white"
            >
              <option value="">— не обрано —</option>
              {contactOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.phone ? ` · ${c.phone}` : ""}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition disabled:opacity-50"
            >
              {saving ? "Збереження…" : "Зберегти"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RemindersManager({ initialContacts, initialTasks, contactOptions, agents, role, currentUserId }: Props) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // ─ history ─
  const [showHistory, setShowHistory] = useState(false);
  const [historyTasks, setHistoryTasks] = useState<(Task & { user?: { name: string | null } | null })[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyAgent, setHistoryAgent] = useState<string>("");

  const cg = groupByDate(contacts.map((c) => ({ ...c, dueAt: c.followUpAt })));
  const tg = groupByDate(tasks);

  const merged = {
    overdue:  { contacts: cg.overdue,  tasks: tg.overdue  },
    today:    { contacts: cg.today,    tasks: tg.today    },
    thisWeek: { contacts: cg.thisWeek, tasks: tg.thisWeek },
    later:    { contacts: cg.later,    tasks: tg.later    },
    noDate:   { contacts: cg.noDate,   tasks: tg.noDate   },
  };

  const totalContacts = contacts.length;
  const totalTasks = tasks.length;

  // ─ history ─
  async function loadHistory(userId?: string) {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ isDone: "true" });
      if (userId) params.set("userId", userId);
      const res = await fetch(`/api/tasks?${params}`);
      setHistoryTasks(await res.json());
    } finally {
      setHistoryLoading(false);
    }
  }

  function handleToggleHistory() {
    if (showHistory) { setShowHistory(false); return; }
    setShowHistory(true);
    loadHistory(role === "ADMIN" ? historyAgent || undefined : undefined);
  }

  function handleHistoryAgentChange(uid: string) {
    setHistoryAgent(uid);
    loadHistory(uid || undefined);
  }

  // ─ contact handlers ─
  const handleContactDone = async (id: string) => {
    setLoadingId(id);
    try {
      await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: id, action: "done" }),
      });
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } finally { setLoadingId(null); }
  };

  const handleContactSnooze = async (id: string, date: string) => {
    setLoadingId(id);
    try {
      await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: id, action: "snooze", snoozeDate: date }),
      });
      router.refresh();
    } finally { setLoadingId(null); }
  };

  // ─ task handlers ─
  const handleTaskDone = async (id: string) => {
    setLoadingId(id);
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "done" }),
      });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } finally { setLoadingId(null); }
  };

  const handleTaskSnooze = async (id: string, date: string) => {
    setLoadingId(id);
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "snooze", snoozeDate: new Date(`${date}T09:00:00`).toISOString() }),
      });
      router.refresh();
    } finally { setLoadingId(null); }
  };

  const handleTaskDelete = async (id: string) => {
    setLoadingId(id);
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } finally { setLoadingId(null); }
  };

  const renderGroup = (key: keyof typeof merged, title: string, icon: React.ReactNode, accent: string) => {
    const { contacts: gc, tasks: gt } = merged[key];
    const count = gc.length + gt.length;
    if (count === 0) return null;
    return (
      <Group key={key} title={title} icon={icon} accent={accent} count={count}>
        {gc.map((c) => (
          <ContactCard
            key={c.id}
            contact={c}
            onDone={handleContactDone}
            onSnooze={handleContactSnooze}
            loading={loadingId}
            role={role}
          />
        ))}
        {gt.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onDone={handleTaskDone}
            onSnooze={handleTaskSnooze}
            onDelete={handleTaskDelete}
            loading={loadingId}
          />
        ))}
      </Group>
    );
  };

  return (
    <>
      {showModal && (
        <AddTaskModal
          contactOptions={contactOptions}
          onClose={() => setShowModal(false)}
          onAdd={(task) => setTasks((prev) => [task, ...prev])}
        />
      )}

      <div className="space-y-4">
        {/* Header with buttons */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-500">
            {totalContacts + totalTasks > 0
              ? `${totalContacts} нагадувань · ${totalTasks} завдань`
              : "Немає активних завдань"}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleHistory}
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition border ${
                showHistory
                  ? "bg-purple-100 text-purple-700 border-purple-200"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <History className="w-4 h-4" />
              Історія
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              Додати завдання
            </button>
          </div>
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-purple-50">
              <History className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-sm text-purple-700">Виконані завдання</span>
              {role === "ADMIN" && agents.length > 0 && (
                <select
                  value={historyAgent}
                  onChange={(e) => handleHistoryAgentChange(e.target.value)}
                  className="ml-auto text-sm border border-purple-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
                >
                  <option value="">Всі агенти</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name ?? a.id}</option>
                  ))}
                </select>
              )}
            </div>
            {historyLoading ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Завантаження...</p>
            ) : historyTasks.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Немає виконаних завдань</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {historyTasks.map((t) => (
                  <div key={t.id} className="flex items-start gap-3 px-5 py-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-400 line-through">{t.title}</span>
                      {t.description && (
                        <span className="text-xs text-gray-300 ml-2">{t.description.slice(0, 60)}</span>
                      )}
                      {t.contact && (
                        <span className="ml-2 text-xs text-blue-400">· {t.contact.name}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-300 flex-shrink-0 text-right">
                      {t.dueAt && new Date(t.dueAt).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}
                      {(t as any).user?.name && role === "ADMIN" && (
                        <div className="text-gray-400">{(t as any).user.name}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {renderGroup("overdue",  "Прострочені",   <AlertCircle className="w-4 h-4" />, "bg-red-50 text-red-700")}
        {renderGroup("today",    "Сьогодні",       <Bell className="w-4 h-4" />,        "bg-amber-50 text-amber-700")}
        {renderGroup("thisWeek", "Цього тижня",    <Clock className="w-4 h-4" />,       "bg-blue-50 text-blue-700")}
        {renderGroup("later",    "Пізніше",        <Clock className="w-4 h-4" />,       "bg-gray-50 text-gray-600")}
        {renderGroup("noDate",   "Без дати",       <ListTodo className="w-4 h-4" />,    "bg-purple-50 text-purple-700")}

        {totalContacts + totalTasks === 0 && (
          <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center py-16 gap-3">
            <Bell className="w-10 h-10 text-gray-200" />
            <p className="text-gray-400 font-medium">Немає завдань</p>
            <p className="text-xs text-gray-300">Натисніть «Додати завдання» або встановіть дату нагадування у картці контакту</p>
          </div>
        )}
      </div>
    </>
  );
}
