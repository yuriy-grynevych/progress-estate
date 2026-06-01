import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FeaturesManager from "@/components/admin/FeaturesManager";
import DistrictsManager from "@/components/admin/DistrictsManager";
import CompanySettingsForm from "@/components/admin/CompanySettingsForm";
import EmailSettingsForm from "@/components/admin/EmailSettingsForm";
import OlxSettingsForm from "@/components/admin/OlxSettingsForm";
import { getCompanySettings, getSalesPlan } from "@/lib/company";
import SalesPlanForm from "@/components/admin/SalesPlanForm";
import ListsManager from "@/components/admin/ListsManager";
import { RESIDENTIAL_COMPLEXES_IF, DEVELOPERS_IF } from "@/lib/constants";

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

  async function getLists() {
    try {
      const rows = await prisma.$queryRawUnsafe<{ key: string; value: string }[]>(
        `SELECT key, value FROM company_settings WHERE key IN ('jk_list','developers_list','streets_list')`
      );
      const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
      return {
        jk: map.jk_list ? JSON.parse(map.jk_list) : [...RESIDENTIAL_COMPLEXES_IF],
        developers: map.developers_list ? JSON.parse(map.developers_list) : [...DEVELOPERS_IF],
        streets: map.streets_list ? JSON.parse(map.streets_list) : [],
      };
    } catch {
      return { jk: [...RESIDENTIAL_COMPLEXES_IF], developers: [...DEVELOPERS_IF], streets: [] };
    }
  }

  const [features, districts, company, plan, lists] = await Promise.all([
    prisma.feature.findMany({ orderBy: { order: "asc" } }),
    getDistricts(),
    getCompanySettings(),
    getSalesPlan(),
    getLists(),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Налаштування</h1>

      {/* Company settings — editable */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gold-300">
        <h2 className="font-semibold text-navy-900 mb-1">Контактні дані компанії</h2>
        <p className="text-xs text-gray-400 mb-5">
          Відображаються на сайті у футері, навбарі та сторінці контактів.
        </p>
        <CompanySettingsForm initial={company} />
      </div>

      {/* Features manager */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gold-300">
        <h2 className="font-semibold text-navy-900 mb-1">Зручності нерухомості</h2>
        <p className="text-xs text-gray-400 mb-5">
          Список зручностей, які відображаються при додаванні нерухомості. Видалення не впливає на вже збережені об'єкти.
        </p>
        <FeaturesManager initialFeatures={features} />
      </div>

      {/* Districts manager */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gold-300">
        <h2 className="font-semibold text-navy-900 mb-1">Райони міста</h2>
        <p className="text-xs text-gray-400 mb-5">
          Райони, які відображаються у пошуку та формі нерухомості.
        </p>
        <DistrictsManager initialDistricts={districts} />
      </div>

      {/* ЖК / Developers / Streets */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gold-300">
        <h2 className="font-semibold text-navy-900 mb-1">ЖК, Забудовники, Вулиці</h2>
        <p className="text-xs text-gray-400 mb-5">
          Списки для фільтрів та автозаповнення адрес. Зміни набувають чинності одразу.
        </p>
        <ListsManager
          initialJk={lists.jk}
          initialDevelopers={lists.developers}
          initialStreets={lists.streets}
        />
      </div>

      {/* Email SMTP settings */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gold-300">
        <h2 className="font-semibold text-navy-900 mb-1">Email (SMTP)</h2>
        <p className="text-xs text-gray-400 mb-5">
          Налаштування для надсилання листів клієнтам з CRM. Підтримує Gmail, Outlook, і будь-який SMTP.
        </p>
        <EmailSettingsForm />
      </div>

      {/* OLX integration settings */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gold-300">
        <h2 className="font-semibold text-navy-900 mb-1">OLX інтеграція</h2>
        <p className="text-xs text-gray-400 mb-5">
          Підключіть OLX Partner API для публікації оголошень безпосередньо з картки нерухомості.
        </p>
        <OlxSettingsForm />
      </div>

      {/* Sales plan */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gold-300">
        <h2 className="font-semibold text-navy-900 mb-1">План продажів</h2>
        <p className="text-xs text-gray-400 mb-5">
          Ціль відображається на дашборді у вигляді "продано / ціль". Рахує продажі з вказаної дати.
        </p>
        <SalesPlanForm initial={{ target: String(plan.target), label: plan.label, from: plan.from ?? "" }} />
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gold-300">
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
