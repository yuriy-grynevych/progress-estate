import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SourcePieChart from "@/components/admin/SourcePieChart";

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

  // Group sales by agent + month
  type AgentMonthKey = string;
  const salesByAgentMonth: Record<AgentMonthKey, { agentName: string; month: string; count: number; commission: number; currency: string }> = {};
  for (const s of sales) {
    const d = new Date(s.saleDate);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = d.toLocaleDateString("uk-UA", { month: "long", year: "numeric" });
    const agentName = s.agent?.name ?? "Невідомий";
    const key = `${s.agentId ?? "?"}__${month}`;
    if (!salesByAgentMonth[key]) {
      salesByAgentMonth[key] = { agentName, month: monthLabel, count: 0, commission: 0, currency: s.currency };
    }
    salesByAgentMonth[key].count += 1;
    salesByAgentMonth[key].commission += s.commission ?? 0;
  }
  const salesRows = Object.values(salesByAgentMonth).sort((a, b) => b.month.localeCompare(a.month));

  const inquirySources  = groupBySource(inquiries);
  const propertySources = groupBySource(properties);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Статистика</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <SourcePieChart data={inquirySources}  title="Джерело заявок" />
        <SourcePieChart data={propertySources} title="Джерело об'єктів" />
      </div>

      {/* Summary table — inquiries */}
      <div className="bg-white rounded-2xl shadow-sm mb-4">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy-900 text-sm">Деталі — Заявки</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Джерело</th>
              <th className="text-right px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">К-сть</th>
              <th className="text-right px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {inquirySources.map((row) => (
              <tr key={row.name} className="hover:bg-gray-50 transition">
                <td className="px-5 py-2.5 font-medium text-navy-900">{row.name}</td>
                <td className="px-5 py-2.5 text-right font-bold text-navy-900">{row.value}</td>
                <td className="px-5 py-2.5 text-right text-gray-400">
                  {Math.round((row.value / (inquiries.length || 1)) * 100)}%
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className="px-5 py-2.5 font-bold text-navy-900">Всього</td>
              <td className="px-5 py-2.5 text-right font-bold text-navy-900">{inquiries.length}</td>
              <td className="px-5 py-2.5 text-right font-bold text-gray-500">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Sales by agent per month */}
      <div className="bg-white rounded-2xl shadow-sm mb-4">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-navy-900 text-sm">Продажі по агентах</h2>
          <span className="text-xs text-gray-400">{sales.length} продажів всього</span>
        </div>
        {salesRows.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400 text-center">Продажів ще немає</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Агент</th>
                <th className="text-left px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Місяць</th>
                <th className="text-right px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Продажів</th>
                <th className="text-right px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Комісія</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {salesRows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-2.5 font-medium text-navy-900">{row.agentName}</td>
                  <td className="px-5 py-2.5 text-gray-500 capitalize">{row.month}</td>
                  <td className="px-5 py-2.5 text-right font-bold text-navy-900">{row.count}</td>
                  <td className="px-5 py-2.5 text-right text-gray-700">
                    {row.commission > 0 ? `${row.commission.toLocaleString("uk-UA")} ${row.currency}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary table — properties */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy-900 text-sm">Деталі — Об'єкти</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Джерело</th>
              <th className="text-right px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">К-сть</th>
              <th className="text-right px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {propertySources.map((row) => (
              <tr key={row.name} className="hover:bg-gray-50 transition">
                <td className="px-5 py-2.5 font-medium text-navy-900">{row.name}</td>
                <td className="px-5 py-2.5 text-right font-bold text-navy-900">{row.value}</td>
                <td className="px-5 py-2.5 text-right text-gray-400">
                  {Math.round((row.value / (properties.length || 1)) * 100)}%
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className="px-5 py-2.5 font-bold text-navy-900">Всього</td>
              <td className="px-5 py-2.5 text-right font-bold text-navy-900">{properties.length}</td>
              <td className="px-5 py-2.5 text-right font-bold text-gray-500">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
