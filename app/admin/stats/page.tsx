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

  const [inquiries, properties] = await Promise.all([
    prisma.inquiry.findMany({ where: inquiryWhere, select: { source: true } }),
    prisma.property.findMany({ where: propertyWhere, select: { source: true } }),
  ]);

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
