"use client";
import { useState, useEffect } from "react";
import { Save, Check, Mail, TestTube } from "lucide-react";

interface EmailSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  smtp_from_name: string;
  smtp_from_email: string;
}

const DEFAULTS: EmailSettings = {
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_password: "",
  smtp_from_name: "Progress Estate",
  smtp_from_email: "",
};

const FIELDS = [
  { key: "smtp_host",       label: "SMTP Хост",        type: "text",     placeholder: "smtp.gmail.com",        half: true },
  { key: "smtp_port",       label: "Порт",              type: "number",   placeholder: "587",                   half: true },
  { key: "smtp_user",       label: "Логін (email)",     type: "email",    placeholder: "your@gmail.com",        half: false },
  { key: "smtp_password",   label: "Пароль / App key",  type: "password", placeholder: "••••••••••••",          half: false },
  { key: "smtp_from_name",  label: "Ім'я відправника",  type: "text",     placeholder: "Progress Estate",       half: true },
  { key: "smtp_from_email", label: "Email відправника", type: "email",    placeholder: "info@progressestate.ua",half: true },
] as const;

export default function EmailSettingsForm() {
  const [values, setValues] = useState<EmailSettings>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/email/settings")
      .then((r) => r.json())
      .then((d) => setValues((v) => ({ ...v, ...d })))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/email/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: values.smtp_from_email || values.smtp_user,
          subject: "Тест SMTP — Progress Estate",
          html: "<p>Тестовий лист від <strong>Progress Estate CRM</strong>. SMTP налаштовано успішно.</p>",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setTestResult({ ok: true, msg: "Лист надіслано успішно!" });
    } catch (e: any) {
      setTestResult({ ok: false, msg: e.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELDS.map(({ key, label, type, placeholder, half }) => (
          <div key={key} className={half ? "" : "sm:col-span-2"}>
            <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
            <input
              type={type}
              value={values[key]}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 transition"
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {testResult && (
        <p className={`text-sm ${testResult.ok ? "text-green-600" : "text-red-500"}`}>
          {testResult.msg}
        </p>
      )}

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Збережено!" : saving ? "Збереження..." : "Зберегти"}
        </button>
        <button
          onClick={handleTest}
          disabled={testing || !values.smtp_host}
          className="flex items-center gap-2 border border-gray-200 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-40"
        >
          <TestTube className="w-4 h-4" />
          {testing ? "Надсилаємо..." : "Тест з'єднання"}
        </button>
      </div>
    </div>
  );
}
