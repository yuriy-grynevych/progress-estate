"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle, Clock, Phone, Mail, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";

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

interface Props {
  initialContacts: Contact[];
  role: "ADMIN" | "EMPLOYEE";
}

function groupContacts(contacts: Contact[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
  const weekEnd = new Date(todayStart); weekEnd.setDate(weekEnd.getDate() + 7);

  const overdue: Contact[] = [];
  const today: Contact[] = [];
  const thisWeek: Contact[] = [];
  const later: Contact[] = [];

  for (const c of contacts) {
    const d = new Date(c.followUpAt!);
    if (d < todayStart)      overdue.push(c);
    else if (d < todayEnd)   today.push(c);
    else if (d < weekEnd)    thisWeek.push(c);
    else                     later.push(c);
  }

  return { overdue, today, thisWeek, later };
}

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

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split("T")[0];

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
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
              надіслано
            </span>
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
        {contact.notes && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{contact.notes}</p>
        )}
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

function Group({ title, contacts, icon, accent, onDone, onSnooze, loading, role }: {
  title: string;
  contacts: Contact[];
  icon: React.ReactNode;
  accent: string;
  onDone: (id: string) => void;
  onSnooze: (id: string, date: string) => void;
  loading: string | null;
  role: "ADMIN" | "EMPLOYEE";
}) {
  if (contacts.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className={`flex items-center gap-2 px-5 py-3 border-b border-gray-100 ${accent}`}>
        {icon}
        <span className="font-semibold text-sm">{title}</span>
        <span className="ml-auto text-xs font-bold bg-white/60 px-2 py-0.5 rounded-full">{contacts.length}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {contacts.map((c) => (
          <ContactCard key={c.id} contact={c} onDone={onDone} onSnooze={onSnooze} loading={loading} role={role} />
        ))}
      </div>
    </div>
  );
}

export default function RemindersManager({ initialContacts, role }: Props) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [loading, setLoading] = useState<string | null>(null);

  const { overdue, today, thisWeek, later } = groupContacts(contacts);

  const handleDone = async (id: string) => {
    setLoading(id);
    try {
      await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: id, action: "done" }),
      });
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setLoading(null);
    }
  };

  const handleSnooze = async (id: string, date: string) => {
    setLoading(id);
    try {
      await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: id, action: "snooze", snoozeDate: date }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const total = contacts.length;

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center py-16 gap-3">
        <Bell className="w-10 h-10 text-gray-200" />
        <p className="text-gray-400 font-medium">Немає нагадувань</p>
        <p className="text-xs text-gray-300">Встановіть дату нагадування у картці контакту</p>
      </div>
    );
  }

  const sharedProps = { onDone: handleDone, onSnooze: handleSnooze, loading, role };

  return (
    <div className="space-y-4">
      <Group
        title="Прострочені"
        contacts={overdue}
        icon={<AlertCircle className="w-4 h-4" />}
        accent="bg-red-50 text-red-700"
        {...sharedProps}
      />
      <Group
        title="Сьогодні"
        contacts={today}
        icon={<Bell className="w-4 h-4" />}
        accent="bg-amber-50 text-amber-700"
        {...sharedProps}
      />
      <Group
        title="Цього тижня"
        contacts={thisWeek}
        icon={<Clock className="w-4 h-4" />}
        accent="bg-blue-50 text-blue-700"
        {...sharedProps}
      />
      <Group
        title="Пізніше"
        contacts={later}
        icon={<Clock className="w-4 h-4" />}
        accent="bg-gray-50 text-gray-600"
        {...sharedProps}
      />
    </div>
  );
}
