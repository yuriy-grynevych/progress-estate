import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Building2, MessageSquare, Star, Sparkles, ImageOff, Bell, AlertCircle, Phone, Users, TrendingUp, Quote, Pin } from "lucide-react";

async function getTodayReminders(role: string, userId: string) {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const where =
    role === "ADMIN"
      ? { followUpAt: { not: null, lte: todayEnd } }
      : { followUpAt: { not: null, lte: todayEnd }, assignedUserId: userId };
  return prisma.contact.findMany({
    where,
    orderBy: { followUpAt: "asc" },
    take: 5,
    select: { id: true, name: true, phone: true, type: true, followUpAt: true },
  });
}

async function getStats(role: string, userId: string) {
  const propertyWhere = role === "ADMIN" ? {} : { assignedUserId: userId };
  const inquiryWhere =
    role === "ADMIN"
      ? {}
      : { OR: [{ propertyId: null }, { property: { assignedUserId: userId } }] };

  const [activeProperties, totalProperties, newInquiries, totalContacts] = await Promise.all([
    prisma.property.count({ where: { ...propertyWhere, status: "ACTIVE" } }),
    prisma.property.count({ where: propertyWhere }),
    prisma.inquiry.count({ where: { ...inquiryWhere, status: "NEW" } }),
    prisma.contact.count(
      role === "ADMIN"
        ? {}
        : { where: { assignedUserId: userId } }
    ),
  ]);

  const recentProperties = await prisma.property.findMany({
    where: propertyWhere,
    take: 3,
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { order: "asc" as const }, take: 1 } },
  });

  return { activeProperties, totalProperties, newInquiries, totalContacts, recentProperties };
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

  const [
    { activeProperties, totalProperties, newInquiries, totalContacts, recentProperties },
    todayReminders,
    testimonialsData,
    announcement,
  ] = await Promise.all([
    getStats(role, userId),
    getTodayReminders(role, userId),
    role === "ADMIN" ? getTestimonialsForAdmin() : Promise.resolve(null),
    getPinnedAnnouncement(),
  ]);

  const isNew = (d: Date) => Date.now() - new Date(d).getTime() < 4 * 24 * 60 * 60 * 1000;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>

      {/* Announcement banner */}
      {announcement && (
        <div className="bg-navy-900 text-white rounded-2xl px-6 py-4 flex items-start gap-3 shadow-sm">
          <Pin className="w-4 h-4 mt-0.5 text-gold-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gold-400 mb-1">Оголошення від адміна</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{announcement.text}</p>
            {announcement.sender && (
              <p className="text-xs text-white/50 mt-1">— {announcement.sender}</p>
            )}
          </div>
        </div>
      )}

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
          icon={<Users className="w-6 h-6 text-emerald-600" />}
          label={role === "ADMIN" ? "Контактів у базі" : "Мої контакти"}
          value={totalContacts}
          href="/admin/contacts"
          color="bg-emerald-50"
        />
      </div>

      {/* Recent properties — big cards */}
      <div className="bg-white rounded-2xl shadow-sm">
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

      {/* Testimonials — ADMIN ONLY */}
      {role === "ADMIN" && testimonialsData && (
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Quote className="w-4 h-4 text-gold-500" />
              <h2 className="font-semibold text-navy-900">Відгуки клієнтів</h2>
              <span className="text-xs font-semibold bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full">
                {testimonialsData.published} опубл. / {testimonialsData.total} всього
              </span>
            </div>
            <Link href="/admin/testimonials" className="text-sm text-gold-500 hover:text-gold-600">
              Управляти →
            </Link>
          </div>
          {testimonialsData.recent.length === 0 ? (
            <p className="text-gray-400 text-sm px-6 py-4">Відгуків ще немає</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {testimonialsData.recent.map((t) => (
                <div key={t.id} className="px-6 py-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center flex-shrink-0 text-gold-700 font-bold text-sm">
                    {t.authorName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm text-navy-900">{t.authorName}</span>
                      {t.authorRole && <span className="text-xs text-gray-400">{t.authorRole}</span>}
                      <span className="flex gap-0.5 ml-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < t.rating ? "text-gold-400 fill-gold-400" : "text-gray-200 fill-gray-200"}`} />
                        ))}
                      </span>
                      {!t.isPublished && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Чернетка</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{t.contentUk}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reminders widget */}
      {todayReminders.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm">
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
        <Link href="/admin/properties/new" className="bg-black text-white rounded-2xl p-5 hover:bg-black/90 transition">
          <Building2 className="w-6 h-6 mb-2" />
          <p className="font-semibold">Додати нерухомість</p>
          <p className="text-white/60 text-sm mt-0.5">Нове оголошення</p>
        </Link>
        <Link href="/admin/contacts" className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <Users className="w-6 h-6 mb-2 text-navy-900" />
          <p className="font-semibold text-navy-900">Контакти</p>
          <p className="text-gray-400 text-sm mt-0.5">Клієнти та власники</p>
        </Link>
        <Link href="/admin/inquiries" className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <MessageSquare className="w-6 h-6 mb-2 text-navy-900" />
          <p className="font-semibold text-navy-900">Запити клієнтів</p>
          <p className="text-gray-400 text-sm mt-0.5">Переглянути всі</p>
        </Link>
        <Link href="/admin/properties?status=SOLD" className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <TrendingUp className="w-6 h-6 mb-2 text-emerald-600" />
          <p className="font-semibold text-navy-900">Мої продажі</p>
          <p className="text-gray-400 text-sm mt-0.5">Продані об'єкти</p>
        </Link>
      </div>
    </div>
  );
}
