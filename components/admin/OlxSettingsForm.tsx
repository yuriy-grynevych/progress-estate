"use client";
import { useState, useEffect } from "react";
import { Save, Check, ExternalLink } from "lucide-react";

interface OlxSettings {
  olx_client_id: string;
  olx_client_secret: string;
  olx_city_id: string;
  olx_contact_phone: string;
  olx_advertiser_type: string;
}

const DEFAULTS: OlxSettings = {
  olx_client_id: "",
  olx_client_secret: "",
  olx_city_id: "12",
  olx_contact_phone: "",
  olx_advertiser_type: "business",
};

const FIELDS = [
  { key: "olx_client_id",      label: "Client ID",          type: "text",     placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", half: false },
  { key: "olx_client_secret",  label: "Client Secret",      type: "password", placeholder: "••••••••••••",                         half: false },
  { key: "olx_city_id",        label: "ID міста (OLX)",     type: "number",   placeholder: "12 (Івано-Франківськ)",                 half: true  },
  { key: "olx_contact_phone",  label: "Телефон контакту",   type: "tel",      placeholder: "+380671234567",                         half: true  },
] as const;

export default function OlxSettingsForm() {
  const [values, setValues] = useState<OlxSettings>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/olx/settings")
      .then((r) => r.json())
      .then((d) => setValues((v) => ({ ...v, ...d })))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/olx/settings", {
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

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">
        Отримайте Client ID та Secret у{" "}
        <a
          href="https://www.olx.ua/api/partner/docs/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-500 hover:underline inline-flex items-center gap-1"
        >
          OLX Partner API <ExternalLink className="w-3 h-3" />
        </a>
      </p>

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

        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Тип оголошувача</label>
          <select
            value={values.olx_advertiser_type}
            onChange={(e) => setValues((v) => ({ ...v, olx_advertiser_type: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 transition bg-white"
          >
            <option value="business">Бізнес (business)</option>
            <option value="private">Приватна особа (private)</option>
          </select>
        </div>
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
