import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SourcePieChart from "@/components/admin/SourcePieChart";
import SalesBarChart from "@/components/admin/SalesBarChart";

export const dynamic = "force-dynamic";

function groupBySource(items: { source: string | null }[]) {
  const map: Record<string, number> = {};
  for (const item of items) {
    const key = item.source?.trim() || "Інше";
    map[key] = (map[key] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export default async function StatsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const role = (session.user as any)?.role as string ?? "EMPLOYEE";
  const userId = (session.user as any)?.id as string;

  const propertyWhere = role === "ADMIN" ? {} : { assignedUserId: userId };
  const inquiryWhere = role === "ADMIN" ? {} : {
    OR: [
      { assignedUserId: userId },
      { referredByUserId: userId },
      { property: { assignedUserId: userId } },
    ],
  };

  const salesWhere = role === "ADMIN" ? {} : { agentId: userId };

  const [inquiries, properties, sales] = await Promise.all([
    prisma.inquiry.findMany({ where: inquiryWhere, select: { source: true } }),
    prisma.property.findMany({ where: propertyWhere, select: { source: true } }),
    prisma.sale.findMany({
      where: salesWhere,
      include: { agent: { select: { id: true, name: true } } },
      orderBy: { saleDate: "desc" },
    }),
  ]);

  // Group sales by agent (for bar chart)
  const salesByAgent: Record<string, { agent: string; count: number; commission: number; currency: string }> = {};
  for (const s of sales) {
    const agentName = s.agent?.name ?? "Невідомий";
    const key = s.agentId ?? "?";
    if (!salesByAgent[key]) {
      salesByAgent[key] = { agent: agentName, count: 0, commission: 0, currency: s.currency };
    }
    salesByAgent[key].count += 1;
    salesByAgent[key].commission += s.commission ?? 0;
  }
  const agentChartData = Object.values(salesByAgent).sort((a, b) => b.count - a.count);

  const inquirySources  = groupBySource(inquiries);
  const propertySources = groupBySource(properties);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-navy-900">Статистика</h1>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Всього заявок", value: inquiries.length, color: "bg-blue-50 text-blue-600" },
          { label: "Всього об'єктів", value: properties.length, color: "bg-amber-50 text-amber-600" },
          { label: "Всього продажів", value: sales.length, color: "bg-emerald-50 text-emerald-600" },
          { label: "Комісія всього", value: sales.reduce((s, x) => s + (x.commission ?? 0), 0).toLocaleString("uk-UA") + " USD", color: "bg-purple-50 text-purple-600", small: true },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gold-300">
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className={`font-bold ${k.small ? "text-lg" : "text-2xl"} ${k.color.split(" ")[1]}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Pie charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SourcePieChart data={inquirySources}  title="Джерело заявок" />
        <SourcePieChart data={propertySources} title="Джерело об'єктів" />
      </div>

      {/* Sales bar chart — by agent */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gold-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-navy-900">Продажі по працівниках</h2>
            <p className="text-xs text-gray-400 mt-0.5">{sales.length} продажів всього</p>
          </div>
        </div>
        <SalesBarChart data={agentChartData} />
        {agentChartData.length > 0 && (
          <div className="mt-4 divide-y divide-gray-50">
            {agentChartData.map((row, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ["#4f86f7","#f7c948","#e05c5c","#5cbf85","#a78bfa"][i % 5] }} />
                  <span className="font-medium text-navy-900">{row.agent}</span>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="text-gray-500">{row.count} прод.</span>
                  <span className="font-semibold text-navy-900 w-28 text-right">
                    {row.commission > 0 ? `${row.commission.toLocaleString("uk-UA")} ${row.currency}` : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Source details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inquiries detail */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gold-300">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-navy-900 text-sm">Деталі — Заявки</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {inquirySources.map((row) => (
                <tr key={row.name} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-2.5 font-medium text-navy-900">{row.name}</td>
                  <td className="px-5 py-2.5 text-right font-bold text-navy-900">{row.value}</td>
                  <td className="px-5 py-2.5 text-right text-gray-400 w-14">
                    {Math.round((row.value / (inquiries.length || 1)) * 100)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="px-5 py-2.5 text-navy-900">Всього</td>
                <td className="px-5 py-2.5 text-right text-navy-900">{inquiries.length}</td>
                <td className="px-5 py-2.5 text-right text-gray-500">100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Properties detail */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gold-300">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-navy-900 text-sm">Деталі — Об'єкти</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {propertySources.map((row) => (
                <tr key={row.name} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-2.5 font-medium text-navy-900">{row.name}</td>
                  <td className="px-5 py-2.5 text-right font-bold text-navy-900">{row.value}</td>
                  <td className="px-5 py-2.5 text-right text-gray-400 w-14">
                    {Math.round((row.value / (properties.length || 1)) * 100)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="px-5 py-2.5 text-navy-900">Всього</td>
                <td className="px-5 py-2.5 text-right text-navy-900">{properties.length}</td>
                <td className="px-5 py-2.5 text-right text-gray-500">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
