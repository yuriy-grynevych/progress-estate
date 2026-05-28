import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TrendingUp, Plus } from "lucide-react";

export default async function SalesPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string ?? "EMPLOYEE";
  const isAdmin = role === "ADMIN";
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      property: { select: { id: true, titleUk: true, slug: true } },
      clientContact: { select: { name: true, phone: true } },
      agent: { select: { name: true } },
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Продажі</h1>
        <Link href="/admin/sales/new" className="flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-navy-800 transition">
          <Plus className="w-4 h-4" /> Записати продаж
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gold-300 overflow-hidden">
        {sales.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <TrendingUp className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>Продажів ще немає</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 px-5 py-2 border-b border-gray-100 bg-gray-50">
              <div className="w-10 flex-shrink-0" />
              <div className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Об&apos;єкт / Клієнт</div>
              {isAdmin
                ? <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-right flex-shrink-0">Комісія / Агент</div>
                : <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-right flex-shrink-0">Агент</div>
              }
              <div className="w-20 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right flex-shrink-0">Дата</div>
            </div>
            <div className="divide-y divide-gray-50">
              {sales.map(s => {
                const propertyTitle = s.saleType === "OWN" ? (s.property?.titleUk ?? "—") : (s.externalName ?? "—");
                const isOwn = s.saleType === "OWN";
                const clientName = s.clientContact?.name ?? s.clientName ?? null;
                return (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition group">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${isOwn ? "bg-navy-100 text-navy-700" : "bg-gray-100 text-gray-500"}`}>
                      {propertyTitle[0]?.toUpperCase() ?? "?"}
                    </div>
                    {/* Property */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isOwn && s.property?.id ? (
                          <Link href={`/admin/properties/${s.property.id}/view`} className="font-semibold text-sm text-navy-900 hover:text-gold-600 transition line-clamp-1">
                            {propertyTitle}
                          </Link>
                        ) : (
                          <span className="font-semibold text-sm text-navy-900 line-clamp-1">{propertyTitle}</span>
                        )}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isOwn ? "bg-navy-100 text-navy-700" : "bg-gray-100 text-gray-500"}`}>
                          {isOwn ? "Наша" : "Зовнішня"}
                        </span>
                      </div>
                      {clientName && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <span>👤</span> {clientName}
                          {(s.clientContact?.phone ?? s.clientPhone) && <span className="text-gray-300">· {s.clientContact?.phone ?? s.clientPhone}</span>}
                        </p>
                      )}
                    </div>
                    {/* Commission / Agent */}
                    <div className="text-right flex-shrink-0">
                      {isAdmin && (
                        <p className="font-bold text-sm text-navy-900">
                          {s.commission ? `${Number(s.commission).toLocaleString("uk-UA")} ${s.currency}` : "—"}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">{s.agent?.name ?? "—"}</p>
                    </div>
                    {/* Date */}
                    <div className="text-xs text-gray-400 flex-shrink-0 w-20 text-right">
                      {new Date(s.saleDate).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
