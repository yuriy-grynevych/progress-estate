import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, MessageSquare, Eye, Star } from "lucide-react";

async function getStats(role: string, userId: string) {
  const propertyWhere = role === "ADMIN" ? {} : { assignedUserId: userId };

  const inquiryWhere =
    role === "ADMIN"
      ? {}
      : { OR: [{ propertyId: null }, { property: { assignedUserId: userId } }] };

  const [activeProperties, totalProperties, newInquiries, totalViews] = await Promise.all([
    prisma.property.count({ where: { ...propertyWhere, status: "ACTIVE" } }),
    prisma.property.count({ where: propertyWhere }),
    prisma.inquiry.count({ where: { ...inquiryWhere, status: "NEW" } }),
    prisma.property.aggregate({ _sum: { viewCount: true }, where: propertyWhere }),
  ]);

  const recentInquiries = await prisma.inquiry.findMany({
    where: { ...inquiryWhere, status: "NEW" },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { property: { select: { titleUk: true, slug: true } } },
  });

  return {
    activeProperties,
    totalProperties,
    newInquiries,
    totalViews: totalViews._sum.viewCount ?? 0,
    recentInquiries,
  };
}

function StatCard({
  icon,
  label,
  value,
  href,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
  color: string;
}) {
  return (
    <Link href={href} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-navy-900">{value}</p>
        <p className="text-gray-500 text-sm">{label}</p>
      </div>
    </Link>
  );
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string ?? "EMPLOYEE";
  const userId = (session?.user as any)?.id as string;

  const { activeProperties, totalProperties, newInquiries, totalViews, recentInquiries } =
    await getStats(role, userId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Building2 className="w-6 h-6 text-navy-900" />}
          label={role === "ADMIN" ? "Активні оголошення" : "Мої активні"}
          value={activeProperties}
          href="/admin/properties"
          color="bg-navy-50"
        />
        <StatCard
          icon={<Building2 className="w-6 h-6 text-gray-500" />}
          label={role === "ADMIN" ? "Всього оголошень" : "Всього моїх"}
          value={totalProperties}
          href="/admin/properties"
          color="bg-gray-100"
        />
        <StatCard
          icon={<MessageSquare className="w-6 h-6 text-blue-600" />}
          label="Нові запити"
          value={newInquiries}
          href="/admin/inquiries"
          color="bg-blue-50"
        />
        <StatCard
          icon={<Eye className="w-6 h-6 text-gold-600" />}
          label="Загальні перегляди"
          value={totalViews}
          href="/admin/properties"
          color="bg-gold-50"
        />
      </div>

      {/* Recent inquiries */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy-900">Нові запити</h2>
          <Link href="/admin/inquiries" className="text-sm text-gold-500 hover:text-gold-600">
            Всі запити →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentInquiries.length === 0 && (
            <p className="text-gray-400 text-sm px-6 py-4">Немає нових запитів</p>
          )}
          {recentInquiries.map((inq) => (
            <div key={inq.id} className="px-6 py-4 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0 text-navy-900 font-bold text-sm">
                {inq.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-navy-900">{inq.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                    Нове
                  </span>
                </div>
                <p className="text-gray-500 text-xs truncate mt-0.5">{inq.message}</p>
                {inq.property && (
                  <p className="text-gray-400 text-xs mt-0.5">{inq.property.titleUk}</p>
                )}
              </div>
              <p className="text-gray-400 text-xs flex-shrink-0">
                {new Date(inq.createdAt).toLocaleDateString("uk-UA")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/properties/new"
          className="bg-black text-white rounded-2xl p-5 hover:bg-black/90 transition"
        >
          <Building2 className="w-6 h-6 mb-2" />
          <p className="font-semibold">Додати нерухомість</p>
          <p className="text-white/60 text-sm mt-0.5">Нове оголошення</p>
        </Link>
        <Link
          href="/admin/inquiries"
          className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <MessageSquare className="w-6 h-6 mb-2 text-navy-900" />
          <p className="font-semibold text-navy-900">Запити клієнтів</p>
          <p className="text-gray-400 text-sm mt-0.5">Переглянути всі</p>
        </Link>
        {role === "ADMIN" && (
          <Link
            href="/admin/testimonials"
            className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
          >
            <Star className="w-6 h-6 mb-2 text-navy-900" />
            <p className="font-semibold text-navy-900">Відгуки</p>
            <p className="text-gray-400 text-sm mt-0.5">Управляти відгуками</p>
          </Link>
        )}
      </div>
    </div>
  );
}
