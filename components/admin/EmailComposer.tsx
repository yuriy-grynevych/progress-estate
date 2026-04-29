"use client";
import { useState } from "react";
import { Mail, X, Send, Loader2 } from "lucide-react";

interface Props {
  to: string;
  toName?: string;
}

export default function EmailComposer({ to, toName }: Props) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true); setResult(null);
    try {
      const html = body.replace(/\n/g, "<br/>");
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResult({ ok: true, msg: "Лист надіслано!" });
      setTimeout(() => { setOpen(false); setSubject(""); setBody(""); setResult(null); }, 1500);
    } catch (e: any) {
      setResult({ ok: false, msg: e.message });
    } finally {
      setSending(false);
    }
  };

  if (!to) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
      >
        <Mail className="w-4 h-4" />
        Написати email
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-navy-900">Новий лист</h3>
                <p className="text-xs text-gray-400">
                  Кому: {toName ? `${toName} <${to}>` : to}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Тема</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Тема листа..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 transition"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Повідомлення</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  placeholder="Текст листа..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 transition resize-none"
                />
              </div>

              {result && (
                <p className={`text-sm ${result.ok ? "text-green-600" : "text-red-500"}`}>
                  {result.msg}
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition"
              >
                Скасувати
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !subject.trim() || !body.trim()}
                className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Надсилаємо..." : "Надіслати"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
