"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  MessageCircle, X, Send, Paperclip, Home, ChevronLeft, ChevronDown, Users,
} from "lucide-react";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Sender {
  id: string;
  name: string | null;
  photoUrl: string | null;
}

interface ChatMsg {
  id: string;
  senderId: string;
  receiverId: string | null;
  content: string;
  type: string;
  fileUrl: string | null;
  fileName: string | null;
  propertySlug: string | null;
  propertyTitle: string | null;
  createdAt: string;
  sender: Sender;
}

interface ChatUser {
  id: string;
  name: string | null;
  photoUrl: string | null;
  role: string;
}

interface PropertyHit {
  id: string;
  slug: string;
  titleUk: string;
  address: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Avatar({ user, size = 8 }: { user: { name: string | null; photoUrl: string | null }; size?: number }) {
  const initials = (user.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (user.photoUrl) {
    return (
      <div className={`relative w-${size} h-${size} rounded-full overflow-hidden flex-shrink-0 bg-gray-200`}>
        <Image src={user.photoUrl} alt={user.name ?? ""} fill className="object-cover object-center" />
      </div>
    );
  }
  return (
    <div className={`w-${size} h-${size} rounded-full flex-shrink-0 bg-navy-900 text-white flex items-center justify-center text-xs font-bold`}>
      {initials}
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
  return (
    d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" }) +
    " " +
    d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
  );
}

function isImageFile(name: string | null) {
  if (!name) return false;
  return /\.(jpe?g|png|gif|webp|svg)$/i.test(name);
}

// ── Main component ────────────────────────────────────────────────────────────

type ActiveChannel = { type: "general" } | { type: "dm"; user: ChatUser };

export default function ChatPanel() {
  const { data: session } = useSession();
  const myId = (session?.user as any)?.id as string | undefined;

  // Panel open/close
  const [open, setOpen] = useState(false);

  // Navigation: null = conversation list, otherwise active channel
  const [activeChannel, setActiveChannel] = useState<ActiveChannel | null>(null);

  // Messages per channel key: "general" | "dm:userId"
  const [messageMap, setMessageMap] = useState<Record<string, ChatMsg[]>>({});
  // Unread counts per channel key
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  // lastCreatedAt per channel key for polling
  const lastCreatedRef = useRef<Record<string, string>>({});

  const [users, setUsers] = useState<ChatUser[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Property picker
  const [propQuery, setPropQuery] = useState("");
  const [propResults, setPropResults] = useState<PropertyHit[]>([]);
  const [showPropPicker, setShowPropPicker] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Channel key helper
  function channelKey(ch: ActiveChannel | null): string {
    if (!ch || ch.type === "general") return "general";
    return `dm:${ch.user.id}`;
  }

  // ── Load users ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    fetch("/api/admin/chat/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {});
  }, [session]);

  // ── Fetch messages for a channel ────────────────────────────────────────────
  const fetchChannel = useCallback(
    async (ch: ActiveChannel, initial = false) => {
      const key = channelKey(ch);
      const last = lastCreatedRef.current[key];

      let url = `/api/admin/chat?channel=${ch.type}`;
      if (ch.type === "dm") url += `&with=${ch.user.id}`;
      if (!initial && last) url += `&after=${encodeURIComponent(last)}`;

      const res = await fetch(url);
      if (!res.ok) return;
      const data: ChatMsg[] = await res.json();
      if (data.length === 0) return;

      if (initial) {
        setMessageMap((prev) => ({ ...prev, [key]: data }));
        lastCreatedRef.current[key] = data[data.length - 1].createdAt;
      } else {
        setMessageMap((prev) => {
          const existing = prev[key] ?? [];
          const ids = new Set(existing.map((m) => m.id));
          const fresh = data.filter((m) => !ids.has(m.id));
          if (fresh.length === 0) return prev;
          lastCreatedRef.current[key] = fresh[fresh.length - 1].createdAt;
          // If this channel is not active or panel is closed → increment unread
          const isActive = open && activeChannel && channelKey(activeChannel) === key;
          if (!isActive) {
            setUnreadMap((u) => ({ ...u, [key]: (u[key] ?? 0) + fresh.length }));
          }
          return { ...prev, [key]: [...existing, ...fresh] };
        });
      }
    },
    [open, activeChannel]
  );

  // ── Poll all known channels ──────────────────────────────────────────────────
  const pollAll = useCallback(() => {
    // Always poll general
    fetchChannel({ type: "general" }, false);
    // Poll DMs for each user we've loaded
    users.forEach((u) => fetchChannel({ type: "dm", user: u }, false));
  }, [fetchChannel, users]);

  // Initial load for general channel
  useEffect(() => {
    if (!session) return;
    fetchChannel({ type: "general" }, true);
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start polling after users are loaded
  useEffect(() => {
    if (!session || users.length === 0) return;
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(pollAll, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [session, users, pollAll]);

  // ── Open a channel ────────────────────────────────────────────────────────
  function openChannel(ch: ActiveChannel) {
    const key = channelKey(ch);
    setActiveChannel(ch);
    setUnreadMap((u) => ({ ...u, [key]: 0 }));
    // Load messages if not yet loaded
    if (!messageMap[key]) {
      fetchChannel(ch, true);
    }
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  // Scroll to bottom on new messages in active channel
  useEffect(() => {
    if (open && activeChannel) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [open, activeChannel, messageMap]);

  // Clear unread when viewing active channel
  useEffect(() => {
    if (open && activeChannel) {
      const key = channelKey(activeChannel);
      setUnreadMap((u) => ({ ...u, [key]: 0 }));
    }
  }, [open, activeChannel, messageMap]);

  // ── Total unread for badge ──────────────────────────────────────────────────
  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  // ── Property search ───────────────────────────────────────────────────────
  useEffect(() => {
    if (propQuery.length < 2) { setPropResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/chat/properties?q=${encodeURIComponent(propQuery)}`);
      if (res.ok) setPropResults(await res.json());
    }, 300);
    return () => clearTimeout(t);
  }, [propQuery]);

  // ── Send helpers ──────────────────────────────────────────────────────────
  function activeReceiverId(): string | null {
    if (!activeChannel || activeChannel.type === "general") return null;
    return activeChannel.user.id;
  }

  async function send() {
    if (!text.trim() || sending || !activeChannel) return;
    setSending(true);
    const res = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.trim(), receiverId: activeReceiverId() }),
    });
    if (res.ok) {
      const msg: ChatMsg = await res.json();
      const key = channelKey(activeChannel);
      setMessageMap((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), msg] }));
      lastCreatedRef.current[key] = msg.createdAt;
      setText("");
    }
    setSending(false);
  }

  async function sendFile(file: File) {
    if (!activeChannel) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/admin/chat/upload", { method: "POST", body: fd });
    if (!up.ok) { setUploading(false); return; }
    const { url, name } = await up.json();

    const res = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: name, type: "file", fileUrl: url, fileName: name,
        receiverId: activeReceiverId(),
      }),
    });
    if (res.ok) {
      const msg: ChatMsg = await res.json();
      const key = channelKey(activeChannel);
      setMessageMap((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), msg] }));
      lastCreatedRef.current[key] = msg.createdAt;
    }
    setUploading(false);
  }

  async function sendProperty(prop: PropertyHit) {
    if (!activeChannel) return;
    setShowPropPicker(false);
    setPropQuery("");
    setPropResults([]);
    const res = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: prop.titleUk, type: "property",
        propertySlug: prop.slug, propertyTitle: prop.titleUk,
        receiverId: activeReceiverId(),
      }),
    });
    if (res.ok) {
      const msg: ChatMsg = await res.json();
      const key = channelKey(activeChannel);
      setMessageMap((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), msg] }));
      lastCreatedRef.current[key] = msg.createdAt;
    }
  }

  // ── Render message bubble ─────────────────────────────────────────────────
  function renderMessage(msg: ChatMsg) {
    const isMe = msg.senderId === myId;

    const bubble = (() => {
      if (msg.type === "file" && msg.fileUrl) {
        if (isImageFile(msg.fileName)) {
          return (
            <a href={msg.fileUrl} target="_blank" rel="noreferrer">
              <img
                src={msg.fileUrl}
                alt={msg.fileName ?? ""}
                className="max-w-[180px] max-h-48 rounded-xl object-cover border border-white/20"
              />
            </a>
          );
        }
        return (
          <a href={msg.fileUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 underline text-sm">
            <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
            {msg.fileName ?? "Файл"}
          </a>
        );
      }
      if (msg.type === "property" && msg.propertySlug) {
        return (
          <a href={`/admin/properties/${msg.propertySlug}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-sm underline">
            <Home className="w-3.5 h-3.5 flex-shrink-0" />
            {msg.propertyTitle ?? msg.propertySlug}
          </a>
        );
      }
      return <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>;
    })();

    return (
      <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
        <Avatar user={msg.sender} size={7} />
        <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
          {!isMe && (
            <span className="text-[10px] text-gray-400 mb-0.5 px-1">{msg.sender.name}</span>
          )}
          <div className={`px-3 py-2 rounded-2xl ${
            isMe ? "bg-navy-900 text-white rounded-tr-sm" : "bg-gray-100 text-gray-900 rounded-tl-sm"
          }`}>
            {bubble}
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 px-1">{formatTime(msg.createdAt)}</span>
        </div>
      </div>
    );
  }

  // ── Conversation list view ────────────────────────────────────────────────
  function renderConversationList() {
    const generalUnread = unreadMap["general"] ?? 0;

    return (
      <div className="flex-1 overflow-y-auto">
        {/* General channel */}
        <button
          onClick={() => openChannel({ type: "general" })}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100"
        >
          <div className="w-9 h-9 rounded-full bg-navy-900 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-navy-900">Загальний чат</p>
            <p className="text-xs text-gray-400">Всі учасники</p>
          </div>
          {generalUnread > 0 && (
            <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
              {generalUnread > 9 ? "9+" : generalUnread}
            </span>
          )}
        </button>

        {/* DM list */}
        {users.map((u) => {
          const key = `dm:${u.id}`;
          const unread = unreadMap[key] ?? 0;
          return (
            <button
              key={u.id}
              onClick={() => openChannel({ type: "dm", user: u })}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100"
            >
              <Avatar user={u} size={9} />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-navy-900 truncate">{u.name ?? "—"}</p>
                <p className="text-xs text-gray-400">Особисте повідомлення</p>
              </div>
              {unread > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // ── Chat view (messages + input) ──────────────────────────────────────────
  function renderChatView() {
    const key = channelKey(activeChannel);
    const msgs = messageMap[key] ?? [];

    return (
      <>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {msgs.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-10">Поки немає повідомлень</p>
          )}
          {msgs.map((msg) => renderMessage(msg))}
          <div ref={bottomRef} />
        </div>

        {/* Property picker */}
        {showPropPicker && (
          <div className="border-t border-gray-100 bg-gray-50 p-3 flex-shrink-0">
            <input
              autoFocus
              value={propQuery}
              onChange={(e) => setPropQuery(e.target.value)}
              placeholder="Пошук нерухомості..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-900"
            />
            {propResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {propResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => sendProperty(p)}
                    className="w-full text-left px-3 py-2 text-xs bg-white border border-gray-100 rounded-lg hover:bg-navy-50 hover:border-navy-200 transition"
                  >
                    <p className="font-medium text-navy-900 truncate">{p.titleUk}</p>
                    {p.address && <p className="text-gray-400 truncate">{p.address}</p>}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => { setShowPropPicker(false); setPropQuery(""); setPropResults([]); }}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <ChevronDown className="w-3 h-3" /> Закрити
            </button>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-100 p-3 flex-shrink-0 bg-white">
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) sendFile(f);
              e.target.value = "";
            }} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              title="Прикріпити файл"
              className="p-1.5 text-gray-400 hover:text-navy-900 transition flex-shrink-0 disabled:opacity-40">
              <Paperclip className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setShowPropPicker((s) => !s)}
              title="Поділитися нерухомістю"
              className={`p-1.5 transition flex-shrink-0 ${showPropPicker ? "text-navy-900" : "text-gray-400 hover:text-navy-900"}`}>
              <Home className="w-4 h-4" />
            </button>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder="Повідомлення..."
              rows={1}
              className="flex-1 resize-none px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900 max-h-24 overflow-y-auto"
              style={{ lineHeight: "1.4" }}
            />
            <button type="button" onClick={send} disabled={!text.trim() || sending}
              className="p-2 bg-navy-900 text-white rounded-xl hover:bg-navy-800 transition disabled:opacity-40 flex-shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Panel header ──────────────────────────────────────────────────────────
  function renderHeader() {
    if (!activeChannel) {
      return (
        <div className="flex items-center justify-between px-4 py-3 bg-navy-900 text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="font-semibold text-sm">Чат команди</span>
          </div>
          <button onClick={() => setOpen(false)} className="hover:text-gray-300 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    const title = activeChannel.type === "general"
      ? "Загальний чат"
      : (activeChannel.user.name ?? "Особисте");

    return (
      <div className="flex items-center gap-2 px-3 py-3 bg-navy-900 text-white flex-shrink-0">
        <button onClick={() => { setActiveChannel(null); setShowPropPicker(false); }}
          className="hover:text-gray-300 transition flex-shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
        {activeChannel.type === "dm" && (
          <Avatar user={activeChannel.user} size={7} />
        )}
        {activeChannel.type === "general" && (
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
        )}
        <span className="font-semibold text-sm flex-1 truncate">{title}</span>
        <button onClick={() => setOpen(false)} className="hover:text-gray-300 transition flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Root render ───────────────────────────────────────────────────────────
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 bg-navy-900 hover:bg-navy-800 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105"
        style={{ width: 52, height: 52 }}
        title="Командний чат"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        {!open && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {/* Slide-out panel */}
      <div className={`fixed top-0 right-0 h-full z-50 flex flex-col bg-white shadow-2xl transition-all duration-300 ease-in-out ${
        open ? "w-80 translate-x-0" : "w-80 translate-x-full"
      }`}>
        {renderHeader()}
        {activeChannel ? renderChatView() : renderConversationList()}
      </div>
    </>
  );
}
