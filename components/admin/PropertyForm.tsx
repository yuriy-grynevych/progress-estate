"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MessageSquarePlus, MapPin, Home, Building2, Layers, DollarSign,
  FileText, Image, Info, ChevronLeft, Save, Loader2, X, Tag, Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  PROPERTY_TYPES, PROPERTY_CATEGORIES, LISTING_TYPES, CURRENCIES,
  DISTRICTS_IF, PROPERTY_FEATURES, RESIDENTIAL_COMPLEXES_IF,
  SOURCE_OPTIONS, COMMISSION_TYPES,
} from "@/lib/constants";
import ImageUploader from "./ImageUploader";
import { cn } from "@/lib/utils";
import { JK_DATA } from "@/lib/map-data";

const TiptapEditor = dynamic(() => import("./TiptapEditor"), { ssr: false });
const MapPicker    = dynamic(() => import("./MapPicker"),    { ssr: false });

// ── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  titleUk: z.string().min(1, "Обов'язкове поле"),
  type: z.string().min(1),
  listingType: z.string().min(1),
  status: z.string().min(1),
  price: z.number({ message: "Вкажіть ціну" }).positive("Вкажіть ціну"),
  currency: z.string().min(1),
  areaSqm: z.number({ message: "Вкажіть площу" }).positive("Вкажіть площу"),
  rooms: z.number().nullable().optional(),
  bedrooms: z.number().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  floor: z.number().nullable().optional(),
  totalFloors: z.number().nullable().optional(),
  yearBuilt: z.number().nullable().optional(),
  kitchenSqm: z.number().nullable().optional(),
  gasType: z.string().optional().nullable(),
  renovationType: z.string().optional().nullable(),
  buildingStage: z.string().optional().nullable(),
  wallType: z.string().optional().nullable(),
  houseNumber: z.string().optional().nullable(),
  apartmentNumber: z.string().optional().nullable(),
  apartmentLetter: z.string().optional().nullable(),
  residentialComplex: z.string().optional().nullable(),
  landmark: z.string().optional().nullable(),
  pricePer: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  commissionAmount: z.number().optional().nullable(),
  commissionType: z.string().optional().nullable(),
  commissionCurrency: z.string().optional().nullable(),
  internalNote: z.string().optional().nullable(),
  district: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  descriptionUk: z.string().default(""),
  descriptionEn: z.string().default(""),
  features: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  assignedUserId: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface PropertyImage   { id: string; url: string; isPrimary: boolean; }
interface Employee        { id: string; name: string | null; email: string; }
interface FeatureOption   { id: string; value: string; labelUk: string; labelEn: string; }
interface AgentComment    { text: string; author: string; createdAt: string; }

interface PropertyFormProps {
  initialData?: Partial<FormData> & { id?: string; images?: PropertyImage[]; assignedUserId?: string | null; agentComments?: AgentComment[]; };
  employees?: Employee[];
  featureOptions?: FeatureOption[];
  role?: "ADMIN" | "EMPLOYEE";
  currentUserId?: string;
  currentUserName?: string;
}

// ── UI primitives ─────────────────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input ref={ref} {...props}
      className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm
        focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900 transition-all placeholder:text-gray-300 ${className}`} />
  )
);
Input.displayName = "Input";

function FSelect({ children, className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props}
      className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm
        focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900 transition-all ${className}`}>
      {children}
    </select>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gold-300 shadow-sm border border-gold-300 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
      <span className="text-gray-400">{icon}</span>
      <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{title}</h2>
    </div>
  );
}

// ── Status configs ────────────────────────────────────────────────────────────
const STATUS_CONFIG = [
  { value: "ACTIVE",   label: "Активне",   dot: "bg-emerald-400" },
  { value: "INACTIVE", label: "Неактивне", dot: "bg-gray-300" },
  { value: "SOLD",     label: "Продано",   dot: "bg-red-400" },
  { value: "RENTED",   label: "Здано",     dot: "bg-blue-400" },
  { value: "DEPOSIT",  label: "Завдаток",  dot: "bg-amber-400" },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function PropertyForm({
  initialData, employees = [], featureOptions, role = "EMPLOYEE", currentUserId, currentUserName
}: PropertyFormProps) {
  const router = useRouter();
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState(initialData?.id ?? "new");
  const [images, setImages]       = useState<PropertyImage[]>(initialData?.images ?? []);
  const [comments, setComments]   = useState<AgentComment[]>((initialData?.agentComments as AgentComment[]) ?? []);
  const [commentInput, setCommentInput] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const isEdit = Boolean(initialData?.id);

  function getCategoryFromType(t: string): string {
    if (["APARTMENT","ROOM","HOUSE","APARTMENT_PREMIUM","VILLA","PENTHOUSE","TOWNHOUSE","DUPLEX"].includes(t)) return "RESIDENTIAL";
    if (["LAND","LAND_INDIVIDUAL","LAND_GARDEN","LAND_FARM","LAND_COMMERCIAL"].includes(t)) return "LAND";
    return "COMMERCIAL";
  }
  const [category, setCategory] = useState<string>(() => getCategoryFromType(initialData?.type ?? "APARTMENT"));

  const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      titleUk: initialData?.titleUk ?? "",
      type: initialData?.type ?? "APARTMENT",
      listingType: initialData?.listingType ?? "SALE",
      status: initialData?.status ?? "ACTIVE",
      price: initialData?.price != null ? Number(initialData.price) : undefined,
      currency: initialData?.currency ?? "USD",
      areaSqm: initialData?.areaSqm != null ? Number(initialData.areaSqm) : undefined,
      rooms: initialData?.rooms ?? null,
      bedrooms: initialData?.bedrooms ?? null,
      bathrooms: initialData?.bathrooms ?? null,
      floor: initialData?.floor ?? null,
      totalFloors: initialData?.totalFloors ?? null,
      yearBuilt: initialData?.yearBuilt ?? null,
      kitchenSqm: (initialData as any)?.kitchenSqm ?? null,
      gasType: (initialData as any)?.gasType ?? "",
      renovationType: (initialData as any)?.renovationType ?? "",
      buildingStage: (initialData as any)?.buildingStage ?? "",
      wallType: (initialData as any)?.wallType ?? "",
      houseNumber: (initialData as any)?.houseNumber ?? "",
      apartmentNumber: (initialData as any)?.apartmentNumber ?? "",
      apartmentLetter: (initialData as any)?.apartmentLetter ?? "",
      residentialComplex: (initialData as any)?.residentialComplex ?? "",
      landmark: (initialData as any)?.landmark ?? "",
      pricePer: (initialData as any)?.pricePer ?? "OBJECT",
      source: (initialData as any)?.source ?? "",
      commissionAmount: (initialData as any)?.commissionAmount ?? null,
      commissionType: (initialData as any)?.commissionType ?? "FIXED",
      commissionCurrency: (initialData as any)?.commissionCurrency ?? "USD",
      internalNote: (initialData as any)?.internalNote ?? "",
      district: initialData?.district ?? "",
      address: initialData?.address ?? "",
      latitude: initialData?.latitude ?? null,
      longitude: initialData?.longitude ?? null,
      descriptionUk: initialData?.descriptionUk ?? "",
      descriptionEn: initialData?.descriptionEn ?? "",
      features: initialData?.features ?? [],
      isFeatured: initialData?.isFeatured ?? false,
      assignedUserId: initialData?.assignedUserId ?? (role === "EMPLOYEE" ? currentUserId : null),
    },
  });

  const watchedListingType = watch("listingType");
  const watchedStatus      = watch("status");
  const watchedType        = watch("type");

  const jkGeocodingRef = useRef(false);
  const addressValue = watch("address");

  useEffect(() => {
    if (!addressValue || addressValue.length < 5 || jkGeocodingRef.current) return;
    const timer = setTimeout(async () => {
      if (jkGeocodingRef.current) return;
      try {
        const q = encodeURIComponent(`${addressValue}, Івано-Франківськ`);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ua`,
          { headers: { "Accept-Language": "uk" } }
        );
        const results = await res.json();
        if (results[0]) {
          setValue("latitude", parseFloat(results[0].lat));
          setValue("longitude", parseFloat(results[0].lon));
        }
      } catch {}
    }, 900);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressValue]);

  async function addComment() {
    const text = commentInput.trim();
    if (!text) return;
    if (isEdit && initialData?.id) {
      setCommentSaving(true);
      try {
        const res = await fetch(`/api/properties/${initialData.id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments);
          setCommentInput("");
        }
      } finally {
        setCommentSaving(false);
      }
    } else {
      setComments((prev) => [...prev, { text, author: currentUserName ?? "", createdAt: new Date().toISOString() }]);
      setCommentInput("");
    }
  }

  async function deleteComment(index: number) {
    if (isEdit && initialData?.id) {
      const res = await fetch(`/api/properties/${initialData.id}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } else {
      setComments((prev) => prev.filter((_, idx) => idx !== index));
    }
  }

  async function generateDescription() {
    setGenerating(true);
    const v = watch();
    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: v.type,
          listingType: v.listingType,
          district: v.district,
          address: v.address,
          residentialComplex: (v as any).residentialComplex,
          areaSqm: v.areaSqm,
          kitchenSqm: (v as any).kitchenSqm,
          rooms: v.rooms,
          bedrooms: v.bedrooms,
          bathrooms: v.bathrooms,
          floor: v.floor,
          totalFloors: v.totalFloors,
          yearBuilt: v.yearBuilt,
          renovationType: (v as any).renovationType,
          heatingType: (v as any).heatingType,
          price: v.price,
          currency: v.currency,
        }),
      });
      if (res.ok) {
        const { html } = await res.json();
        if (html) setValue("descriptionUk", html);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function onSubmit(data: any) {
    setSaving(true);
    setSaveError(null);
    const method = isEdit ? "PUT" : "POST";
    const url    = isEdit ? `/api/properties/${initialData!.id}` : "/api/properties";
    const toN    = (v: unknown) => { const n = parseFloat(String(v)); return isNaN(n) ? null : n; };

    let descriptionEn = data.descriptionEn ?? "";
    let titleEn = initialData?.titleEn ?? "";
    const translatePromises: Promise<void>[] = [];

    if (data.descriptionUk?.trim()) {
      translatePromises.push(
        fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: data.descriptionUk }) })
          .then((r) => r.json()).then((d) => { if (d.translated) descriptionEn = d.translated; }).catch(() => {})
      );
    }
    if (data.titleUk?.trim()) {
      translatePromises.push(
        fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: data.titleUk }) })
          .then((r) => r.json()).then((d) => { if (d.translated) titleEn = d.translated; }).catch(() => {})
      );
    }
    await Promise.all(translatePromises);

    const body = {
      ...data, descriptionEn, titleEn,
      rooms: toN(data.rooms), bedrooms: toN(data.bedrooms), bathrooms: toN(data.bathrooms),
      floor: toN(data.floor), totalFloors: toN(data.totalFloors), yearBuilt: toN(data.yearBuilt),
      kitchenSqm: toN(data.kitchenSqm), latitude: toN(data.latitude), longitude: toN(data.longitude),
      agentComments: comments,
    };

    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        const json = await res.json();
        if (!isEdit) setPropertyId(json.id);
        router.push("/admin/properties");
        router.refresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        const fieldErrors = errData?.error?.fieldErrors;
        if (fieldErrors) {
          const msgs = Object.entries(fieldErrors).map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`).join("; ");
          setSaveError(`Помилка валідації: ${msgs}`);
        } else {
          setSaveError(`Помилка збереження (${res.status}). Перевірте всі поля.`);
        }
      }
    } catch (e: any) {
      setSaveError(`Мережева помилка: ${e?.message ?? "невідома"}`);
    }
    setSaving(false);
  }

  const filteredTypes = PROPERTY_TYPES.filter(t => t.category === category);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto pb-10">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-gray-100/95 backdrop-blur-sm py-4 mb-6 flex items-center gap-3">
        <button type="button" onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-white transition text-gray-400 hover:text-gray-700 border border-transparent hover:border-gray-200">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">
            {isEdit ? "Редагування нерухомості" : "Нова нерухомість"}
          </h1>
          {isEdit && initialData?.titleUk && (
            <p className="text-xs text-gray-400 truncate max-w-xs">{initialData.titleUk}</p>
          )}
        </div>
        <div className="ml-auto flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <button type="button" onClick={() => router.back()}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition rounded-xl hover:bg-white border border-transparent hover:border-gray-200">
              Скасувати
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-navy-900 text-white rounded-xl text-sm font-semibold hover:bg-navy-800 transition disabled:opacity-60 shadow-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Збереження..." : isEdit ? "Зберегти" : "Створити"}
            </button>
          </div>
          {saveError && (
            <p className="text-xs text-red-500 max-w-sm text-right">{saveError}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-5">

          {/* ── 1. Тип угоди + Категорія + Тип ── */}
          <Card>
            <CardHeader icon={<Tag className="w-4 h-4" />} title="Класифікація" />
            <div className="p-6 space-y-5">

              {/* Тип угоди */}
              <div>
                <Label required>Тип угоди</Label>
                <div className="flex gap-1.5 p-1 bg-gray-50 border border-gray-100 rounded-xl w-fit">
                  {LISTING_TYPES.map((lt) => (
                    <button key={lt.value} type="button"
                      onClick={() => setValue("listingType", lt.value as any)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150",
                        watchedListingType === lt.value
                          ? "bg-white text-navy-900 shadow-sm border border-gray-200"
                          : "text-gray-500 hover:text-gray-700"
                      )}>
                      {lt.labelUk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Категорія */}
              <div>
                <Label required>Категорія</Label>
                <div className="flex gap-1.5">
                  {PROPERTY_CATEGORIES.map((c) => (
                    <button key={c.value} type="button"
                      onClick={() => {
                        setCategory(c.value);
                        const first = PROPERTY_TYPES.find(t => t.category === c.value);
                        if (first) setValue("type", first.value as any);
                      }}
                      className={cn(
                        "px-4 py-1.5 rounded-xl text-sm font-medium border transition-all duration-150",
                        category === c.value
                          ? "bg-navy-900 text-white border-navy-900"
                          : "bg-white text-gray-600 border-gray-200 hover:border-navy-300"
                      )}>
                      {c.labelUk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Тип нерухомості */}
              <div>
                <Label required>Тип нерухомості</Label>
                <div className="flex flex-wrap gap-1.5">
                  {filteredTypes.map((t) => (
                    <button key={t.value} type="button"
                      onClick={() => {
                        setValue("type", t.value as any);
                        setCategory(getCategoryFromType(t.value));
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150",
                        watchedType === t.value
                          ? "bg-navy-900 text-white border-navy-900"
                          : "bg-white text-gray-600 border-gray-200 hover:border-navy-300 hover:text-navy-900"
                      )}>
                      {t.labelUk}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </Card>

          {/* ── 2. Назва ── */}
          <Card>
            <CardHeader icon={<FileText className="w-4 h-4" />} title="Назва оголошення" />
            <div className="p-6 space-y-4">
              <div>
                <Label required>Назва (UA)</Label>
                <Input {...register("titleUk")} placeholder="Простора квартира в центрі міста..." />
                {errors.titleUk && <p className="text-red-500 text-xs mt-1">{errors.titleUk.message}</p>}
              </div>
            </div>
          </Card>

          {/* ── 3. Параметри ── */}
          <Card>
            <CardHeader icon={<Layers className="w-4 h-4" />} title="Параметри" />
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <Label required>Площа, м²</Label>
                  <Controller name="areaSqm" control={control}
                    render={({ field: { onChange, value, ref, name } }) => (
                      <Input type="number" step="0.1" name={name} ref={ref} value={value ?? ""} placeholder="65"
                        onChange={(e) => { const v = parseFloat(e.target.value); onChange(isNaN(v) ? undefined : v); }} />
                    )} />
                  {errors.areaSqm && <p className="text-red-500 text-xs mt-1">{errors.areaSqm.message as string}</p>}
                </div>
                <div>
                  <Label>Кімнати</Label>
                  <Input type="number" {...register("rooms")} placeholder="2" />
                </div>
                <div>
                  <Label>Спальні</Label>
                  <Input type="number" {...register("bedrooms")} placeholder="1" />
                </div>
                <div>
                  <Label>Санвузли</Label>
                  <Input type="number" {...register("bathrooms")} placeholder="1" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label>Поверх</Label>
                  <Input type="number" {...register("floor")} placeholder="3" />
                </div>
                <div>
                  <Label>Всього поверхів</Label>
                  <Input type="number" {...register("totalFloors")} placeholder="9" />
                </div>
                <div>
                  <Label>Рік побудови</Label>
                  <Input type="number" {...register("yearBuilt")} placeholder="2022" />
                </div>
                <div>
                  <Label>Кухня, м²</Label>
                  <Input type="number" step="0.1" {...register("kitchenSqm")} placeholder="10" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <Label>Стан квартири</Label>
                  <FSelect {...register("renovationType")}>
                    <option value="">— Не вказано —</option>
                    <option value="Сирець">Сирець</option>
                    <option value="Житловий стан">Житловий стан</option>
                    <option value="Євроремонт">Євроремонт</option>
                    <option value="Авторський дизайн">Авторський дизайн</option>
                  </FSelect>
                </div>
                <div>
                  <Label>Етап будинку</Label>
                  <FSelect {...register("buildingStage")}>
                    <option value="">— не вказано —</option>
                    <option value="BUILT">Зданий</option>
                    <option value="HANDOVER">На етапі здачі</option>
                    <option value="UNDER_CONSTRUCTION">Будується</option>
                  </FSelect>
                </div>
                <div>
                  <Label>Тип стін</Label>
                  <FSelect {...register("wallType")}>
                    <option value="">— Не вказано —</option>
                    <option value="Цегла">Цегла</option>
                    <option value="Моноліт">Моноліт</option>
                    <option value="Панель">Панель</option>
                  </FSelect>
                </div>
                <div>
                  <Label>Опалення</Label>
                  <FSelect {...register("gasType")}>
                    <option value="">— Не вказано —</option>
                    <option value="Індивідуальне газове">Індивідуальне газове</option>
                    <option value="Дахова котельня">Дахова котельня</option>
                    <option value="Центральне">Центральне</option>
                    <option value="Електрика">Електрика</option>
                  </FSelect>
                </div>
              </div>
            </div>
          </Card>

          {/* ── 4. Характеристики ── */}
          {featureOptions && featureOptions.length > 0 && (
            <Card>
              <CardHeader icon={<Layers className="w-4 h-4" />} title="Характеристики" />
              <div className="p-6">
                <Controller name="features" control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {featureOptions.map((f) => {
                        const isSelected = field.value?.includes(f.value);
                        return (
                          <button key={f.value} type="button"
                            onClick={() => {
                              const cur = field.value ?? [];
                              field.onChange(isSelected ? cur.filter((v) => v !== f.value) : [...cur, f.value]);
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150",
                              isSelected
                                ? "bg-navy-900 text-white border-navy-900"
                                : "bg-white text-gray-600 border-gray-200 hover:border-navy-300 hover:text-navy-900"
                            )}>
                            {f.labelUk}
                          </button>
                        );
                      })}
                    </div>
                  )} />
              </div>
            </Card>
          )}

          {/* ── 5. Розташування ── */}
          <Card>
            <CardHeader icon={<MapPin className="w-4 h-4" />} title="Розташування" />
            <div className="p-6 space-y-4">
              {/* ЖК — перший рядок, повна ширина */}
              <div>
                <Label>Житловий комплекс (ЖК)</Label>
                <Controller
                  name="residentialComplex"
                  control={control}
                  render={({ field }) => (
                    <>
                      <input
                        value={field.value ?? ""}
                        list="complexes-list"
                        placeholder="Назва ЖК або адреса..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900 transition-all placeholder:text-gray-300"
                        ref={field.ref}
                        onBlur={field.onBlur}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val);
                          const jk = JK_DATA.find(j => j.name.toLowerCase() === val.trim().toLowerCase());
                          if (jk) {
                            jkGeocodingRef.current = true;
                            setValue("district", jk.district || "", { shouldDirty: true, shouldValidate: true });
                            setValue("address", jk.address || "", { shouldDirty: true });
                            setValue("latitude", jk.lat);
                            setValue("longitude", jk.lng);
                            setTimeout(() => { jkGeocodingRef.current = false; }, 1500);
                          }
                        }}
                      />
                      <datalist id="complexes-list">
                        {RESIDENTIAL_COMPLEXES_IF.map((n) => <option key={n} value={n} />)}
                      </datalist>
                    </>
                  )}
                />
              </div>
              {/* Район + Вулиця */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label required>Район</Label>
                  <Controller
                    name="district"
                    control={control}
                    render={({ field }) => (
                      <FSelect value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur}>
                        <option value="">— Оберіть район —</option>
                        {DISTRICTS_IF.map((d) => <option key={d.value} value={d.value}>{d.labelUk}</option>)}
                      </FSelect>
                    )}
                  />
                </div>
                <div>
                  <Label>Вулиця / Адреса</Label>
                  <Input {...register("address")} placeholder="вул. Незалежності, 15" />
                </div>
              </div>
              {/* Номери */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Номер будинку</Label>
                  <Input {...register("houseNumber")} placeholder="15а" />
                </div>
                <div>
                  <Label>Номер кв.</Label>
                  <Input {...register("apartmentNumber")} placeholder="42" />
                </div>
                <div>
                  <Label>Буква кв.</Label>
                  <Input {...register("apartmentLetter")} placeholder="А" />
                </div>
              </div>
              {/* Орієнтир */}
              <div>
                <Label>Орієнтир</Label>
                <Input {...register("landmark")} placeholder="Поруч із ТЦ Атріум..." />
              </div>
              {/* Карта */}
              <div>
                <Label>Позначте на карті</Label>
                <p className="text-xs text-gray-400 mb-1.5">Заповніть ЖК або адресу — карта оновиться автоматично. Можна також клікнути або перетягнути маркер вручну.</p>
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <MapPicker
                    lat={watch("latitude") ?? null}
                    lng={watch("longitude") ?? null}
                    onChange={(lat, lng) => { setValue("latitude", lat); setValue("longitude", lng); }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* ── 5. Опис ── */}
          <Card>
            <CardHeader icon={<FileText className="w-4 h-4" />} title="Опис" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Label>Опис (UA) — автоматично перекладається</Label>
                <button
                  type="button"
                  onClick={generateDescription}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 transition shadow-sm"
                >
                  {generating
                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Генерую...</>
                    : <><Sparkles className="w-3 h-3" /> AI опис</>
                  }
                </button>
              </div>
              <Controller name="descriptionUk" control={control}
                render={({ field }) => <TiptapEditor value={field.value} onChange={field.onChange} />} />
            </div>
          </Card>

          {/* ── 6. Фото ── */}
          <Card>
            <CardHeader icon={<Image className="w-4 h-4" />} title="Фото" />
            <div className="p-6">
              {propertyId === "new" && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-4">
                  <span className="text-lg">💡</span>
                  Спочатку збережіть («Створити»), потім додайте фото.
                </div>
              )}
              <ImageUploader propertyId={propertyId} initialImages={images} onChange={setImages} />
            </div>
          </Card>

          {/* ── 7. Коментарі агента ── */}
          <Card>
            <CardHeader icon={<MessageSquarePlus className="w-4 h-4" />} title="Коментарі агента" />
            <div className="p-6">
              {comments.length > 0 && (
                <div className="space-y-2 mb-4">
                  {comments.map((c, i) => (
                    <div key={i} className="group flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.text}</p>
                        {(c.author || c.createdAt) && (
                          <p className="text-[11px] text-gray-400 mt-1">
                            {c.author}{c.author && c.createdAt ? " · " : ""}
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" }) : ""}
                          </p>
                        )}
                      </div>
                      <button type="button" onClick={() => deleteComment(i)}
                        className="opacity-0 group-hover:opacity-100 transition p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <textarea value={commentInput} onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addComment(); } }}
                  placeholder="Додати коментар... (Cmd+Enter)"
                  rows={2}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900 resize-none transition-all placeholder:text-gray-300" />
                <button type="button" onClick={addComment} disabled={!commentInput.trim() || commentSaving}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-navy-900 text-white rounded-xl text-sm font-semibold hover:bg-navy-800 transition disabled:opacity-40 self-end">
                  <MessageSquarePlus className="w-4 h-4" />
                  {commentSaving ? "..." : "+1"}
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* ── RIGHT COLUMN (sidebar) ── */}
        <div className="space-y-5">

          {/* Ціна та статус */}
          <Card>
            <CardHeader icon={<DollarSign className="w-4 h-4" />} title="Ціна" />
            <div className="p-5 space-y-4">
              <div>
                <Label required>Вартість</Label>
                <div className="flex gap-2">
                  <Controller name="price" control={control}
                    render={({ field: { onChange, value, ref, name } }) => (
                      <Input type="number" name={name} ref={ref} value={value ?? ""} placeholder="50 000"
                        onChange={(e) => { const v = parseFloat(e.target.value); onChange(isNaN(v) ? undefined : v); }} />
                    )} />
                  <div className="w-20 flex-shrink-0">
                    <FSelect {...register("currency")}>
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </FSelect>
                  </div>
                </div>
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message as string}</p>}
              </div>
              <div>
                <Label>За</Label>
                <div className="flex gap-1 p-1 bg-gray-50 border border-gray-100 rounded-xl">
                  {[{ v: "OBJECT", l: "за об'єкт" }, { v: "SQM", l: "за м²" }].map((o) => (
                    <button key={o.v} type="button"
                      onClick={() => setValue("pricePer", o.v as any)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                        watch("pricePer") === o.v ? "bg-white shadow-sm border border-gray-200 text-navy-900" : "text-gray-500"
                      )}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Статус */}
          <Card>
            <CardHeader icon={<Building2 className="w-4 h-4" />} title="Статус" />
            <div className="p-5">
              <div className="grid grid-cols-2 gap-2">
                {STATUS_CONFIG.map((s) => (
                  <button key={s.value} type="button"
                    onClick={() => setValue("status", s.value as any)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150",
                      watchedStatus === s.value
                        ? "bg-navy-900 text-white border-navy-900"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    )}>
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", watchedStatus === s.value ? "bg-white/70" : s.dot)} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Агент + Featured */}
          {role === "ADMIN" && (
            <Card>
              <CardHeader icon={<Home className="w-4 h-4" />} title="Призначення" />
              <div className="p-5 space-y-4">
                {employees.length > 0 && (
                  <div>
                    <Label>Відповідальний агент</Label>
                    <FSelect {...register("assignedUserId")}>
                      <option value="">— Не призначено —</option>
                      {employees.map((e) => <option key={e.id} value={e.id}>{e.name ?? e.email}</option>)}
                    </FSelect>
                  </div>
                )}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn(
                    "relative w-10 h-6 rounded-full transition-colors duration-200",
                    watch("isFeatured") ? "bg-gold-500" : "bg-gray-200"
                  )}>
                    <input type="checkbox" {...register("isFeatured")} className="sr-only" />
                    <span className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                      watch("isFeatured") ? "translate-x-5" : "translate-x-1"
                    )} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">🔥 Виділити на головній</span>
                </label>
              </div>
            </Card>
          )}

          {/* Джерело + Комісія */}
          <Card>
            <CardHeader icon={<Info className="w-4 h-4" />} title="Додатково" />
            <div className="p-5 space-y-4">
              <div>
                <Label>Джерело</Label>
                <FSelect {...register("source")}>
                  <option value="">— Не вказано —</option>
                  {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </FSelect>
              </div>
              <div>
                <Label>Комісія</Label>
                <div className="flex gap-1.5">
                  <Controller name="commissionAmount" control={control}
                    render={({ field: { onChange, value, ref, name } }) => (
                      <Input type="number" name={name} ref={ref} value={value ?? ""} placeholder="500"
                        className="flex-1 min-w-0"
                        onChange={(e) => { const v = parseFloat(e.target.value); onChange(isNaN(v) ? null : v); }} />
                    )} />
                  <FSelect {...register("commissionType")} className="w-28">
                    {COMMISSION_TYPES.map((c) => <option key={c.value} value={c.value}>{c.labelUk}</option>)}
                  </FSelect>
                  <FSelect {...register("commissionCurrency")} className="w-16">
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </FSelect>
                </div>
              </div>
              <div>
                <Label>Замітка (внутрішня)</Label>
                <textarea {...register("internalNote")} rows={3}
                  placeholder="Внутрішні нотатки..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900 resize-none transition-all placeholder:text-gray-300" />
              </div>
            </div>
          </Card>

          {/* Save button */}
          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-navy-900 text-white rounded-2xl text-sm font-bold hover:bg-navy-800 transition disabled:opacity-60 shadow-sm border border-gold-300">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Збереження..." : isEdit ? "Зберегти зміни" : "Створити оголошення"}
          </button>
        </div>
      </div>
    </form>
  );
}
