"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";
import {
  PROPERTY_TYPES,
  LISTING_TYPES,
  CURRENCIES,
  DISTRICTS_IF,
  PROPERTY_FEATURES,
} from "@/lib/constants";
import ImageUploader from "./ImageUploader";

const TiptapEditor = dynamic(() => import("./TiptapEditor"), { ssr: false });

const schema = z.object({
  titleUk: z.string().min(1, "Обов'язкове поле"),
  titleEn: z.string().min(1, "Required"),
  type: z.string().min(1),
  listingType: z.string().min(1),
  status: z.string().min(1),
  price: z.coerce.number().positive(),
  currency: z.string().min(1),
  areaSqm: z.coerce.number().positive(),
  rooms: z.coerce.number().optional().nullable(),
  bedrooms: z.coerce.number().optional().nullable(),
  bathrooms: z.coerce.number().optional().nullable(),
  floor: z.coerce.number().optional().nullable(),
  totalFloors: z.coerce.number().optional().nullable(),
  yearBuilt: z.coerce.number().optional().nullable(),
  district: z.string().optional(),
  address: z.string().optional(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
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

interface PropertyFormProps {
  initialData?: Partial<FormData> & { id?: string; images?: PropertyImage[]; assignedUserId?: string | null };
  employees?: Employee[];
  featureOptions?: FeatureOption[];
  role?: "ADMIN" | "EMPLOYEE";
  currentUserId?: string;
}

const tabs = ["Основне", "Параметри", "Локалізація", "Опис", "Зручності", "Фото"];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 ${className}`}
    />
  );
}

function Select({
  children,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white ${className}`}
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
                <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${selected ? "bg-navy-900 text-white" : "border border-gray-300"}`}>
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
            className="px-4 py-2 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition disabled:opacity-40"
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

export default function PropertyForm({ initialData, employees = [], featureOptions, role = "EMPLOYEE", currentUserId }: PropertyFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [propertyId, setPropertyId] = useState(initialData?.id ?? "new");
  const [images, setImages] = useState<PropertyImage[]>(initialData?.images ?? []);

  const isEdit = Boolean(initialData?.id);

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
      price: initialData?.price ?? undefined,
      currency: initialData?.currency ?? "USD",
      areaSqm: initialData?.areaSqm ?? undefined,
      rooms: initialData?.rooms ?? null,
      bedrooms: initialData?.bedrooms ?? null,
      bathrooms: initialData?.bathrooms ?? null,
      floor: initialData?.floor ?? null,
      totalFloors: initialData?.totalFloors ?? null,
      yearBuilt: initialData?.yearBuilt ?? null,
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

  const selectedFeatures = watch("features");

  function toggleFeature(value: string) {
    const current = selectedFeatures ?? [];
    if (current.includes(value)) {
      setValue("features", current.filter((f) => f !== value));
    } else {
      setValue("features", [...current, value]);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(data: any) {
    setSaving(true);
    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `/api/properties/${initialData!.id}` : "/api/properties";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
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
            className="px-6 py-2 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition disabled:opacity-60"
          >
            {saving ? "Збереження..." : isEdit ? "Зберегти зміни" : "Створити"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === i
                ? "bg-navy-900 text-white"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
        {/* Tab 0: Основне */}
        {activeTab === 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Тип нерухомості</FieldLabel>
                <Select {...register("type")}>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.labelUk}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <FieldLabel required>Тип оголошення</FieldLabel>
                <Select {...register("listingType")}>
                  {LISTING_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.labelUk}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <FieldLabel required>Назва (UA)</FieldLabel>
              <Input {...register("titleUk")} placeholder="Простора квартира в центрі..." />
              {errors.titleUk && (
                <p className="text-red-500 text-xs mt-1">{errors.titleUk.message}</p>
              )}
            </div>

            <div>
              <FieldLabel required>Назва (EN)</FieldLabel>
              <Input {...register("titleEn")} placeholder="Spacious apartment in the center..." />
              {errors.titleEn && (
                <p className="text-red-500 text-xs mt-1">{errors.titleEn.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <FieldLabel required>Ціна</FieldLabel>
                <Input type="number" {...register("price")} placeholder="50000" />
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
                )}
              </div>
              <div>
                <FieldLabel required>Валюта</FieldLabel>
                <Select {...register("currency")}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
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
                    <option key={e.id} value={e.id}>
                      {e.name ?? e.email}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" {...register("isFeatured")} className="rounded" />
              Виділити на головній сторінці
            </label>
          </>
        )}

        {/* Tab 1: Параметри */}
        {activeTab === 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel required>Площа (м²)</FieldLabel>
              <Input type="number" step="0.1" {...register("areaSqm")} placeholder="65" />
              {errors.areaSqm && (
                <p className="text-red-500 text-xs mt-1">{errors.areaSqm.message}</p>
              )}
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
          </div>
        )}

        {/* Tab 2: Локалізація */}
        {activeTab === 2 && (
          <>
            <div>
              <FieldLabel>Район</FieldLabel>
              <Select {...register("district")}>
                <option value="">— Не вказано —</option>
                {DISTRICTS_IF.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.labelUk}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel>Адреса</FieldLabel>
              <Input
                {...register("address")}
                placeholder="вул. Незалежності, 15, Івано-Франківськ"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Широта (latitude)</FieldLabel>
                <Input
                  type="number"
                  step="any"
                  {...register("latitude")}
                  placeholder="48.9226"
                />
              </div>
              <div>
                <FieldLabel>Довгота (longitude)</FieldLabel>
                <Input
                  type="number"
                  step="any"
                  {...register("longitude")}
                  placeholder="24.7111"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Знайдіть координати на{" "}
              <a
                href="https://www.openstreetmap.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-500 hover:underline"
              >
                openstreetmap.org
              </a>{" "}
              (правою кнопкою → Show address)
            </p>
          </>
        )}

        {/* Tab 3: Опис */}
        {activeTab === 3 && (
          <>
            <div>
              <FieldLabel>Опис (UA)</FieldLabel>
              <Controller
                name="descriptionUk"
                control={control}
                render={({ field }) => (
                  <TiptapEditor value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
            <div>
              <FieldLabel>Опис (EN)</FieldLabel>
              <Controller
                name="descriptionEn"
                control={control}
                render={({ field }) => (
                  <TiptapEditor value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
          </>
        )}

        {/* Tab 4: Зручності */}
        {activeTab === 4 && (
          <FeatureTab
            selectedFeatures={selectedFeatures ?? []}
            predefinedFeatures={featureOptions ?? PROPERTY_FEATURES.map((f) => ({ id: f.value, value: f.value, labelUk: f.labelUk, labelEn: f.labelEn }))}
            onToggle={toggleFeature}
            onAdd={(val) => setValue("features", [...(selectedFeatures ?? []), val] as any)}
            onRemoveCustom={(val) => setValue("features", (selectedFeatures ?? []).filter((f) => f !== val) as any)}
          />
        )}

        {/* Tab 5: Фото */}
        {activeTab === 5 && (
          <div>
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
        )}
      </div>

      {/* Bottom save */}
      <div className="flex justify-end mt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-2.5 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition disabled:opacity-60"
        >
          {saving ? "Збереження..." : isEdit ? "Зберегти зміни" : "Створити оголошення"}
        </button>
      </div>
    </form>
  );
}
