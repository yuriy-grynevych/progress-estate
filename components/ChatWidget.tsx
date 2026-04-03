"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Bot, Phone, User, Check, MapPin, Maximize2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PropertySuggestion {
  slug: string;
  title: string;
  price: string;
  area: string | null;
  rooms: number | null;
  district: string | null;
  listingType: string;
  imageUrl: string | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: PropertySuggestion[];
}

type ContactStep = null | { step: "waiting_name"; phone: string } | { step: "waiting_phone"; name: string };

function extractPhone(text: string): string | null {
  const match = text.match(/(\+?380[\s\-]?\d{2}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}|0\d{9}|\d{9,10})/);
  return match ? match[0].replace(/[\s\-]/g, "") : null;
}

const GREETING = {
  uk: "Вітаємо! 👋 Я AI-асистент Progress Estate. Допоможу з питаннями про купівлю, продаж або оренду нерухомості в Івано-Франківську. Чим можу допомогти?",
  en: "Welcome! 👋 I'm the AI assistant of Progress Estate. I can help you with buying, selling or renting property in Ivano-Frankivsk. How can I help you?",
};

const UI = {
  uk: {
    subtitle: "AI-асистент",
    placeholder: "Напишіть повідомлення...",
    leaveContact: "Залишити свої дані",
    contactTitle: "Залишіть контакт",
    contactSub: "Ми зателефонуємо і допоможемо з вибором",
    namePlaceholder: "Ваше ім'я",
    phonePlaceholder: "Номер телефону",
    send: "Надіслати",
    contactSent: "✓ Дякуємо! Ми зв'яжемося з вами найближчим часом.",
    viewProp: "Переглянути",
    sale: "Продаж",
    rent: "Оренда",
  },
  en: {
    subtitle: "AI Assistant",
    placeholder: "Type a message...",
    leaveContact: "Leave your contact",
    contactTitle: "Leave your details",
    contactSub: "We'll call you and help with your search",
    namePlaceholder: "Your name",
    phonePlaceholder: "Phone number",
    send: "Send",
    contactSent: "✓ Thank you! We'll get back to you soon.",
    viewProp: "View",
    sale: "Sale",
    rent: "Rent",
  },
};

export default function ChatWidget() {
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "uk";
  const t = UI[locale];

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETING[locale] },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Contact form state
  const [showContact, setShowContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactSent, setContactSent] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);

  // Conversational contact state
  const [contactStep, setContactStep] = useState<ContactStep>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: GREETING[locale] }]);
    setShowContact(false);
    setContactSent(false);
    setContactStep(null);
  }, [locale]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");

    // ── Conversational contact flow ──────────────────────
    if (contactStep?.step === "waiting_name") {
      const name = text;
      await fetch("/api/chat/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: contactStep.phone, locale, chatHistory: messages.map(({ role, content }) => ({ role, content })) }),
      });
      setContactStep(null);
      setContactSent(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: locale === "uk"
            ? `✅ Дякуємо, ${name}! Ми записали ваші дані і незабаром зателефонуємо. Якщо маєте ще питання — я тут 😊`
            : `✅ Thank you, ${name}! We've noted your details and will call you soon. Feel free to ask more questions 😊`,
        },
      ]);
      return;
    }

    if (contactStep?.step === "waiting_phone") {
      const phone = extractPhone(text);
      if (phone) {
        await fetch("/api/chat/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: contactStep.name, phone, locale, chatHistory: messages.map(({ role, content }) => ({ role, content })) }),
        });
        setContactStep(null);
        setContactSent(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: locale === "uk"
              ? `✅ Дякуємо, ${contactStep.name}! Ми зателефонуємо найближчим часом 😊`
              : `✅ Thank you, ${contactStep.name}! We'll call you soon 😊`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: locale === "uk"
              ? "Будь ласка, введіть номер у форматі +380XXXXXXXXX або 0XXXXXXXXX"
              : "Please enter your number in format +380XXXXXXXXX or 0XXXXXXXXX",
          },
        ]);
      }
      return;
    }

    // ── Detect phone in regular message ──────────────────
    const phone = extractPhone(text);
    if (phone) {
      setContactStep({ step: "waiting_name", phone });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: locale === "uk"
            ? `📞 Записав ваш номер! Як до вас звертатись? Напишіть своє ім'я 👇`
            : `📞 Got your number! What's your name? 👇`,
        },
      ]);
      return;
    }

    // ── Regular AI request ────────────────────────────────
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: text }].map(({ role, content }) => ({ role, content })),
          locale,
        }),
      });
      const data = await res.json();
      const newSuggestions: PropertySuggestion[] = data.suggestions ?? [];
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, suggestions: newSuggestions },
      ]);

      // After showing property suggestions, prompt for contact (once per session)
      if (newSuggestions.length > 0 && !contactSent) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: locale === "uk"
                ? "Зацікавила якась із пропозицій? Залиште свій номер телефону прямо тут — і ми самі зателефонуємо у зручний час 📞"
                : "Interested in any of these? Leave your phone number here and we'll call you at a convenient time 📞",
            },
          ]);
        }, 1200);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: locale === "uk" ? "Вибачте, виникла помилка." : "Sorry, an error occurred." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function submitContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;
    setContactSaving(true);
    try {
      await fetch("/api/chat/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          phone: contactPhone,
          locale,
          chatHistory: messages.map(({ role, content }) => ({ role, content })),
        }),
      });
      setContactSent(true);
    } finally {
      setContactSaving(false);
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-gray-200 bg-white"
          style={{ maxHeight: "min(600px, calc(100vh - 120px))" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-navy-900 text-white flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Image src="/logo.png" alt="Progress Estate" width={36} height={36} className="object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Progress Estate</p>
              <p className="text-white/60 text-xs">{t.subtitle}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-navy-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="max-w-[85%] space-y-2">
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-navy-900 text-white rounded-br-sm"
                        : "bg-white text-gray-800 shadow-sm rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Property suggestion cards */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="space-y-2">
                      {msg.suggestions.map((prop) => (
                        <Link
                          key={prop.slug}
                          href={`/${locale}/listings/${prop.slug}`}
                          target="_blank"
                          className="flex gap-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:border-navy-200 hover:shadow-md transition group"
                        >
                          <div className="w-20 h-20 flex-shrink-0 bg-gray-100 overflow-hidden">
                            {prop.imageUrl ? (
                              <img
                                src={prop.imageUrl}
                                alt={prop.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🏠</div>
                            )}
                          </div>
                          <div className="flex-1 py-2 pr-2 min-w-0">
                            <p className="text-xs text-gold-500 font-semibold">
                              {prop.listingType === "SALE" ? t.sale : t.rent}
                            </p>
                            <p className="text-xs font-semibold text-navy-900 leading-tight line-clamp-2">{prop.title}</p>
                            <p className="text-xs font-bold text-navy-900 mt-1">{prop.price}</p>
                            <div className="flex gap-2 mt-0.5 text-gray-400 text-xs">
                              {prop.area && <span className="flex items-center gap-0.5"><Maximize2 className="w-3 h-3" />{prop.area}</span>}
                              {prop.district && <span className="flex items-center gap-0.5 truncate"><MapPin className="w-3 h-3 flex-shrink-0" />{prop.district}</span>}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start gap-2">
                <div className="w-7 h-7 rounded-full bg-navy-900 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Contact form */}
          {showContact && (
            <div className="border-t border-gray-100 bg-white px-4 py-3 flex-shrink-0">
              {contactSent ? (
                <p className="text-sm text-green-600 font-medium text-center py-1">{t.contactSent}</p>
              ) : (
                <form onSubmit={submitContact} className="space-y-2">
                  <p className="text-xs font-semibold text-navy-900">{t.contactTitle}</p>
                  <p className="text-xs text-gray-400">{t.contactSub}</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder={t.namePlaceholder}
                        className="w-full pl-7 pr-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-navy-400"
                      />
                    </div>
                    <div className="relative flex-1">
                      <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder={t.phonePlaceholder}
                        className="w-full pl-7 pr-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-navy-400"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={contactSaving}
                      className="flex-1 bg-navy-900 text-white text-xs font-medium py-2 rounded-lg hover:bg-navy-800 transition disabled:opacity-50"
                    >
                      {t.send}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowContact(false)}
                      className="px-3 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 bg-white flex-shrink-0">
            {!showContact && !contactSent && (
              <button
                onClick={() => setShowContact(true)}
                title={t.leaveContact}
                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded-xl transition flex-shrink-0"
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
            {contactSent && (
              <div className="w-9 h-9 flex items-center justify-center text-green-500 flex-shrink-0">
                <Check className="w-4 h-4" />
              </div>
            )}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={t.placeholder}
              className="flex-1 text-sm bg-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy-900 placeholder:text-gray-400"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 flex items-center justify-center bg-navy-900 text-white rounded-xl hover:bg-navy-800 transition disabled:opacity-40 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 bg-navy-900 hover:bg-navy-800 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Відкрити чат"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && messages.length === 1 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-400 rounded-full border-2 border-white" />
        )}
      </button>
    </>
  );
}
