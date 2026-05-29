import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Building2, MessageSquare, Star, Sparkles, ImageOff, Bell, AlertCircle, Phone, Users, TrendingUp, Quote, Pin, Target } from "lucide-react";
import UnpinAnnouncementButton from "@/components/admin/UnpinAnnouncementButton";
import { getSalesPlan } from "@/lib/company";

async function getTodayReminders(role: string, userId: string) {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const where =
    role === "ADMIN"
      ? { followUpAt: { not: null, lte: todayEnd }, deletedAt: null }
      : { followUpAt: { not: null, lte: todayEnd }, assignedUserId: userId, deletedAt: null };
  return prisma.contact.findMany({
    where,
    orderBy: { followUpAt: "asc" },
    take: 5,
    select: { id: true, name: true, phone: true, type: true, followUpAt: true },
  });
}

async function getStats(role: string, userId: string) {
  const propertyWhere = role === "ADMIN" ? {} : { assignedUserId: userId };

  const [totalProperties, totalContacts, depositProperties] = await Promise.all([
    prisma.property.count({ where: propertyWhere }),
    prisma.contact.count(
      role === "ADMIN"
        ? { where: { deletedAt: null } }
        : { where: { assignedUserId: userId, deletedAt: null } }
    ),
    prisma.property.count({ where: { ...propertyWhere, status: "DEPOSIT" } }),
  ]);

  const recentProperties = await prisma.property.findMany({
    where: { ...propertyWhere, status: { not: "SOLD" } },
    take: 3,
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { order: "asc" as const }, take: 1 } },
  });

  return { totalProperties, totalContacts, depositProperties, recentProperties };
}

async function getTestimonialsForAdmin() {
  const [total, published, recent] = await Promise.all([
    prisma.testimonial.count(),
    prisma.testimonial.count({ where: { isPublished: true } }),
    prisma.testimonial.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, authorName: true, authorRole: true, contentUk: true, rating: true, isPublished: true },
    }),
  ]);
  return { total, published, recent };
}

async function getPinnedAnnouncement() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS company_settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT ''
      )
    `);
    const rows = await prisma.$queryRawUnsafe<{ key: string; value: string }[]>(
      `SELECT key, value FROM company_settings WHERE key IN ('pinned_announcement', 'pinned_announcement_sender')`
    );
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    const text = map["pinned_announcement"] ?? "";
    const sender = map["pinned_announcement_sender"] ?? "";
    return text ? { text, sender } : null;
  } catch {
    return null;
  }
}

function StatCard({
  icon, label, value, href, color,
}: {
  icon: React.ReactNode; label: string; value: number; href: string; color: string;
}) {
  return (
    <Link href={href} className="group bg-white rounded-2xl p-6 shadow-sm border border-gold-300 hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-200 flex items-center gap-4 cursor-pointer">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-navy-900 group-hover:text-gold-500 transition-colors duration-200">{value}</p>
        <p className="text-gray-500 text-sm">{label}</p>
      </div>
    </Link>
  );
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string ?? "EMPLOYEE";
  const userId = (session?.user as any)?.id as string;

  const [
    { totalProperties, totalContacts, depositProperties, recentProperties },
    todayReminders,
    testimonialsData,
    announcement,
    plan,
  ] = await Promise.all([
    getStats(role, userId),
    getTodayReminders(role, userId),
    role === "ADMIN" ? getTestimonialsForAdmin() : Promise.resolve(null),
    getPinnedAnnouncement(),
    getSalesPlan(),
  ]);

  const salesWhere = role === "ADMIN"
    ? (plan.from ? { saleDate: { gte: new Date(plan.from) } } : {})
    : (plan.from ? { saleDate: { gte: new Date(plan.from) }, agentId: userId } : { agentId: userId });
  const soldCount = await prisma.sale.count({ where: salesWhere });

  const isNew = (d: Date) => Date.now() - new Date(d).getTime() < 4 * 24 * 60 * 60 * 1000;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>

      {/* Announcement banner */}
      {announcement && (
        <div className="bg-navy-900 text-white rounded-2xl px-6 py-4 flex items-start gap-3 shadow-sm border border-gold-300">
          <Pin className="w-4 h-4 mt-0.5 text-gold-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gold-400 mb-1">Оголошення від адміна</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{announcement.text}</p>
            {announcement.sender && (
              <p className="text-xs text-white/50 mt-1">— {announcement.sender}</p>
            )}
          </div>
          {role === "ADMIN" && <UnpinAnnouncementButton />}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Building2 className="w-6 h-6 text-gray-500" />}
          label={role === "ADMIN" ? "Всього оголошень" : "Всього моїх"}
          value={totalProperties}
          href="/admin/properties"
          color="bg-gray-100"
        />
        <StatCard
          icon={<Building2 className="w-6 h-6 text-amber-600" />}
          label="На завдатку"
          value={depositProperties}
          href="/admin/properties?status=DEPOSIT"
          color="bg-amber-50"
        />
        <Link href="/admin/sales" className="group bg-white rounded-2xl p-6 shadow-sm border border-gold-300 hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-200 flex items-center gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 group-hover:scale-110 transition-transform duration-200">
            <Target className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            {plan.target > 0 ? (
              <p className="text-2xl font-bold leading-none">
                <span className="text-emerald-500">{soldCount}</span>
                <span className="text-gray-300 mx-0.5">/</span>
                <span className="text-red-400">{plan.target}</span>
              </p>
            ) : (
              <p className="text-2xl font-bold text-gray-300">—</p>
            )}
            <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{plan.label || "План продажів"}</p>
          </div>
        </Link>
      </div>

      {/* Recent properties — big cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-gold-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy-900">Нові оголошення</h2>
          <Link href="/admin/properties" className="text-sm text-gold-500 hover:text-gold-600">
            Всі →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
          {recentProperties.map((p) => {
            const img = p.images[0];
            const fresh = isNew(p.createdAt);
            const isRent = p.listingType !== "SALE";
            return (
              <Link key={p.id} href={`/admin/properties/${p.id}`}
                className="group flex flex-col rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition bg-gray-50">
                {/* Big image */}
                <div className="relative w-full aspect-[4/3] bg-gray-200 flex-shrink-0">
                  {img ? (
                    <Image src={img.url} alt={p.titleUk} fill className="object-cover group-hover:scale-105 transition duration-300" sizes="(max-width: 768px) 100vw, 33vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageOff className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${
                      isRent ? "bg-navy-100/90 text-navy-700" : "bg-gold-100/90 text-gold-700"
                    }`}>
                      {p.listingType === "SALE" ? "Продаж" : p.listingType === "RENT" ? "Оренда" : "Подобово"}
                    </span>
                    {fresh && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                        <Sparkles className="w-2 h-2" /> НОВЕ
                      </span>
                    )}
                  </div>
                </div>
                {/* Info */}
                <div className="p-3 flex-1">
                  <p className="text-sm font-semibold text-navy-900 group-hover:text-gold-500 transition leading-snug line-clamp-2 mb-1">
                    {p.titleUk}
                  </p>
                  <p className="text-xs text-gray-400 mb-2">
                    {p.district && <span>{p.district} · </span>}
                    {p.areaSqm}м²{p.rooms ? ` · ${p.rooms} кімн.` : ""}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-navy-900">
                      {Number(p.price).toLocaleString("uk-UA")} {p.currency}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>


      {/* Reminders widget */}
      {todayReminders.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gold-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-navy-900">Завдання на сьогодні</h2>
              <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {todayReminders.length}
              </span>
            </div>
            <Link href="/admin/reminders" className="text-sm text-gold-500 hover:text-gold-600">
              Всі →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {todayReminders.map((c) => {
              const isOverdue = new Date(c.followUpAt!) < new Date(new Date().setHours(0,0,0,0));
              return (
                <div key={c.id} className="px-6 py-3 flex items-center gap-3">
                  {isOverdue
                    ? <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    : <Bell className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-navy-900">{c.name}</span>
                    <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      c.type === "CLIENT" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {c.type === "CLIENT" ? "Клієнт" : "Власник"}
                    </span>
                  </div>
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-navy-900 transition flex-shrink-0">
                      <Phone className="w-3 h-3" />{c.phone}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/admin/properties/new" className="group bg-white rounded-2xl p-5 shadow-sm border border-gold-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <Building2 className="w-6 h-6 mb-2 text-indigo-600 group-hover:scale-110 transition-all duration-200" />
          <p className="font-semibold text-navy-900">Додати нерухомість</p>
          <p className="text-gray-400 text-sm mt-0.5">Нове оголошення</p>
        </Link>
        <Link href="/admin/contacts" className="group bg-white rounded-2xl p-5 shadow-sm border border-gold-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <Users className="w-6 h-6 mb-2 text-blue-500 group-hover:scale-110 transition-all duration-200" />
          <p className="font-semibold text-navy-900">Контакти</p>
          <p className="text-gray-400 text-sm mt-0.5">Клієнти та власники</p>
        </Link>
        <Link href="/admin/inquiries" className="group bg-white rounded-2xl p-5 shadow-sm border border-gold-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <MessageSquare className="w-6 h-6 mb-2 text-amber-500 group-hover:scale-110 transition-all duration-200" />
          <p className="font-semibold text-navy-900">Запити клієнтів</p>
          <p className="text-gray-400 text-sm mt-0.5">Переглянути всі</p>
        </Link>
        <Link href="/admin/properties?status=SOLD" className="group bg-white rounded-2xl p-5 shadow-sm border border-gold-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <TrendingUp className="w-6 h-6 mb-2 text-emerald-600 group-hover:scale-110 transition-all duration-200" />
          <p className="font-semibold text-navy-900">Мої продажі</p>
          <p className="text-gray-400 text-sm mt-0.5">Продані об'єкти</p>
        </Link>
      </div>
    </div>
  );
}
