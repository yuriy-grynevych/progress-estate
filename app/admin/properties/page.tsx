import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import DeletePropertyButton from "@/components/admin/DeletePropertyButton";
import ToggleStatusButton from "@/components/admin/ToggleStatusButton";
import CopyAgentLinkButton from "@/components/admin/CopyAgentLinkButton";
import AdminPropertyGallery from "@/components/admin/AdminPropertyGallery";
import { PlusCircle, Eye, Pencil } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Квартира",
  HOUSE: "Будинок",
  COMMERCIAL: "Комерція",
  LAND: "Земля",
  OFFICE: "Офіс",
};

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
    orderBy: { updatedAt: "desc" },
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

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" });
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
          const newProperty = isNew(property.createdAt);
          const isRent = property.listingType === "RENT";

          const currPrice = Number(property.price);
          const prevPrice = property.previousPrice ? Number(property.previousPrice) : null;
          const priceChanged = prevPrice !== null && prevPrice !== currPrice;
          const priceDrop = priceChanged && currPrice < prevPrice!;
          const priceDiff = priceChanged ? Math.abs(currPrice - prevPrice!) : 0;

          const editedLater =
            new Date(property.updatedAt).getTime() - new Date(property.createdAt).getTime() > 60_000;

          return (
            <div
              key={property.id}
              className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition overflow-hidden ${
                isOwn ? "border-gold-200" : "border-gray-100"
              }`}
            >
              <div className="flex flex-col sm:grid sm:grid-cols-[55%_45%]">
                {/* Gallery */}
                <AdminPropertyGallery
                  images={property.images}
                  title={property.titleUk}
                  isNew={newProperty}
                  isRent={isRent}
                />

                {/* Info — styl katalogu klienta */}
                <div className="p-4 sm:p-5 flex flex-col justify-between min-w-0">
                  <div>
                    {/* Price */}
                    <div className="mb-2">
                      <div className="text-2xl sm:text-3xl font-bold text-navy-900 leading-tight">
                        {formatPrice(currPrice, property.currency)}
                      </div>
                      {priceChanged && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-semibold text-gray-400">Зміна ціни</span>
                          <span className={`text-sm font-bold ${priceDrop ? "text-green-600" : "text-red-500"}`}>
                            {priceDrop ? "↓ −" : "↑ +"}
                            {formatPrice(priceDiff, property.currency)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <Link
                      href={`/uk/listings/${property.slug}`}
                      target="_blank"
                      className="block text-base sm:text-lg font-semibold text-gold-500 hover:text-gold-600 transition line-clamp-2 leading-snug mb-3"
                    >
                      {property.titleUk}
                    </Link>

                    {/* Details grid */}
                    <div className="grid grid-cols-3 gap-x-3 gap-y-3 mb-3">
                      <div>
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Площа</p>
                        <p className="text-sm font-bold text-navy-900">{property.areaSqm}м²</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">К-сть кімнат</p>
                        <p className="text-sm font-bold text-navy-900">{property.rooms ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Поверх</p>
                        <p className="text-sm font-bold text-navy-900">
                          {property.floor && property.totalFloors
                            ? `${property.floor}/${property.totalFloors}`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Район</p>
                        <p className="text-sm font-bold text-navy-900 truncate">{property.district ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Вулиця</p>
                        <p className="text-sm font-bold text-navy-900 truncate">
                          {property.address ? property.address.split(",")[0] : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Тип</p>
                        <p className="text-sm font-bold text-navy-900">{TYPE_LABELS[property.type] ?? property.type}</p>
                      </div>
                    </div>

                    {/* Dates */}
                    <p className="text-[11px] text-gray-400">
                      {fmtDate(property.createdAt)}
                      {editedLater && (
                        <> · <span>ред. {fmtDate(property.updatedAt)}</span></>
                      )}
                    </p>
                  </div>

                  {/* Bottom: status + actions */}
                  <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {canEdit ? (
                        <ToggleStatusButton
                          id={property.id}
                          field="status"
                          currentValue={property.status}
                          isFeatured={property.isFeatured}
                        />
                      ) : (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                          {property.status}
                        </span>
                      )}
                      {property.assignedUser && (
                        <span
                          className={`text-xs px-2 py-1 rounded-lg ${
                            isOwn
                              ? "bg-gold-100 text-gold-600 font-medium"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {property.assignedUser.name ?? property.assignedUser.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Eye className="w-3 h-3" /> {property.viewCount}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/uk/listings/${property.slug}`}
                        target="_blank"
                        className="text-gray-400 hover:text-navy-900 transition p-1.5 rounded-lg hover:bg-gray-100"
                        title="Переглянути на сайті"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {currentUser?.agentToken && (
                        <CopyAgentLinkButton
                          slug={property.slug}
                          locale="uk"
                          agentToken={currentUser.agentToken}
                        />
                      )}
                      {canEdit && (
                        <>
                          <Link
                            href={`/admin/properties/${property.id}`}
                            className="text-gray-400 hover:text-navy-900 transition p-1.5 rounded-lg hover:bg-gray-100"
                            title="Редагувати"
                          >
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
