import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import SourcePieChart from "@/components/admin/SourcePieChart";
import SalesBarChart from "@/components/admin/SalesBarChart";

export const dynamic = "force-dynamic";

const UK_MONTHS = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];

// Історичні дані до запуску системи
const LEGACY_SALES = [
  { label: "Генсіцька", count: 24 },
  { label: "Христя Б",  count: 20 },
  { label: "Наталія",   count: 14 },
  { label: "Влад",      count: 11 },
  { label: "Адріан",    count:  8 },
  { label: "Карина",    count:  6 },
  { label: "Максим",    count:  3 },
  { label: "Марія",     count:  3 },
  { label: "Галина",    count:  2 },
];

function matchesLegacy(agentName: string, legacyLabel: string): boolean {
  const nameLow = agentName.toLowerCase();
  const firstWord = legacyLabel.split(" ")[0].toLowerCase();
  return nameLow.includes(firstWord.substring(0, 5));
}

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

export default async function StatsPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const role = (session.user as any)?.role as string ?? "EMPLOYEE";

  const period = searchParams.period === "month" ? "month" : "all";

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthName = UK_MONTHS[now.getMonth()];

  const dateFilter = period === "month" ? { gte: startOfMonth } : undefined;

  const propertyWhere = {};
  const inquiryWhere = {};
  const salesWhere = {};

  const [inquiries, properties, sales, allTimeSales, allEmployees] = await Promise.all([
    prisma.inquiry.findMany({
      where: { ...inquiryWhere, ...(dateFilter ? { createdAt: dateFilter } : {}) },
      select: { source: true },
    }),
    prisma.property.findMany({
      where: { ...propertyWhere, ...(dateFilter ? { createdAt: dateFilter } : {}) },
      select: { source: true },
    }),
    prisma.sale.findMany({
      where: { ...salesWhere, ...(dateFilter ? { createdAt: dateFilter } : {}) },
      include: { agent: { select: { id: true, name: true } } },
      orderBy: { saleDate: "desc" },
    }),
    prisma.sale.findMany({
      include: { agent: { select: { id: true, name: true } } },
    }),
    prisma.user.findMany({
      where: { role: { in: ["EMPLOYEE", "ADMIN"] } },
      select: { id: true, name: true },
    }),
  ]);

  // Build all-time merged chart data (legacy + DB)
  const mergedMap: Record<string, { agent: string; count: number; commission: number; currency: string }> = {};
  for (const s of allTimeSales) {
    const key = s.agentId ?? "?";
    const name = s.agent?.name ?? "Невідомий";
    if (!mergedMap[key]) mergedMap[key] = { agent: name, count: 0, commission: 0, currency: s.currency };
    mergedMap[key].count += 1;
    mergedMap[key].commission += s.commission ?? 0;
  }
  // Merge legacy into matched DB agents
  const usedLegacy = new Set<string>();
  for (const entry of Object.values(mergedMap)) {
    for (const leg of LEGACY_SALES) {
      if (!usedLegacy.has(leg.label) && matchesLegacy(entry.agent, leg.label)) {
        entry.count += leg.count;
        usedLegacy.add(leg.label);
        break;
      }
    }
  }
  // Add unmatched legacy entries — resolve to full employee name if possible
  for (const leg of LEGACY_SALES) {
    if (!usedLegacy.has(leg.label)) {
      const matched = allEmployees.find(u => u.name && matchesLegacy(u.name, leg.label));
      mergedMap[`legacy_${leg.label}`] = {
        agent: matched?.name ?? leg.label,
        count: leg.count,
        commission: 0,
        currency: "USD",
      };
    }
  }
  const allTimeChartData = Object.values(mergedMap).sort((a, b) => b.count - a.count);
  const allTimeTotal = allTimeChartData.reduce((s, e) => s + e.count, 0);

  // Monthly chart (DB only)
  const monthlyMap: Record<string, { agent: string; count: number; commission: number; currency: string }> = {};
  for (const s of sales) {
    const key = s.agentId ?? "?";
    const name = s.agent?.name ?? "Невідомий";
    if (!monthlyMap[key]) monthlyMap[key] = { agent: name, count: 0, commission: 0, currency: s.currency };
    monthlyMap[key].count += 1;
    monthlyMap[key].commission += s.commission ?? 0;
  }
  const monthlyChartData = Object.values(monthlyMap).sort((a, b) => b.count - a.count);

  const agentChartData = period === "all" ? allTimeChartData : monthlyChartData;
  const chartTotal = period === "all" ? allTimeTotal : sales.length;

  const inquirySources  = groupBySource(inquiries);
  const propertySources = groupBySource(properties);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-navy-900">Статистика</h1>
      </div>

      {/* KPI row */}
      <div className={`grid gap-4 ${role === "ADMIN" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>
        {[
          { label: "Всього заявок", value: inquiries.length, color: "bg-blue-50 text-blue-600" },
          { label: "Всього об'єктів", value: properties.length, color: "bg-amber-50 text-amber-600" },
          { label: "Всього продажів", value: sales.length, color: "bg-emerald-50 text-emerald-600" },
          ...(role === "ADMIN" ? [{ label: "Комісія всього", value: sales.reduce((s, x) => s + (x.commission ?? 0), 0).toLocaleString("uk-UA") + " USD", color: "bg-purple-50 text-purple-600", small: true }] : []),
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gold-300">
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className={`font-bold ${(k as any).small ? "text-lg" : "text-2xl"} ${k.color.split(" ")[1]}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Pie charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SourcePieChart data={inquirySources}  title="Джерело заявок" />
        <SourcePieChart data={propertySources} title="Джерело об'єктів" />
      </div>

      {/* Sales bar chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gold-300 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-navy-900">Продажі по працівниках</h2>
            <p className="text-xs text-gray-400 mt-0.5">{chartTotal} продажів{period === "month" ? ` у ${monthName.toLowerCase()}` : " всього"}</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <Link
              href="/admin/stats"
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                period === "all" ? "bg-white text-navy-900 shadow-sm" : "text-gray-500 hover:text-navy-900"
              }`}
            >
              За весь час
            </Link>
            <Link
              href="/admin/stats?period=month"
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                period === "month" ? "bg-white text-navy-900 shadow-sm" : "text-gray-500 hover:text-navy-900"
              }`}
            >
              {monthName}
            </Link>
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
                  {role === "ADMIN" && row.commission > 0 && (
                    <span className="font-semibold text-navy-900 w-28 text-right">
                      {row.commission.toLocaleString("uk-UA")} {row.currency}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Source details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
