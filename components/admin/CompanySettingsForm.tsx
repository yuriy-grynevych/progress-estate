"use client";
import { useState } from "react";
import { Save, Check } from "lucide-react";

interface CompanySettingsFormProps {
  initial: {
    phone: string;
    email: string;
    address: string;
    instagram: string;
    facebook: string;
  };
}

const FIELDS = [
  { key: "phone",     label: "Телефон",   type: "tel",  placeholder: "+380 67 123 45 67" },
  { key: "email",     label: "Email",      type: "email",placeholder: "info@progressestate.com.ua" },
  { key: "address",   label: "Адреса",    type: "text", placeholder: "м. Івано-Франківськ" },
  { key: "instagram", label: "Instagram", type: "url",  placeholder: "https://www.instagram.com/..." },
  { key: "facebook",  label: "Facebook",  type: "url",  placeholder: "https://www.facebook.com/..." },
] as const;

export default function CompanySettingsForm({ initial }: CompanySettingsFormProps) {
  const [values, setValues] = useState({ ...initial });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/company-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELDS.map(({ key, label, type, placeholder }) => (
          <div key={key}>
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

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50"
      >
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "Збережено!" : saving ? "Збереження..." : "Зберегти"}
      </button>
    </div>
  );
}
