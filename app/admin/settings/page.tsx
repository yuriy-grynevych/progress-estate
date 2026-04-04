import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/constants";
import FeaturesManager from "@/components/admin/FeaturesManager";
import DistrictsManager from "@/components/admin/DistrictsManager";

async function getDistricts() {
  try {
    const rows = await prisma.$queryRawUnsafe<{ id: string; value: string; labelUk: string; labelEn: string; order: number }[]>(
      `SELECT id, value, "labelUk", "labelEn", "order" FROM districts ORDER BY "order" ASC`
    );
    return rows;
  } catch {
    return [];
  }
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") redirect("/admin");

  const [features, districts] = await Promise.all([
    prisma.feature.findMany({ orderBy: { order: "asc" } }),
    getDistricts(),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Налаштування</h1>

      {/* Company info (read-only) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-navy-900 mb-4">Контактні дані компанії</h2>
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
          Редагуються у файлі <code className="font-mono">lib/constants.ts</code>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Телефон", value: COMPANY.phone },
            { label: "Email", value: COMPANY.email },
            { label: "Адреса", value: COMPANY.address },
            { label: "Instagram", value: COMPANY.instagram },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
              <input
                readOnly
                defaultValue={value}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Features manager */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-navy-900 mb-1">Зручності нерухомості</h2>
        <p className="text-xs text-gray-400 mb-5">
          Список зручностей, які відображаються при додаванні нерухомості. Видалення не впливає на вже збережені об'єкти.
        </p>
        <FeaturesManager initialFeatures={features} />
      </div>

      {/* Districts manager */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-navy-900 mb-1">Райони міста</h2>
        <p className="text-xs text-gray-400 mb-5">
          Райони, які відображаються у пошуку та формі нерухомості.
        </p>
        <DistrictsManager initialDistricts={districts} />
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-navy-900 mb-3">Швидкі посилання</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: "/uk", label: "Сайт (UA)" },
            { href: "/en", label: "Site (EN)" },
            { href: "/uk/listings", label: "Оголошення" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              className="text-sm text-gold-500 hover:text-gold-600 underline"
            >
              {label} →
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
