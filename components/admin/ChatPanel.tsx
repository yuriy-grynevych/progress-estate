"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  MessageCircle, X, Send, Paperclip, Home, ChevronDown,
} from "lucide-react";
import Image from "next/image";

interface Sender {
  id: string;
  name: string | null;
  photoUrl: string | null;
}

interface ChatMsg {
  id: string;
  senderId: string;
  content: string;
  type: string;
  fileUrl: string | null;
  fileName: string | null;
  propertySlug: string | null;
  propertyTitle: string | null;
  createdAt: string;
  sender: Sender;
}

interface PropertyHit {
  id: string;
  slug: string;
  titleUk: string;
  address: string | null;
}

function Avatar({ user, size = 8 }: { user: Sender; size?: number }) {
  const initials = (user.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (user.photoUrl) {
    return (
      <div
        className={`relative w-${size} h-${size} rounded-full overflow-hidden flex-shrink-0 bg-gray-200`}
      >
        <Image src={user.photoUrl} alt={user.name ?? ""} fill className="object-cover object-center" />
      </div>
    );
  }
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex-shrink-0 bg-navy-900 text-white flex items-center justify-center text-xs font-bold`}
    >
      {initials}
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" }) +
    " " + d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

function isImageFile(name: string | null) {
  if (!name) return false;
  return /\.(jpe?g|png|gif|webp|svg)$/i.test(name);
}

export default function ChatPanel() {
  const { data: session } = useSession();
  const myId = (session?.user as any)?.id as string | undefined;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Property picker
  const [propQuery, setPropQuery] = useState("");
  const [propResults, setPropResults] = useState<PropertyHit[]>([]);
  const [showPropPicker, setShowPropPicker] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastCreatedAt = useRef<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load initial messages ─────────────────────────────────────────────
  const loadMessages = useCallback(async (initial = false) => {
    const url = lastCreatedAt.current && !initial
      ? `/api/admin/chat?after=${encodeURIComponent(lastCreatedAt.current)}`
      : "/api/admin/chat";
    const res = await fetch(url);
    if (!res.ok) return;
    const data: ChatMsg[] = await res.json();
    if (data.length === 0) return;

    if (initial) {
      setMessages(data);
      lastCreatedAt.current = data[data.length - 1].createdAt;
    } else {
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const fresh = data.filter((m) => !ids.has(m.id));
        if (fresh.length === 0) return prev;
        lastCreatedAt.current = fresh[fresh.length - 1].createdAt;
        if (!open) setUnread((u) => u + fresh.length);
        return [...prev, ...fresh];
      });
    }
  }, [open]);

  useEffect(() => {
    if (!session) return;
    loadMessages(true);
  }, [session, loadMessages]);

  // ── Polling ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    pollingRef.current = setInterval(() => loadMessages(false), 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [session, loadMessages]);

  // ── Scroll to bottom when open or new messages ────────────────────────
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [open, messages.length]);

  // ── Property search ───────────────────────────────────────────────────
  useEffect(() => {
    if (propQuery.length < 2) { setPropResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/chat/properties?q=${encodeURIComponent(propQuery)}`);
      if (res.ok) setPropResults(await res.json());
    }, 300);
    return () => clearTimeout(t);
  }, [propQuery]);

  // ── Send text ─────────────────────────────────────────────────────────
  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.trim() }),
    });
    if (res.ok) {
      const msg: ChatMsg = await res.json();
      setMessages((p) => [...p, msg]);
      lastCreatedAt.current = msg.createdAt;
      setText("");
    }
    setSending(false);
  }

  // ── Send file ─────────────────────────────────────────────────────────
  async function sendFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/admin/chat/upload", { method: "POST", body: fd });
    if (!up.ok) { setUploading(false); return; }
    const { url, name } = await up.json();

    const res = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: name, type: "file", fileUrl: url, fileName: name }),
    });
    if (res.ok) {
      const msg: ChatMsg = await res.json();
      setMessages((p) => [...p, msg]);
      lastCreatedAt.current = msg.createdAt;
    }
    setUploading(false);
  }

  // ── Send property link ────────────────────────────────────────────────
  async function sendProperty(prop: PropertyHit) {
    setShowPropPicker(false);
    setPropQuery("");
    setPropResults([]);
    const res = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: prop.titleUk,
        type: "property",
        propertySlug: prop.slug,
        propertyTitle: prop.titleUk,
      }),
    });
    if (res.ok) {
      const msg: ChatMsg = await res.json();
      setMessages((p) => [...p, msg]);
      lastCreatedAt.current = msg.createdAt;
    }
  }

  // ── Render message bubble ─────────────────────────────────────────────
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
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 underline text-sm"
          >
            <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
            {msg.fileName ?? "Файл"}
          </a>
        );
      }

      if (msg.type === "property" && msg.propertySlug) {
        return (
          <a
            href={`/admin/properties/${msg.propertySlug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm underline"
          >
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
          <div
            className={`px-3 py-2 rounded-2xl ${
              isMe
                ? "bg-navy-900 text-white rounded-tr-sm"
                : "bg-gray-100 text-gray-900 rounded-tl-sm"
            }`}
          >
            {bubble}
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 px-1">{formatTime(msg.createdAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Toggle button ───────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 w-13 h-13 bg-navy-900 hover:bg-navy-800 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105"
        style={{ width: 52, height: 52 }}
        title="Командний чат"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* ── Slide-out panel ─────────────────────────────────────────────── */}
      <div
        className={`fixed top-0 right-0 h-full z-50 flex flex-col bg-white shadow-2xl transition-all duration-300 ease-in-out ${
          open ? "w-80 translate-x-0" : "w-80 translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-navy-900 text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="font-semibold text-sm">Командний чат</span>
          </div>
          <button onClick={() => setOpen(false)} className="hover:text-gray-300 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-10">Поки немає повідомлень</p>
          )}
          {messages.map((msg) => renderMessage(msg))}
          <div ref={bottomRef} />
        </div>

        {/* Property picker popup */}
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

        {/* Input area */}
        <div className="border-t border-gray-100 p-3 flex-shrink-0 bg-white">
          <div className="flex items-end gap-2">
            {/* File upload */}
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) sendFile(f);
              e.target.value = "";
            }} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Прикріпити файл"
              className="p-1.5 text-gray-400 hover:text-navy-900 transition flex-shrink-0 disabled:opacity-40"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Property link */}
            <button
              type="button"
              onClick={() => setShowPropPicker((s) => !s)}
              title="Поділитися нерухомістю"
              className={`p-1.5 transition flex-shrink-0 ${showPropPicker ? "text-navy-900" : "text-gray-400 hover:text-navy-900"}`}
            >
              <Home className="w-4 h-4" />
            </button>

            {/* Text input */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Повідомлення..."
              rows={1}
              className="flex-1 resize-none px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900 max-h-24 overflow-y-auto"
              style={{ lineHeight: "1.4" }}
            />

            {/* Send */}
            <button
              type="button"
              onClick={send}
              disabled={!text.trim() || sending}
              className="p-2 bg-navy-900 text-white rounded-xl hover:bg-navy-800 transition disabled:opacity-40 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
