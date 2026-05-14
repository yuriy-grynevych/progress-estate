"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users } from "lucide-react";

interface DepositProperty {
  id: string; titleUk: string; district?: string; price: string; currency: string; areaSqm: number;
}
interface Contact {
  id: string; name: string; phone?: string;
}

export default function NewSalePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"OWN" | "EXTERNAL">("OWN");
  const [properties, setProperties] = useState<DepositProperty[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // OWN form state
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [commission, setCommission] = useState("");
  const [commissionType, setCommissionType] = useState("FIXED");
  const [currency, setCurrency] = useState("USD");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  // EXTERNAL form state
  const [extName, setExtName] = useState("");
  const [extAddress, setExtAddress] = useState("");
  const [extClientName, setExtClientName] = useState("");
  const [extClientPhone, setExtClientPhone] = useState("");
  const [extCommission, setExtCommission] = useState("");
  const [extCommissionType, setExtCommissionType] = useState("FIXED");
  const [extCurrency, setExtCurrency] = useState("USD");
  const [extSaleDate, setExtSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [extNote, setExtNote] = useState("");

  useEffect(() => {
    fetch("/api/properties/deposit").then(r => r.json()).then(setProperties).catch(() => {});
    fetch("/api/contacts?type=CLIENT&limit=200").then(r => r.json()).then(d => setContacts(d.contacts ?? d ?? [])).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = tab === "OWN" ? {
      saleType: "OWN",
      propertyId: selectedProperty,
      clientContactId: selectedClient || null,
      commission: commission ? Number(commission) : null,
      commissionType, currency, saleDate, note,
    } : {
      saleType: "EXTERNAL",
      externalName: extName,
      externalAddress: extAddress,
      clientName: extClientName,
      clientPhone: extClientPhone,
      commission: extCommission ? Number(extCommission) : null,
      commissionType: extCommissionType,
      currency: extCurrency,
      saleDate: extSaleDate,
      note: extNote,
    };
    const res = await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/sales");
    } else {
      setError("Помилка збереження. Спробуйте ще раз.");
    }
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900/20 bg-white";
  const labelCls = "block text-xs font-semibold text-gray-500 mb-1";

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Записати продаж</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button type="button" onClick={() => setTab("OWN")}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${tab === "OWN" ? "bg-navy-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-navy-300"}`}>
          <Building2 className="w-4 h-4 inline mr-2" />Наша нерухомість
        </button>
        <button type="button" onClick={() => setTab("EXTERNAL")}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${tab === "EXTERNAL" ? "bg-navy-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-navy-300"}`}>
          <Users className="w-4 h-4 inline mr-2" />З іншої агенції
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        {tab === "OWN" ? (
          <>
            <div>
              <label className={labelCls}>Нерухомість (тільки з завдатком) *</label>
              <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} required className={inputCls}>
                <option value="">— Оберіть об&apos;єкт —</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.titleUk} {p.district ? `· ${p.district}` : ""} · {Number(p.price).toLocaleString("uk-UA")} {p.currency}
                  </option>
                ))}
              </select>
              {properties.length === 0 && <p className="text-xs text-amber-600 mt-1">Немає об&apos;єктів зі статусом &quot;Завдаток&quot;</p>}
            </div>
            <div>
              <label className={labelCls}>Покупець (з бази клієнтів)</label>
              <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className={inputCls}>
                <option value="">— Оберіть клієнта —</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className={labelCls}>Назва нерухомості *</label>
              <input value={extName} onChange={e => setExtName(e.target.value)} required placeholder="напр. 2-кімн. квартира на вул. Незалежності" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Адреса</label>
              <input value={extAddress} onChange={e => setExtAddress(e.target.value)} placeholder="вул., будинок" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Ім&apos;я клієнта</label>
                <input value={extClientName} onChange={e => setExtClientName(e.target.value)} placeholder="Ім'я та прізвище" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Телефон клієнта</label>
                <input value={extClientPhone} onChange={e => setExtClientPhone(e.target.value)} placeholder="067..." className={inputCls} />
              </div>
            </div>
          </>
        )}

        {/* Commission */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <label className={labelCls}>Комісія</label>
            <input type="number" value={tab === "OWN" ? commission : extCommission}
              onChange={e => tab === "OWN" ? setCommission(e.target.value) : setExtCommission(e.target.value)}
              placeholder="0" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Тип</label>
            <select value={tab === "OWN" ? commissionType : extCommissionType}
              onChange={e => tab === "OWN" ? setCommissionType(e.target.value) : setExtCommissionType(e.target.value)}
              className={inputCls}>
              <option value="FIXED">Фіксована</option>
              <option value="PERCENT">Відсоток</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Валюта</label>
            <select value={tab === "OWN" ? currency : extCurrency}
              onChange={e => tab === "OWN" ? setCurrency(e.target.value) : setExtCurrency(e.target.value)}
              className={inputCls}>
              <option value="USD">USD</option>
              <option value="UAH">UAH</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Дата продажу</label>
          <input type="date" value={tab === "OWN" ? saleDate : extSaleDate}
            onChange={e => tab === "OWN" ? setSaleDate(e.target.value) : setExtSaleDate(e.target.value)}
            className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Нотатка</label>
          <textarea rows={2} value={tab === "OWN" ? note : extNote}
            onChange={e => tab === "OWN" ? setNote(e.target.value) : setExtNote(e.target.value)}
            placeholder="Додаткові деталі..." className={`${inputCls} resize-none`} />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Скасувати
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition disabled:opacity-50">
            {saving ? "Зберігаємо..." : "Записати продаж"}
          </button>
        </div>
      </form>
    </div>
  );
}
