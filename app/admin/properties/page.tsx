import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inferCoords } from "@/lib/map-data";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import DeletePropertyButton from "@/components/admin/DeletePropertyButton";
import ToggleStatusButton from "@/components/admin/ToggleStatusButton";
import CopyAgentLinkButton from "@/components/admin/CopyAgentLinkButton";
import AdminPropertyGallery from "@/components/admin/AdminPropertyGallery";
import AgentCommentsToggle from "@/components/admin/AgentCommentsToggle";
import AdminPropertySidebar from "@/components/admin/AdminPropertySidebar";
import { PlusCircle, Eye, Pencil } from "lucide-react";
import { Suspense } from "react";

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Квартира",
  HOUSE: "Будинок",
  COMMERCIAL: "Комерція",
  LAND: "Земля",
  OFFICE: "Офіс",
};

async function getProperties(opts: {
  search?: string;
  listingType?: string;
  status?: string;
  mine?: boolean;
  userId: string;
  rooms?: string;
  type?: string;
  district?: string;
  priceMin?: string;
  priceMax?: string;
  areaMin?: string;
  areaMax?: string;
  floorMin?: string;
  floorMax?: string;
  priceSqmMin?: string;
  priceSqmMax?: string;
  renovationType?: string;
  buildingStage?: string;
  noCoords?: boolean;
}) {
  const { search, listingType, status, mine, userId, rooms, type, district, priceMin, priceMax, areaMin, areaMax, floorMin, floorMax, priceSqmMin, priceSqmMax, renovationType, buildingStage, noCoords } = opts;

  const where: any = {};

  if (search) {
    where.OR = [
      { titleUk: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
    ];
  }
  if (listingType) where.listingType = listingType;
  if (status) {
    where.status = status;
  } else {
    // Hide SOLD properties unless a sale was registered within the last day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    where.NOT = {
      AND: [
        { status: "SOLD" },
        { sales: { none: { createdAt: { gte: oneDayAgo } } } },
      ],
    };
  }
  if (mine) where.assignedUserId = userId;
  if (rooms) where.rooms = parseInt(rooms) || undefined;
  if (type) where.type = type;
  if (district) where.district = { contains: district, mode: "insensitive" };
  if (priceMin || priceMax) {
    where.price = {};
    if (priceMin) where.price.gte = parseFloat(priceMin);
    if (priceMax) where.price.lte = parseFloat(priceMax);
  }
  if (areaMin || areaMax) {
    where.areaSqm = {};
    if (areaMin) where.areaSqm.gte = parseFloat(areaMin);
    if (areaMax) where.areaSqm.lte = parseFloat(areaMax);
  }
  if (floorMin || floorMax) {
    where.floor = {};
    if (floorMin) where.floor.gte = parseInt(floorMin);
    if (floorMax) where.floor.lte = parseInt(floorMax);
  }
  if (renovationType) where.renovationType = renovationType;
  if (buildingStage) where.buildingStage = buildingStage;

  let result = await prisma.property.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      images: { orderBy: { order: "asc" as const }, take: 5 },
      assignedUser: {
        select: { id: true, name: true, email: true, photoUrl: true, accentColor: true },
      },
    },
  });

  if (priceSqmMin || priceSqmMax) {
    result = result.filter(p => {
      const sqm = Number(p.price) / Number(p.areaSqm);
      if (priceSqmMin && sqm < Number(priceSqmMin)) return false;
      if (priceSqmMax && sqm > Number(priceSqmMax)) return false;
      return true;
    });
  }

  if (noCoords) {
    result = result.filter(p => {
      if (p.latitude != null && p.longitude != null) return false;
      const inferred = inferCoords(p.titleUk, p.address ?? "", p.district);
      return !inferred.source;
    });
  }

  return result;
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
  searchParams: {
    search?: string; listingType?: string; status?: string; mine?: string;
    rooms?: string; type?: string; district?: string;
    priceMin?: string; priceMax?: string; areaMin?: string; areaMax?: string;
    floorMin?: string; floorMax?: string;
    priceSqmMin?: string; priceSqmMax?: string;
    renovationType?: string; buildingStage?: string;
    noCoords?: string;
  };
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string ?? "EMPLOYEE";
  const userId = (session?.user as any)?.id as string;

  const properties = await getProperties({
    search: searchParams.search,
    listingType: searchParams.listingType,
    status: searchParams.status,
    mine: searchParams.mine === "1",
    userId,
    rooms: searchParams.rooms,
    type: searchParams.type,
    district: searchParams.district,
    priceMin: searchParams.priceMin,
    priceMax: searchParams.priceMax,
    areaMin: searchParams.areaMin,
    areaMax: searchParams.areaMax,
    floorMin: searchParams.floorMin,
    floorMax: searchParams.floorMax,
    priceSqmMin: searchParams.priceSqmMin,
    priceSqmMax: searchParams.priceSqmMax,
    renovationType: searchParams.renovationType,
    buildingStage: searchParams.buildingStage,
    noCoords: searchParams.noCoords === "1",
  });

  const featuredCount = properties.filter((p) => p.isFeatured).length;

  // When viewing archive, fetch sale info for each property
  const salesMap: Record<string, { saleDate: Date; agentName: string | null }> = {};
  if (searchParams.status === "SOLD" && properties.length > 0) {
    const propIds = properties.map(p => p.id);
    const sales = await prisma.sale.findMany({
      where: { propertyId: { in: propIds } },
      orderBy: { saleDate: "desc" },
      select: { propertyId: true, saleDate: true, agent: { select: { name: true } } },
    });
    for (const s of sales) {
      if (s.propertyId && !salesMap[s.propertyId]) {
        salesMap[s.propertyId] = { saleDate: s.saleDate, agentName: s.agent?.name ?? null };
      }
    }
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { agentToken: true },
  });

  // Fetch who last changed status for each visible property
  const statusChangerMap: Record<string, { userName: string; photoUrl?: string | null; accentColor?: string | null }> = {};
  if (properties.length > 0) {
    const propIds = properties.map(p => p.id);
    const auditLogs = await prisma.propertyAuditLog.findMany({
      where: { propertyId: { in: propIds } },
      orderBy: { createdAt: "desc" },
      select: { propertyId: true, userId: true, userName: true, changes: true },
    });
    const seenProps = new Set<string>();
    const changerUserIds: string[] = [];
    const logMap: Record<string, { userId: string; userName: string }> = {};
    for (const log of auditLogs) {
      if (!seenProps.has(log.propertyId) &&
          log.changes && typeof log.changes === "object" &&
          "status" in (log.changes as Record<string, unknown>)) {
        seenProps.add(log.propertyId);
        logMap[log.propertyId] = { userId: log.userId, userName: log.userName };
        changerUserIds.push(log.userId);
      }
    }
    const changerUsers = changerUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: changerUserIds } },
          select: { id: true, photoUrl: true, accentColor: true },
        })
      : [];
    const changerUserMap = Object.fromEntries(changerUsers.map(u => [u.id, u]));
    for (const [propId, { userId: cUid, userName }] of Object.entries(logMap)) {
      statusChangerMap[propId] = {
        userName,
        photoUrl: changerUserMap[cUid]?.photoUrl ?? null,
        accentColor: changerUserMap[cUid]?.accentColor ?? null,
      };
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {searchParams.status === "SOLD" ? (
          <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-3 flex-wrap">
            🏛️ Архів — продані
            <span className="text-gray-400 font-normal text-base">({properties.length})</span>
          </h1>
        ) : (
          <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-3 flex-wrap">
            Нерухомість
            <span className="text-gray-400 font-normal text-base">({properties.length})</span>
            {featuredCount > 0 && (
              <span className="text-xs font-medium bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full">
                🔥 {featuredCount}
              </span>
            )}
          </h1>
        )}
        <div className="flex items-center gap-2">
          {searchParams.status === "SOLD" ? (
            <Link
              href="/admin/properties"
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              ← Назад
            </Link>
          ) : (
            <Link
              href="/admin/properties?status=SOLD"
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              🏛️ Архів
            </Link>
          )}
          <Link
            href="/admin/properties/new"
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/90 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Додати
          </Link>
        </div>
      </div>

      {/* noCoords banner */}
      {searchParams.noCoords === "1" && (
        <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
          <span>⚠️ Показані лише об&apos;єкти <b>без GPS-координат</b> — додайте адресу або координати щоб вони з&apos;явились на карті.</span>
          <Link href="/admin/properties" className="ml-auto text-xs underline whitespace-nowrap">Скинути фільтр</Link>
        </div>
      )}

      {/* Filters at the top */}
      <Suspense fallback={<div className="h-10 mb-4" />}>
        <AdminPropertySidebar />
      </Suspense>

      {/* Search */}
      <div>
        <form className="mb-4">
            {Object.entries(searchParams).filter(([k]) => k !== "search").map(([k, v]) =>
              v ? <input key={k} type="hidden" name={k} value={v} /> : null
            )}
            <input
              type="text"
              name="search"
              defaultValue={searchParams.search}
              placeholder="Пошук за назвою або адресою..."
              className="w-full sm:w-80 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </form>

          {/* Cards */}
          <div className="flex flex-col gap-3">
            {properties.length === 0 && (
              <div className="text-center py-16 text-gray-400 bg-white rounded-2xl">
                Нерухомість не знайдена
              </div>
            )}
            {properties.map((property) => {
              const isOwn = property.assignedUserId === userId;
              const canEdit = role === "ADMIN" || isOwn;
              const newProperty = isNew(property.createdAt);
              const isRent = property.listingType === "RENT" || property.listingType === "DAILY_RENT";

              const currPrice = Number(property.price);
              const prevPrice = property.previousPrice ? Number(property.previousPrice) : null;
              const priceChanged = prevPrice !== null && prevPrice !== currPrice;
              const priceDrop = priceChanged && currPrice < prevPrice!;
              const priceDiff = priceChanged ? Math.abs(currPrice - prevPrice!) : 0;

              const editedLater =
                new Date(property.updatedAt).getTime() - new Date(property.createdAt).getTime() > 60_000;

              const agentColor = (property.assignedUser as any)?.accentColor ?? "#C9A84C";
              const viewHref = `/admin/properties/${property.id}/view`;

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-2xl border border-gold-300 shadow-sm border border-gold-300 hover:shadow-md transition overflow-hidden"
                >
                  <div className="flex flex-col sm:grid sm:grid-cols-[55%_45%]">
                    {/* Gallery — click navigates to agent view */}
                    <AdminPropertyGallery
                      images={property.images}
                      title={property.titleUk}
                      isNew={newProperty}
                      isRent={isRent}
                      navigateTo={viewHref}
                      linkToSlug={property.slug}
                    />

                    {/* Info */}
                    <div className="p-3 sm:p-4 flex flex-col justify-between min-w-0">
                      <div>
                        {/* Price */}
                        <div className="mb-1">
                          <div className="text-xl sm:text-2xl font-bold text-navy-900 leading-tight">
                            {formatPrice(currPrice, property.currency)}
                          </div>
                          {newProperty && !priceChanged && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-emerald-600">
                              <span className="text-base font-extrabold uppercase tracking-wide">✨ Нове</span>
                            </div>
                          )}
                          {priceChanged && (
                            <div className={`flex items-center gap-1.5 mt-0.5 ${priceDrop ? "text-green-600" : "text-red-500"}`}>
                              <span className="text-base font-extrabold uppercase tracking-wide">Зміна ціни</span>
                              <span className="text-base font-extrabold">
                                {priceDrop ? "↓ −" : "↑ +"}{formatPrice(priceDiff, property.currency)}
                              </span>
                            </div>
                          )}
                          {property.status === "DEPOSIT" && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-amber-600">
                              <span className="text-base font-extrabold uppercase tracking-wide">🔒 Завдаток</span>
                            </div>
                          )}
                          {property.status === "SOLD" && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-green-600">
                              <span className="text-base font-extrabold uppercase tracking-wide">✅ Продано</span>
                            </div>
                          )}
                        </div>

                        {/* Title — links to agent view */}
                        <Link
                          href={viewHref}
                          className="block text-sm sm:text-base font-semibold text-gold-500 hover:text-gold-600 transition line-clamp-1 leading-snug mb-2"
                        >
                          {property.titleUk}
                        </Link>

                        {/* Details grid */}
                        <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 mb-2">
                          <div>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Площа</p>
                            <p className="text-xs font-bold text-navy-900">{property.areaSqm}м²</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">К-сть кімнат</p>
                            <p className="text-xs font-bold text-navy-900">{property.rooms ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Поверх</p>
                            <p className="text-xs font-bold text-navy-900">
                              {property.floor && property.totalFloors
                                ? `${property.floor}/${property.totalFloors}`
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Район</p>
                            <p className="text-xs font-bold text-navy-900 truncate">{property.district ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Вулиця</p>
                            <p className="text-xs font-bold text-navy-900 truncate">
                              {property.address ? property.address.split(",")[0] : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Тип</p>
                            <p className="text-xs font-bold text-navy-900">{TYPE_LABELS[property.type] ?? property.type}</p>
                          </div>
                        </div>

                        {/* Dates */}
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                          <span className="font-medium text-gray-500">Додано:</span> {fmtDate(property.createdAt)}
                          {editedLater && (
                            <> · <span className="font-medium text-gray-500">Ред.:</span> {fmtDate(property.updatedAt)}</>
                          )}
                        </p>
                        {salesMap[property.id] && (
                          <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                            ✅ Продано: {fmtDate(salesMap[property.id].saleDate)}
                            {salesMap[property.id].agentName && ` — ${salesMap[property.id].agentName}`}
                          </p>
                        )}
                        <AgentCommentsToggle comments={(property.agentComments as any) ?? []} />
                      </div>

                      {/* Bottom: status + actions */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-100 flex-wrap">
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

                          {/* Who changed status */}
                          {statusChangerMap[property.id] && (() => {
                            const changer = statusChangerMap[property.id];
                            const color = changer.accentColor ?? "#C9A84C";
                            const firstName = changer.userName.split(" ")[0];
                            return (
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
                                  style={{ backgroundColor: color }}
                                >
                                  {changer.photoUrl ? (
                                    <Image src={changer.photoUrl} alt={changer.userName} width={20} height={20} className="object-cover object-top w-full h-full" unoptimized />
                                  ) : (
                                    changer.userName[0]?.toUpperCase() ?? "?"
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-400">{firstName}</span>
                              </div>
                            );
                          })()}

                          {/* Agent badge with avatar */}
                          {property.assignedUser && (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border"
                                style={{ borderColor: agentColor }}
                              >
                                {(property.assignedUser as any).photoUrl ? (
                                  <Image
                                    src={(property.assignedUser as any).photoUrl}
                                    alt={property.assignedUser.name ?? ""}
                                    width={20}
                                    height={20}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white"
                                    style={{ backgroundColor: agentColor }}
                                  >
                                    {property.assignedUser.name?.[0]?.toUpperCase() ?? "?"}
                                  </div>
                                )}
                              </div>
                              <span
                                className="text-xs px-2 py-0.5 rounded-lg font-medium"
                                style={{
                                  backgroundColor: `${agentColor}1a`,
                                  color: agentColor,
                                }}
                              >
                                {property.assignedUser.name ?? property.assignedUser.email}
                              </span>
                            </div>
                          )}

                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Eye className="w-3 h-3" /> {property.viewCount}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={viewHref}
                            className="text-gray-400 hover:text-navy-900 transition p-1.5 rounded-lg hover:bg-gray-100"
                            title="Переглянути"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {currentUser?.agentToken && (
                            <CopyAgentLinkButton
                              slug={property.slug}
                              locale="uk"
                              agentToken={currentUser.agentToken}
                              propertyId={property.id}
                            />
                          )}
                          {canEdit && role === "ADMIN" && (
                            <DeletePropertyButton id={property.id} />
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
    </div>
  );
}
