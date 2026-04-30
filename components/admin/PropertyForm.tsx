"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageSquarePlus } from "lucide-react";
import dynamic from "next/dynamic";
import {
  PROPERTY_TYPES,
  PROPERTY_CATEGORIES,
  LISTING_TYPES,
  CURRENCIES,
  DISTRICTS_IF,
  PROPERTY_FEATURES,
  RESIDENTIAL_COMPLEXES_IF,
  SOURCE_OPTIONS,
  COMMISSION_TYPES,
} from "@/lib/constants";
import ImageUploader from "./ImageUploader";

const TiptapEditor = dynamic(() => import("./TiptapEditor"), { ssr: false });
const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

const schema = z.object({
  titleUk: z.string().min(1, "Обов'язкове поле"),
  titleEn: z.string().min(1, "Required"),
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

interface PropertyImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Employee {
  id: string;
  name: string | null;
  email: string;
}

interface FeatureOption {
  id: string;
  value: string;
  labelUk: string;
  labelEn: string;
}

interface AgentComment {
  text: string;
  author: string;
  createdAt: string;
}

interface PropertyFormProps {
  initialData?: Partial<FormData> & {
    id?: string;
    images?: PropertyImage[];
    assignedUserId?: string | null;
    agentComments?: AgentComment[];
  };
  employees?: Employee[];
  featureOptions?: FeatureOption[];
  role?: "ADMIN" | "EMPLOYEE";
  currentUserId?: string;
  currentUserName?: string;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      className={`w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900 ${className}`}
    />
  )
);
Input.displayName = "Input";

function Select({
  children,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900 bg-white ${className}`}
    >
      {children}
    </select>
  );
}

function FeatureTab({
  selectedFeatures,
  predefinedFeatures,
  onToggle,
  onAdd,
  onRemoveCustom,
}: {
  selectedFeatures: string[];
  predefinedFeatures: { id: string; value: string; labelUk: string; labelEn: string }[];
  onToggle: (value: string) => void;
  onAdd: (value: string) => void;
  onRemoveCustom: (value: string) => void;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const predefinedValues = predefinedFeatures.map((f) => f.value);
  const customFeatures = selectedFeatures.filter((f) => !predefinedValues.includes(f));

  function addCustom() {
    const val = input.trim();
    if (!val || selectedFeatures.includes(val)) return;
    onAdd(val);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-6">
      {/* Predefined */}
      <div>
        <p className="text-sm text-gray-500 mb-3">Виберіть наявні зручності:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {predefinedFeatures.map((feature) => {
            const selected = selectedFeatures.includes(feature.value);
            return (
              <button
                key={feature.value}
                type="button"
                onClick={() => onToggle(feature.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition ${
                  selected
                    ? "border-navy-900 bg-navy-50 text-navy-900 font-medium"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${selected ? "bg-black text-white" : "border border-gray-300"}`}>
                  {selected && (
                    <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {feature.labelUk}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom */}
      <div>
        <p className="text-sm text-gray-500 mb-3">Додати власні зручності:</p>
        <div className="flex gap-2 mb-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            placeholder="Наприклад: Джакузі, Каміни, Тераса..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!input.trim()}
            className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/90 transition disabled:opacity-40"
          >
            Додати
          </button>
        </div>
        {customFeatures.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customFeatures.map((f) => (
              <span key={f} className="flex items-center gap-1.5 bg-gold-50 border border-gold-200 text-gold-700 text-sm px-3 py-1.5 rounded-xl">
                {f}
                <button
                  type="button"
                  onClick={() => onRemoveCustom(f)}
                  className="text-gold-400 hover:text-gold-700 transition ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertyForm({ initialData, employees = [], featureOptions, role = "EMPLOYEE", currentUserId, currentUserName }: PropertyFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [propertyId, setPropertyId] = useState(initialData?.id ?? "new");
  const [images, setImages] = useState<PropertyImage[]>(initialData?.images ?? []);
  const [comments, setComments] = useState<AgentComment[]>(
    (initialData?.agentComments as AgentComment[]) ?? []
  );
  const [commentInput, setCommentInput] = useState("");

  const isEdit = Boolean(initialData?.id);

  function getCategoryFromType(t: string): string {
    const residential = ["APARTMENT","ROOM","HOUSE","APARTMENT_PREMIUM","VILLA","PENTHOUSE","TOWNHOUSE","DUPLEX"];
    const land = ["LAND","LAND_INDIVIDUAL","LAND_GARDEN","LAND_FARM","LAND_COMMERCIAL"];
    if (residential.includes(t)) return "RESIDENTIAL";
    if (land.includes(t)) return "LAND";
    return "COMMERCIAL";
  }

  const [category, setCategory] = useState<string>(() => getCategoryFromType(initialData?.type ?? "APARTMENT"));

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      titleUk: initialData?.titleUk ?? "",
      titleEn: initialData?.titleEn ?? "",
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

  function addComment() {
    const text = commentInput.trim();
    if (!text) return;
    setComments((prev) => [
      ...prev,
      { text, author: currentUserName ?? "", createdAt: new Date().toISOString() },
    ]);
    setCommentInput("");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(data: any) {
    setSaving(true);
    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `/api/properties/${initialData!.id}` : "/api/properties";

    const toN = (v: unknown) => { const n = parseFloat(String(v)); return isNaN(n) ? null : n; };

    let descriptionEn = data.descriptionEn ?? "";
    if (data.descriptionUk?.trim()) {
      try {
        const tr = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: data.descriptionUk }),
        });
        const trData = await tr.json();
        if (trData.translated) descriptionEn = trData.translated;
      } catch {}
    }

    const body = {
      ...data,
      descriptionEn,
      rooms: toN(data.rooms),
      bedrooms: toN(data.bedrooms),
      bathrooms: toN(data.bathrooms),
      floor: toN(data.floor),
      totalFloors: toN(data.totalFloors),
      yearBuilt: toN(data.yearBuilt),
      kitchenSqm: toN(data.kitchenSqm),
      latitude: toN(data.latitude),
      longitude: toN(data.longitude),
      agentComments: comments,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const json = await res.json();
      if (!isEdit) {
        setPropertyId(json.id);
      }
      router.push("/admin/properties");
      router.refresh();
    } else {
      alert("Помилка збереження. Перевірте всі поля.");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-900">
          {isEdit ? "Редагувати нерухомість" : "Нова нерухомість"}
        </h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
          >
            Скасувати
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/90 transition disabled:opacity-60"
          >
            {saving ? "Збереження..." : isEdit ? "Зберегти зміни" : "Створити"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Основне */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200 space-y-5">
          <h2 className="text-base font-semibold text-navy-900 border-b-2 border-gray-200 pb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-navy-900 rounded-full inline-block" />
            Основне
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel required>Категорія</FieldLabel>
              <Select value={category} onChange={(e) => {
                setCategory(e.target.value);
                const first = PROPERTY_TYPES.find(t => t.category === e.target.value);
                if (first) setValue("type", first.value as any);
              }}>
                {PROPERTY_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.labelUk}</option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel required>Тип нерухомості</FieldLabel>
              <Select {...register("type")} onChange={(e) => {
                setValue("type", e.target.value as any);
                setCategory(getCategoryFromType(e.target.value));
              }}>
                {PROPERTY_TYPES.filter(t => t.category === category).map((t) => (
                  <option key={t.value} value={t.value}>{t.labelUk}</option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel required>Тип угоди</FieldLabel>
              <Select {...register("listingType")}>
                {LISTING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.labelUk}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <FieldLabel required>Назва (UA)</FieldLabel>
            <Input {...register("titleUk")} placeholder="Простора квартира в центрі..." />
            {errors.titleUk && <p className="text-red-500 text-xs mt-1">{errors.titleUk.message}</p>}
          </div>
          <div>
            <FieldLabel required>Назва (EN)</FieldLabel>
            <Input {...register("titleEn")} placeholder="Spacious apartment in the center..." />
            {errors.titleEn && <p className="text-red-500 text-xs mt-1">{errors.titleEn.message}</p>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <FieldLabel required>Ціна</FieldLabel>
              <Controller
                name="price"
                control={control}
                render={({ field: { onChange, value, ref, name } }) => (
                  <Input
                    type="number"
                    name={name}
                    ref={ref}
                    value={value ?? ""}
                    placeholder="50000"
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      onChange(isNaN(v) ? undefined : v);
                    }}
                  />
                )}
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message as string}</p>}
            </div>
            <div>
              <FieldLabel>За</FieldLabel>
              <Select {...register("pricePer")}>
                <option value="OBJECT">за об'єкт</option>
                <option value="SQM">за м²</option>
              </Select>
            </div>
            <div>
              <FieldLabel required>Валюта</FieldLabel>
              <Select {...register("currency")}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel required>Статус</FieldLabel>
              <Select {...register("status")}>
                <option value="ACTIVE">Активне</option>
                <option value="INACTIVE">Неактивне</option>
                <option value="SOLD">Продано</option>
                <option value="RENTED">Здано</option>
              </Select>
            </div>
          </div>
          {role === "ADMIN" && employees.length > 0 && (
            <div>
              <FieldLabel>Відповідальний агент</FieldLabel>
              <Select {...register("assignedUserId")}>
                <option value="">— Не призначено —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name ?? e.email}</option>
                ))}
              </Select>
            </div>
          )}
          {role === "ADMIN" && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" {...register("isFeatured")} className="rounded" />
              Виділити на головній сторінці
            </label>
          )}
        </div>

        {/* Параметри */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200 space-y-5">
          <h2 className="text-base font-semibold text-navy-900 border-b-2 border-gray-200 pb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-gold-500 rounded-full inline-block" />
            Параметри
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel required>Площа (м²)</FieldLabel>
              <Controller
                name="areaSqm"
                control={control}
                render={({ field: { onChange, value, ref, name } }) => (
                  <Input
                    type="number"
                    step="0.1"
                    name={name}
                    ref={ref}
                    value={value ?? ""}
                    placeholder="65"
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      onChange(isNaN(v) ? undefined : v);
                    }}
                  />
                )}
              />
              {errors.areaSqm && <p className="text-red-500 text-xs mt-1">{errors.areaSqm.message as string}</p>}
            </div>
            <div>
              <FieldLabel>Кімнати</FieldLabel>
              <Input type="number" {...register("rooms")} placeholder="2" />
            </div>
            <div>
              <FieldLabel>Спальні</FieldLabel>
              <Input type="number" {...register("bedrooms")} placeholder="1" />
            </div>
            <div>
              <FieldLabel>Санвузли</FieldLabel>
              <Input type="number" {...register("bathrooms")} placeholder="1" />
            </div>
            <div>
              <FieldLabel>Поверх</FieldLabel>
              <Input type="number" {...register("floor")} placeholder="3" />
            </div>
            <div>
              <FieldLabel>Поверхів всього</FieldLabel>
              <Input type="number" {...register("totalFloors")} placeholder="9" />
            </div>
            <div>
              <FieldLabel>Рік побудови</FieldLabel>
              <Input type="number" {...register("yearBuilt")} placeholder="2020" />
            </div>
            <div>
              <FieldLabel>Площа кухні (м²)</FieldLabel>
              <Input type="number" step="0.1" {...register("kitchenSqm")} placeholder="10" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel>Ремонт</FieldLabel>
              <Select {...register("renovationType")}>
                <option value="">— Не вказано —</option>
                <option value="Сирець">Сирець</option>
                <option value="Житловий стан">Житловий стан</option>
                <option value="Євроремонт">Євроремонт</option>
                <option value="Авторський дизайн">Авторський дизайн</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Тип стін</FieldLabel>
              <Select {...register("wallType")}>
                <option value="">— Не вказано —</option>
                <option value="Цегла">Цегла</option>
                <option value="Моноліт">Моноліт</option>
                <option value="Панель">Панель</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Газ / опалення</FieldLabel>
              <Select {...register("gasType")}>
                <option value="">— Не вказано —</option>
                <option value="Індивідуальне газове">Індивідуальне газове</option>
                <option value="Дахова котельня">Дахова котельня</option>
                <option value="Центральне">Центральне</option>
                <option value="Електрика">Електрика</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Локалізація */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200 space-y-5">
          <h2 className="text-base font-semibold text-navy-900 border-b-2 border-gray-200 pb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-emerald-500 rounded-full inline-block" />
            Локалізація
          </h2>
          <div>
            <FieldLabel>Район</FieldLabel>
            <Select {...register("district")}>
              <option value="">— Не вказано —</option>
              {DISTRICTS_IF.map((d) => (
                <option key={d.value} value={d.value}>{d.labelUk}</option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Вулиця / Адреса</FieldLabel>
            <Input {...register("address")} placeholder="вул. Незалежності, 15" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <FieldLabel>Номер будинку</FieldLabel>
              <Input {...register("houseNumber")} placeholder="15а" />
            </div>
            <div>
              <FieldLabel>Номер кв.</FieldLabel>
              <Input {...register("apartmentNumber")} placeholder="42" />
            </div>
            <div>
              <FieldLabel>Буква кв.</FieldLabel>
              <Input {...register("apartmentLetter")} placeholder="А" />
            </div>
          </div>
          <div>
            <FieldLabel>Житловий комплекс</FieldLabel>
            <input
              {...register("residentialComplex")}
              list="complexes-list"
              placeholder="Назва ЖК або адреса..."
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900"
            />
            <datalist id="complexes-list">
              {RESIDENTIAL_COMPLEXES_IF.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div>
            <FieldLabel>Орієнтир</FieldLabel>
            <Input
              {...register("landmark")}
              placeholder="Поруч із ТЦ Атріум, навпроти ринку..."
            />
          </div>
          <div>
            <FieldLabel>Місцезнаходження на карті</FieldLabel>
            <MapPicker
              lat={watch("latitude") ?? null}
              lng={watch("longitude") ?? null}
              onChange={(lat, lng) => {
                setValue("latitude", lat);
                setValue("longitude", lng);
              }}
            />
          </div>
        </div>

        {/* Додаткова інформація */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200 space-y-5">
          <h2 className="text-base font-semibold text-navy-900 border-b-2 border-gray-200 pb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-purple-500 rounded-full inline-block" />
            Додаткова інформація
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Джерело</FieldLabel>
              <Select {...register("source")}>
                <option value="">— Не вказано —</option>
                {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel>Комісія</FieldLabel>
              <div className="flex gap-2">
                <Controller
                  name="commissionAmount"
                  control={control}
                  render={({ field: { onChange, value, ref, name } }) => (
                    <Input
                      type="number"
                      name={name}
                      ref={ref}
                      value={value ?? ""}
                      placeholder="500"
                      className="flex-1"
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        onChange(isNaN(v) ? null : v);
                      }}
                    />
                  )}
                />
                <Select {...register("commissionType")} className="w-36">
                  {COMMISSION_TYPES.map((c) => <option key={c.value} value={c.value}>{c.labelUk}</option>)}
                </Select>
                <Select {...register("commissionCurrency")} className="w-20">
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
            </div>
          </div>
          <div>
            <FieldLabel>Замітка (внутрішня)</FieldLabel>
            <textarea
              {...register("internalNote")}
              rows={3}
              placeholder="Внутрішні нотатки, не публікуються..."
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 resize-none"
            />
          </div>
        </div>

        {/* Опис */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200 space-y-5">
          <h2 className="text-base font-semibold text-navy-900 border-b-2 border-gray-200 pb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded-full inline-block" />
            Опис
          </h2>
          <div>
            <FieldLabel>Опис (UA)</FieldLabel>
            <Controller
              name="descriptionUk"
              control={control}
              render={({ field }) => <TiptapEditor value={field.value} onChange={field.onChange} />}
            />
          </div>
        </div>

        {/* Коментарі агента */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200">
          <h2 className="text-base font-semibold text-navy-900 border-b-2 border-gray-200 pb-3 mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
            Коментарі агента
          </h2>

          {comments.length > 0 && (
            <div className="space-y-2 mb-4">
              {comments.map((c, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.text}</p>
                    {(c.author || c.createdAt) && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        {c.author}
                        {c.author && c.createdAt ? " · " : ""}
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString("uk-UA", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setComments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-gray-300 hover:text-red-400 transition text-lg leading-none flex-shrink-0"
                    title="Видалити коментар"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  addComment();
                }
              }}
              placeholder="Додати коментар..."
              rows={2}
              className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 resize-none"
            />
            <button
              type="button"
              onClick={addComment}
              disabled={!commentInput.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/90 transition disabled:opacity-40 self-end"
            >
              <MessageSquarePlus className="w-4 h-4" />
              +1
            </button>
          </div>
        </div>

        {/* Фото */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200">
          <h2 className="text-base font-semibold text-navy-900 border-b-2 border-gray-200 pb-3 mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-orange-500 rounded-full inline-block" />
            Фото
          </h2>
          {propertyId === "new" && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-lg mb-4">
              Спочатку збережіть нерухомість (натисніть «Створити»), потім додайте фото.
            </div>
          )}
          <ImageUploader
            propertyId={propertyId}
            initialImages={images}
            onChange={setImages}
          />
        </div>
      </div>

      {/* Bottom save */}
      <div className="flex justify-end mt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/90 transition disabled:opacity-60"
        >
          {saving ? "Збереження..." : isEdit ? "Зберегти зміни" : "Створити оголошення"}
        </button>
      </div>
    </form>
  );
}
