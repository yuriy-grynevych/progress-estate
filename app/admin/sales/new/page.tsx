"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, HardHat } from "lucide-react";
import { JK_DATA } from "@/lib/map-data";

const JK_NAMES = [...new Set(JK_DATA.map(j => j.name))].sort((a, b) => a.localeCompare(b, "uk"));

// Забудовники Івано-Франківська (джерело: lun.ua)
const DEVELOPERS = [
  "AI Development", "ALEXA Development", "Alliance developer", "AlonBud",
  "Altis-Holding", "ARHA GROUP", "Архітрав", "АРС-Дім",
  "Аркада", "Atlant-ІФ", "BAUcomfort", "Blago",
  "CEMMIX UA", "Continental Development", "Ecobud Berghaus", "EFFECTBUD Developer",
  "Enhance Development", "Єврохолдінг", "Fomich Group", "ФранківськМіськБуд",
  "Франківський Дім", "Франко Груп", "ГалКомБуд", "Галицький двір",
  "ГарантПлюсБуд", "GREENWOOD Development", "Grim Invest", "ІБК Нове Місто",
  "Інвестбуд", "In West City Плюс", "Івано-Франківськбуд", "Івано-Франківськміськбуд",
  "KD-ENGINEERING", "Kontilium Group", "Ковчег", "КалушБуд-Інвест",
  "КБК Форум", "KVARTAL", "LEV Development", "ЛММ Сервіс",
  "Лісна", "LTBud", "MARKSEM", "MBA Development Group",
  "MBT Group", "МЖК Експрес-24", "M Group Development", "ND Group Development",
  "Novator Group", "NUMO Development", "Новий Дім Буд", "OCTO development group",
  "Open City Group", "OZON Development", "Perfect Group", "Перспектива",
  "Phoenix Invest", "Полярис", "Premier Development", "PROSTIR development",
  "Ridnobud", "Ріел ІФ", "Роко Буд", "СБ ГРУП",
  "Sensar", "Skogur", "Sociat Invest Group", "Socium Developer",
  "Спілка забудівників", "СТАБІЛЬНІСТЬ", "Стандарт-ІФ", "Sttk Development",
  "Технобуд", "Темп", "Тенко", "TheSolomonBud",
  "Траян", "UBH", "УЛІС Інвестиції", "VAMBUD",
  "VD Group", "Vertical Development", "VERTEX", "YARD DEVELOPMENT",
  "Ярковиця", "Злагода-Буд",
].sort((a, b) => a.localeCompare(b, "uk"));

interface DepositProperty { id: string; titleUk: string; district?: string; price: string; currency: string; areaSqm: number; }
interface AllProperty { id: string; titleUk: string; district?: string; }
interface Contact { id: string; name: string; phone?: string; }

type Tab = "OWN" | "EXTERNAL" | "DEVELOPER";

function calcCommission(amount: string, pct: string): string {
  const a = parseFloat(amount);
  const p = parseFloat(pct);
  if (!a || !p) return "";
  return (a * p / 100).toLocaleString("uk-UA", { maximumFractionDigits: 0 });
}

export default function NewSalePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("OWN");
  const [properties, setProperties] = useState<DepositProperty[]>([]);
  const [allProperties, setAllProperties] = useState<AllProperty[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── OWN ──
  const [ownProperty, setOwnProperty] = useState("");
  const [ownClient, setOwnClient] = useState("");
  const [ownCommission, setOwnCommission] = useState("");
  const [ownCommissionType, setOwnCommissionType] = useState("FIXED");
  const [ownCurrency, setOwnCurrency] = useState("USD");
  const [ownDealPrice, setOwnDealPrice] = useState("");
  const [ownDate, setOwnDate] = useState(new Date().toISOString().slice(0, 10));
  const [ownNote, setOwnNote] = useState("");

  // ── EXTERNAL ──
  const [extAgency, setExtAgency] = useState("");
  const [extName, setExtName] = useState("");
  const [extAddress, setExtAddress] = useState("");
  const [extClient, setExtClient] = useState("");
  const [extCommission, setExtCommission] = useState("");
  const [extCommissionType, setExtCommissionType] = useState("FIXED");
  const [extCurrency, setExtCurrency] = useState("USD");
  const [extDealPrice, setExtDealPrice] = useState("");
  const [extDate, setExtDate] = useState(new Date().toISOString().slice(0, 10));
  const [extNote, setExtNote] = useState("");

  // ── DEVELOPER ──
  const [devJK, setDevJK] = useState("");
  const [devDeveloper, setDevDeveloper] = useState("");
  const [devClient, setDevClient] = useState("");
  const [devCommission, setDevCommission] = useState("");
  const [devCommissionType, setDevCommissionType] = useState("FIXED");
  const [devCurrency, setDevCurrency] = useState("USD");
  const [devDealPrice, setDevDealPrice] = useState("");
  const [devDate, setDevDate] = useState(new Date().toISOString().slice(0, 10));
  const [devNote, setDevNote] = useState("");

  useEffect(() => {
    fetch("/api/properties/deposit").then(r => r.json()).then(setProperties).catch(() => {});
    fetch("/api/properties/list").then(r => r.json()).then(setAllProperties).catch(() => {});
    fetch("/api/contacts?type=CLIENT&limit=200").then(r => r.json()).then(d => setContacts(d.contacts ?? d ?? [])).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === "OWN" && !ownClient) { setError("Оберіть клієнта — продаж без клієнта неможливий."); return; }
    if (tab === "EXTERNAL" && !extAgency.trim()) { setError("Вкажіть назву агенції."); return; }
    if (tab === "DEVELOPER" && !devClient) { setError("Оберіть клієнта — обов'язкове поле."); return; }
    if (tab === "DEVELOPER" && !devJK.trim()) { setError("Вкажіть назву ЖК."); return; }

    setSaving(true);
    setError("");

    const body =
      tab === "OWN" ? {
        saleType: "OWN",
        propertyId: ownProperty || null,
        clientContactId: ownClient || null,
        commission: ownCommission ? Number(ownCommission) : null,
        commissionType: ownCommissionType,
        dealPrice: ownDealPrice ? Number(ownDealPrice) : null,
        currency: ownCurrency, saleDate: ownDate, note: ownNote,
      } : tab === "EXTERNAL" ? {
        saleType: "EXTERNAL",
        externalAgency: extAgency,
        externalName: extName,
        externalAddress: extAddress,
        clientContactId: extClient || null,
        commission: extCommission ? Number(extCommission) : null,
        commissionType: extCommissionType,
        dealPrice: extDealPrice ? Number(extDealPrice) : null,
        currency: extCurrency, saleDate: extDate, note: extNote,
      } : {
        saleType: "DEVELOPER",
        externalAgency: devDeveloper,
        externalName: devJK,
        clientContactId: devClient,
        commission: devCommission ? Number(devCommission) : null,
        commissionType: devCommissionType,
        dealPrice: devDealPrice ? Number(devDealPrice) : null,
        currency: devCurrency, saleDate: devDate, note: devNote,
      };

    const res = await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) router.push("/admin/sales");
    else setError("Помилка збереження. Спробуйте ще раз.");
  }

  const inp = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-900/20 bg-white";
  const lbl = "block text-xs font-semibold text-gray-500 mb-1";

  // active commission state per tab
  const commType = tab === "OWN" ? ownCommissionType : tab === "EXTERNAL" ? extCommissionType : devCommissionType;
  const commVal  = tab === "OWN" ? ownCommission  : tab === "EXTERNAL" ? extCommission  : devCommission;
  const dealVal  = tab === "OWN" ? ownDealPrice   : tab === "EXTERNAL" ? extDealPrice   : devDealPrice;
  const currVal  = tab === "OWN" ? ownCurrency    : tab === "EXTERNAL" ? extCurrency    : devCurrency;
  const dateVal  = tab === "OWN" ? ownDate        : tab === "EXTERNAL" ? extDate        : devDate;
  const noteVal  = tab === "OWN" ? ownNote        : tab === "EXTERNAL" ? extNote        : devNote;

  const setCommType  = tab === "OWN" ? setOwnCommissionType : tab === "EXTERNAL" ? setExtCommissionType : setDevCommissionType;
  const setCommVal   = tab === "OWN" ? setOwnCommission  : tab === "EXTERNAL" ? setExtCommission  : setDevCommission;
  const setDealVal   = tab === "OWN" ? setOwnDealPrice   : tab === "EXTERNAL" ? setExtDealPrice   : setDevDealPrice;
  const setCurrVal   = tab === "OWN" ? setOwnCurrency    : tab === "EXTERNAL" ? setExtCurrency    : setDevCurrency;
  const setDateVal   = tab === "OWN" ? setOwnDate        : tab === "EXTERNAL" ? setExtDate        : setDevDate;
  const setNoteVal   = tab === "OWN" ? setOwnNote        : tab === "EXTERNAL" ? setExtNote        : setDevNote;

  const calcResult = commType === "PERCENT" && dealVal && commVal
    ? calcCommission(dealVal, commVal)
    : null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Записати продаж</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["OWN", "EXTERNAL", "DEVELOPER"] as Tab[]).map(t => (
          <button key={t} type="button" onClick={() => { setTab(t); setError(""); }}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-1.5
              ${tab === t ? "bg-navy-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-navy-300"}`}>
            {t === "OWN" && <><Building2 className="w-4 h-4" />Наша</>}
            {t === "EXTERNAL" && <><Users className="w-4 h-4" />З агенції</>}
            {t === "DEVELOPER" && <><HardHat className="w-4 h-4" />Від забудовника</>}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gold-300 p-6 space-y-4">

        {/* ── OWN ── */}
        {tab === "OWN" && (
          <>
            <div>
              <label className={lbl}>Нерухомість (тільки з завдатком) *</label>
              <select value={ownProperty} onChange={e => setOwnProperty(e.target.value)} className={inp}>
                <option value="">— Оберіть об'єкт —</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.titleUk}{p.district ? ` · ${p.district}` : ""} · {Number(p.price).toLocaleString("uk-UA")} {p.currency}
                  </option>
                ))}
              </select>
              {properties.length === 0 && <p className="text-xs text-amber-600 mt-1">Немає об'єктів зі статусом «Завдаток»</p>}
            </div>
            <div>
              <label className={lbl}>Покупець <span className="text-red-500">*</span></label>
              <select value={ownClient} onChange={e => setOwnClient(e.target.value)} className={`${inp} ${!ownClient ? "border-red-200" : ""}`}>
                <option value="">— Оберіть клієнта —</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
              </select>
              {!ownClient && <p className="text-xs text-red-400 mt-1">Обов'язкове поле</p>}
            </div>
          </>
        )}

        {/* ── EXTERNAL ── */}
        {tab === "EXTERNAL" && (
          <>
            <div>
              <label className={lbl}>Назва агенції <span className="text-red-500">*</span></label>
              <input value={extAgency} onChange={e => setExtAgency(e.target.value)}
                placeholder="напр. АН «Нова Хата»"
                className={`${inp} ${!extAgency.trim() ? "border-red-200" : ""}`} />
              {!extAgency.trim() && <p className="text-xs text-red-400 mt-1">Обов'язкове поле</p>}
            </div>
            <div>
              <label className={lbl}>Назва нерухомості *</label>
              <input
                list="prop-list"
                value={extName}
                onChange={e => setExtName(e.target.value)}
                required
                placeholder="Оберіть з наших або введіть вручну..."
                className={inp}
              />
              <datalist id="prop-list">
                {allProperties.map(p => (
                  <option key={p.id} value={p.titleUk}>
                    {p.district ? p.district : ""}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className={lbl}>Адреса</label>
              <input value={extAddress} onChange={e => setExtAddress(e.target.value)} placeholder="вул., будинок" className={inp} />
            </div>
            <div>
              <label className={lbl}>Покупець (з бази клієнтів)</label>
              <select value={extClient} onChange={e => setExtClient(e.target.value)} className={inp}>
                <option value="">— Оберіть клієнта —</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
              </select>
            </div>
          </>
        )}

        {/* ── DEVELOPER ── */}
        {tab === "DEVELOPER" && (
          <>
            <div>
              <label className={lbl}>Назва ЖК <span className="text-red-500">*</span></label>
              <input
                list="jk-list"
                value={devJK}
                onChange={e => setDevJK(e.target.value)}
                placeholder="Оберіть або введіть назву ЖК..."
                className={`${inp} ${!devJK.trim() ? "border-red-200" : ""}`}
              />
              <datalist id="jk-list">
                {JK_NAMES.map(n => <option key={n} value={n} />)}
              </datalist>
              {!devJK.trim() && <p className="text-xs text-red-400 mt-1">Обов'язкове поле</p>}
            </div>
            <div>
              <label className={lbl}>Забудовник</label>
              <input
                list="dev-list"
                value={devDeveloper}
                onChange={e => setDevDeveloper(e.target.value)}
                placeholder="Оберіть або введіть назву забудовника..."
                className={inp}
              />
              <datalist id="dev-list">
                {DEVELOPERS.map(n => <option key={n} value={n} />)}
              </datalist>
            </div>
            <div>
              <label className={lbl}>Клієнт <span className="text-red-500">*</span></label>
              <select value={devClient} onChange={e => setDevClient(e.target.value)}
                className={`${inp} ${!devClient ? "border-red-200" : ""}`}>
                <option value="">— Оберіть клієнта —</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
              </select>
              {!devClient && <p className="text-xs text-red-400 mt-1">Обов'язкове поле</p>}
            </div>
          </>
        )}

        {/* ── Shared: Commission ── */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={lbl}>Комісія</label>
            <input type="number" value={commVal} onChange={e => setCommVal(e.target.value)} placeholder="0" className={inp} />
          </div>
          <div>
            <label className={lbl}>Тип</label>
            <select value={commType} onChange={e => setCommType(e.target.value)} className={inp}>
              <option value="FIXED">Фіксована</option>
              <option value="PERCENT">Відсоток %</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Валюта</label>
            <select value={currVal} onChange={e => setCurrVal(e.target.value)} className={inp}>
              <option value="USD">USD</option>
              <option value="UAH">UAH</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Deal price — shown only for PERCENT commission */}
        {commType === "PERCENT" && (
          <div>
            <label className={lbl}>Сума угоди (база для розрахунку %)</label>
            <input type="number" value={dealVal} onChange={e => setDealVal(e.target.value)}
              placeholder="напр. 50000" className={inp} />
            {calcResult && (
              <p className="text-xs text-emerald-600 mt-1 font-semibold">
                = {calcResult} {currVal} ({commVal}% від {Number(dealVal).toLocaleString("uk-UA")})
              </p>
            )}
          </div>
        )}

        {/* ── Shared: Date & Note ── */}
        <div>
          <label className={lbl}>Дата продажу</label>
          <input type="date" value={dateVal} onChange={e => setDateVal(e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Нотатка</label>
          <textarea rows={2} value={noteVal} onChange={e => setNoteVal(e.target.value)}
            placeholder="Додаткові деталі..." className={`${inp} resize-none`} />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Скасувати
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition disabled:opacity-50">
            {saving ? "Зберігаємо..." : "Записати продаж"}
          </button>
        </div>
      </form>
    </div>
  );
}
