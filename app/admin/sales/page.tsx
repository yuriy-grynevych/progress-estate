import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TrendingUp, Plus } from "lucide-react";

export default async function SalesPage() {
  const session = await getServerSession(authOptions);
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      property: { select: { titleUk: true, slug: true } },
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

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {sales.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <TrendingUp className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>Продажів ще немає</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Об&apos;єкт</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Клієнт</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Комісія</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Агент</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {s.saleType === "OWN" ? (
                      <span className="text-navy-900 font-medium">
                        {s.property?.titleUk ?? "—"}
                        <span className="ml-2 text-[10px] bg-navy-100 text-navy-700 px-1.5 py-0.5 rounded-full">Наша</span>
                      </span>
                    ) : (
                      <span className="text-gray-700">
                        {s.externalName ?? "—"}
                        <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Зовнішня</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {s.clientContact?.name ?? s.clientName ?? "—"}
                    {(s.clientContact?.phone ?? s.clientPhone) && (
                      <span className="block text-xs text-gray-400">{s.clientContact?.phone ?? s.clientPhone}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {s.commission ? `${s.commission.toLocaleString("uk-UA")} ${s.currency}` : "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{s.agent?.name ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-400">{new Date(s.saleDate).toLocaleDateString("uk-UA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
