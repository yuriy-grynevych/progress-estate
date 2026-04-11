import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import DeletePropertyButton from "@/components/admin/DeletePropertyButton";
import ToggleStatusButton from "@/components/admin/ToggleStatusButton";
import CopyAgentLinkButton from "@/components/admin/CopyAgentLinkButton";
import { PlusCircle, Eye, Pencil, ImageOff, Sparkles } from "lucide-react";

async function getProperties(search?: string, role?: string, userId?: string) {
  const searchWhere = search
    ? {
        OR: [
          { titleUk: { contains: search, mode: "insensitive" as const } },
          { address: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const properties = await prisma.property.findMany({
    where: searchWhere,
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { order: "asc" as const }, take: 5 },
      assignedUser: { select: { id: true, name: true, email: true } },
    },
  });

  if (role === "EMPLOYEE" && userId) {
    const own = properties.filter((p) => p.assignedUserId === userId);
    const others = properties.filter((p) => p.assignedUserId !== userId);
    return [...own, ...others];
  }
  return properties;
}

function isNew(createdAt: Date) {
  return Date.now() - new Date(createdAt).getTime() < 4 * 24 * 60 * 60 * 1000;
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string ?? "EMPLOYEE";
  const userId = (session?.user as any)?.id as string;

  const properties = await getProperties(searchParams.search, role, userId);
  const featuredCount = properties.filter((p) => p.isFeatured).length;

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { agentToken: true },
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-3 flex-wrap">
          Нерухомість
          <span className="text-gray-400 font-normal text-base">({properties.length})</span>
          {featuredCount > 0 && (
            <span className="text-xs font-medium bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full">
              🔥 {featuredCount}
            </span>
          )}
        </h1>
        <Link
          href="/admin/properties/new"
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/90 transition"
        >
          <PlusCircle className="w-4 h-4" />
          Додати
        </Link>
      </div>

      {/* Search */}
      <form className="mb-5">
        <input
          type="text"
          name="search"
          defaultValue={searchParams.search}
          placeholder="Пошук за назвою або адресою..."
          className="w-full sm:w-80 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
        />
      </form>

      {/* Cards */}
      <div className="flex flex-col gap-4">
        {properties.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl">
            Нерухомість не знайдена
          </div>
        )}
        {properties.map((property) => {
          const isOwn = property.assignedUserId === userId;
          const canEdit = role === "ADMIN" || isOwn;
          const mainImg = property.images.find((i) => i.isPrimary) ?? property.images[0];
          const thumbs = property.images.filter((i) => i !== mainImg).slice(0, 4);
          const newProperty = isNew(property.createdAt);
          const isRent = property.listingType === "RENT";

          return (
            <div key={property.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition overflow-hidden ${isOwn ? "border-gold-200" : "border-gray-100"}`}>
              <div className="flex flex-col sm:flex-row">

                {/* Main photo */}
                <div className="relative sm:w-72 aspect-[4/3] sm:aspect-auto flex-shrink-0 bg-gray-100 overflow-hidden">
                  {mainImg ? (
                    <Image src={mainImg.url} alt={property.titleUk} fill className="object-cover" sizes="288px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageOff className="w-8 h-8" />
                    </div>
                  )}
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {newProperty && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" /> НОВИНКА
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isRent ? "bg-navy-700 text-white" : "bg-gold-400 text-white"}`}>
                      {isRent ? "ОРЕНДА" : "ПРОДАЖ"}
                    </span>
                  </div>
                </div>

                {/* Thumbs 2×2 */}
                {thumbs.length > 0 && (
                  <div className="hidden sm:grid grid-cols-2 w-32 gap-0.5 flex-shrink-0 bg-gray-100">
                    {[0,1,2,3].map((i) => thumbs[i] ? (
                      <div key={i} className="relative aspect-square overflow-hidden">
                        <Image src={thumbs[i].url} alt="" fill className="object-cover" sizes="48px" />
                      </div>
                    ) : <div key={i} className="aspect-square bg-gray-50" />)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Link href={`/uk/listings/${property.slug}`} target="_blank" className="font-semibold text-navy-900 hover:text-gold-500 transition line-clamp-2 text-sm leading-snug">
                        {property.titleUk}
                      </Link>
                      <span className="text-base font-bold text-navy-900 whitespace-nowrap flex-shrink-0">
                        {formatPrice(Number(property.price), property.currency)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {property.address ?? property.district ?? "—"}
                      {property.areaSqm ? ` · ${property.areaSqm} м²` : ""}
                      {property.rooms ? ` · ${property.rooms} кімн.` : ""}
                      {property.floor && property.totalFloors ? ` · ${property.floor}/${property.totalFloors} пов.` : ""}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(property.createdAt).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-50 flex-wrap">
                    {/* Status + agent */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {canEdit ? (
                        <ToggleStatusButton id={property.id} field="status" currentValue={property.status} isFeatured={property.isFeatured} />
                      ) : (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{property.status}</span>
                      )}
                      {property.assignedUser && (
                        <span className={`text-xs px-2 py-1 rounded-lg ${isOwn ? "bg-gold-100 text-gold-600 font-medium" : "bg-gray-100 text-gray-500"}`}>
                          {property.assignedUser.name ?? property.assignedUser.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Eye className="w-3 h-3" /> {property.viewCount}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link href={`/uk/listings/${property.slug}`} target="_blank" className="text-gray-400 hover:text-navy-900 transition p-1.5 rounded-lg hover:bg-gray-100" title="Переглянути на сайті">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {currentUser?.agentToken && (
                        <CopyAgentLinkButton slug={property.slug} locale="uk" agentToken={currentUser.agentToken} />
                      )}
                      {canEdit && (
                        <>
                          <Link href={`/admin/properties/${property.id}`} className="text-gray-400 hover:text-navy-900 transition p-1.5 rounded-lg hover:bg-gray-100" title="Редагувати">
                            <Pencil className="w-4 h-4" />
                          </Link>
                          {role === "ADMIN" && <DeletePropertyButton id={property.id} />}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
