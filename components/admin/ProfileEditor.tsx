"use client";

import { useState, useRef } from "react";
import { Camera, Copy, Check, Save, Key, Send, Instagram } from "lucide-react";
import Image from "next/image";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  agentToken: string;
  role: string;
  telegramChatId: string | null;
  instagram: string | null;
}

export default function ProfileEditor({ user }: { user: UserProfile }) {
  const [profile, setProfile] = useState(user);
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [telegramChatId, setTelegramChatId] = useState(user.telegramChatId ?? "");
  const [instagram, setInstagram] = useState(user.instagram ?? "");
  const [telegramSaved, setTelegramSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  async function saveTelegram(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramChatId: telegramChatId || null }),
    });
    if (res.ok) {
      setTelegramSaved(true);
      setTimeout(() => setTelegramSaved(false), 2000);
    }
    setSaving(false);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, instagram: instagram || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setShowPassword(false);
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } else {
      const data = await res.json();
      setPasswordError(data.error ?? "Помилка");
    }
  }

  async function uploadPhoto(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/profile", { method: "POST", body: fd });
    if (res.ok) {
      const { photoUrl } = await res.json();
      setProfile((p) => ({ ...p, photoUrl }));
    }
  }

  function copyAgentLink() {
    const url = `${window.location.origin}/uk/listings?agent=${profile.agentToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Avatar + basic info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
              {profile.photoUrl ? (
                <Image src={profile.photoUrl} alt={profile.name ?? ""} width={80} height={80} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                  {profile.name?.[0]?.toUpperCase() ?? profile.email[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-black text-white rounded-full flex items-center justify-center hover:bg-black/90 transition"
              title="Завантажити фото"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileRef}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadPhoto(f);
                e.target.value = "";
              }}
            />
          </div>

          {/* Name + role */}
          <div className="flex-1">
            <p className="font-bold text-navy-900 text-lg">{profile.name ?? profile.email}</p>
            <p className="text-sm text-gray-400">{profile.email}</p>
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              profile.role === "ADMIN" ? "bg-navy-100 text-navy-900" : "bg-gray-100 text-gray-600"
            }`}>
              {profile.role === "ADMIN" ? "Адміністратор" : "Працівник"}
            </span>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={saveProfile} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Ім'я</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                placeholder="Ваше ім'я"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Телефон</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                placeholder="+380..."
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Instagram</label>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                placeholder="@username"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/90 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Збереження..." : "Зберегти"}
            </button>
            {saved && <span className="text-green-600 text-sm font-medium">Збережено ✓</span>}
          </div>
        </form>
      </div>

      {/* Agent token */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-navy-900 mb-1">Мій токен агента</h2>
        <p className="text-sm text-gray-500 mb-4">
          Щоб надіслати клієнту посилання на конкретну нерухомість зі своїми контактними даними — перейдіть до{" "}
          <a href="/admin/properties" className="text-gold-500 hover:underline font-medium">списку нерухомості</a>{" "}
          і натисніть іконку 🔗 біля потрібного об'єкта. Клієнт побачить вашу картку замість агента, якому призначена нерухомість.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Формат посилання</p>
          <code className="block text-xs text-gray-600 font-mono break-all">
            /uk/listings/<span className="text-navy-900 font-semibold">назва-обєкта</span>?t=<span className="text-gold-600">{profile.agentToken}</span>
          </code>
        </div>
      </div>

      {/* Telegram */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-navy-900 mb-1">Telegram сповіщення</h2>
        <p className="text-sm text-gray-500 mb-4">
          Підключіть Telegram, щоб отримувати нагадування про клієнтів та нерухомість.{" "}
          Напишіть боту{" "}
          <a
            href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "your_bot"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-500 hover:underline font-medium"
          >
            @{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "YourBot"}
          </a>{" "}
          команду <code className="bg-gray-100 px-1 rounded text-xs">/myid</code> — він надішле вам ваш Chat ID.
        </p>
        <form onSubmit={saveTelegram} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500 block mb-1">Chat ID</label>
            <input
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
              placeholder="123456789"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/90 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Зберегти
            </button>
            {telegramSaved && <span className="text-green-600 text-sm font-medium">Збережено ✓</span>}
          </div>
        </form>
        {profile.telegramChatId && (
          <p className="mt-2 text-xs text-green-600 font-medium">
            ✓ Telegram підключено (ID: {profile.telegramChatId})
          </p>
        )}
      </div>

      {/* Password change */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy-900">Змінити пароль</h2>
          {passwordSaved && <span className="text-green-600 text-sm font-medium">Пароль змінено ✓</span>}
        </div>
        {!showPassword ? (
          <button
            onClick={() => setShowPassword(true)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-navy-900 transition"
          >
            <Key className="w-4 h-4" />
            Змінити пароль
          </button>
        ) : (
          <form onSubmit={changePassword} className="space-y-3">
            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Поточний пароль</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Новий пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                placeholder="Мін. 6 символів"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/90 transition"
              >
                Змінити
              </button>
              <button
                type="button"
                onClick={() => { setShowPassword(false); setPasswordError(""); }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Скасувати
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
