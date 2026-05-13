import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AdminPropertyGallery from "@/components/admin/AdminPropertyGallery";
import PropertyMap from "@/components/property/PropertyMap";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import { PROPERTY_FEATURES } from "@/lib/constants";
import {
  ArrowLeft, ExternalLink, Pencil, Eye,
  Phone, Mail, MapPin, Lock,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Активне",
  INACTIVE: "Неактивне",
  SOLD: "Продано",
  RENTED: "Здано",
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-600",
  SOLD: "bg-blue-100 text-blue-700",
  RENTED: "bg-purple-100 text-purple-700",
};
const LISTING_LABELS: Record<string, string> = {
  SALE: "Продаж",
  RENT: "Оренда",
  DAILY_RENT: "Подобова",
};

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
}

export default async function AgentPropertyViewPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const role = (session.user as any)?.role as "ADMIN" | "EMPLOYEE" ?? "EMPLOYEE";
  const currentUserId = (session.user as any)?.id as string;

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      assignedUser: {
        select: {
          id: true, name: true, email: true, phone: true,
          photoUrl: true, instagram: true, accentColor: true,
        },
      },
      ownerContact: {
        select: { id: true, name: true, phone: true, email: true, notes: true },
      },
    },
  });

  if (!property) notFound();

  const isAssigned = property.assignedUserId === currentUserId;
  const canEdit = role === "ADMIN" || isAssigned;
  const canSeeOwner = role === "ADMIN" || isAssigned;

  const agent = property.assignedUser;
  const agentColor: string = (agent as any)?.accentColor ?? "#C9A84C";

  const currPrice = Number(property.price);
  const prevPrice = property.previousPrice ? Number(property.previousPrice) : null;
  const priceDiff = prevPrice !== null ? currPrice - prevPrice : 0;

  const specs = [
    property.areaSqm != null && { label: "Площа", value: `${property.areaSqm} м²` },
    (property as any).kitchenSqm != null && { label: "Кухня", value: `${(property as any).kitchenSqm} м²` },
    property.rooms != null && { label: "Кімнати", value: property.rooms },
    property.bedrooms != null && { label: "Спальні", value: property.bedrooms },
    property.bathrooms != null && { label: "Санвузли", value: property.bathrooms },
    property.floor != null && {
      label: "Поверх",
      value: property.totalFloors ? `${property.floor}/${property.totalFloors}` : property.floor,
    },
    property.yearBuilt != null && { label: "Рік будівлі", value: property.yearBuilt },
    (property as any).renovationType && { label: "Ремонт", value: (property as any).renovationType },
    (property as any).wallType && { label: "Тип стін", value: (property as any).wallType },
    (property as any).gasType && { label: "Газ", value: (property as any).gasType },
  ].filter(Boolean) as { label: string; value: string | number }[];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/properties"
            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500 flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-navy-900 line-clamp-1">{property.titleUk}</h1>
            {(property.district || property.address) && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {[property.district, property.address].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/uk/listings/${property.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
          >
            <ExternalLink className="w-4 h-4" />
            На сайті
          </Link>
          {canEdit && (
            <Link
              href={`/admin/properties/${property.id}`}
              className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/90 transition"
            >
              <Pencil className="w-4 h-4" />
              Редагувати
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Gallery — lightbox is active (no linkToSlug) */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <AdminPropertyGallery
              images={property.images}
              title={property.titleUk}
              isRent={property.listingType === "RENT" || property.listingType === "DAILY_RENT"}
              isNew={Date.now() - new Date(property.createdAt).getTime() < 4 * 24 * 60 * 60 * 1000}
            />
          </div>

          {/* Price + badges */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-black text-white">
                    {LISTING_LABELS[property.listingType] ?? property.listingType}
                  </span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {getPropertyTypeLabel(property.type, "uk")}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[property.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[property.status] ?? property.status}
                  </span>
                  {property.isFeatured && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-600">
                      🔥 Гаряча пропозиція
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-navy-900">
                  {formatPrice(currPrice, property.currency)}
                </div>
                {prevPrice !== null && priceDiff !== 0 && (
                  <div className={`text-sm font-semibold mt-0.5 ${priceDiff < 0 ? "text-green-600" : "text-red-500"}`}>
                    {priceDiff < 0 ? "↓ Зниження: −" : "↑ Зростання: +"}{formatPrice(Math.abs(priceDiff), property.currency)}
                  </div>
                )}
                {property.areaSqm > 0 && (
                  <p className="text-sm text-gray-400 mt-0.5">
                    {formatPrice(Math.round(currPrice / property.areaSqm), property.currency)} / м²
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                <Eye className="w-4 h-4" />
                {property.viewCount} переглядів
              </div>
            </div>
          </div>

          {/* Specs */}
          {specs.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-bold text-navy-900 mb-3">Характеристики</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {specs.map((spec, i) => (
                  <div key={i} className="flex flex-col p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400">{spec.label}</p>
                    <p className="font-semibold text-navy-900 mt-0.5">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {property.descriptionUk && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-bold text-navy-900 mb-3">Опис</h2>
              <div
                className="prose prose-sm max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: property.descriptionUk }}
              />
            </div>
          )}

          {/* Features */}
          {property.features.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-bold text-navy-900 mb-3">Зручності</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {property.features.map((feature) => {
                  const found = PROPERTY_FEATURES.find((f) => f.value === feature);
                  return (
                    <div key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: agentColor }} />
                      {found ? found.labelUk : feature}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Map */}
          {property.latitude && property.longitude && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-bold text-navy-900 mb-3">Розташування</h2>
              <PropertyMap lat={property.latitude} lng={property.longitude} title={property.titleUk} />
            </div>
          )}

          {/* Agent comments */}
          {((property.agentComments as any[]) ?? []).length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-bold text-navy-900 mb-3">Коментарі агента</h2>
              <div className="space-y-2">
                {(property.agentComments as any[]).map((c, i) => (
                  <div key={i} className="bg-blue-50 rounded-xl px-3 py-2 text-sm text-gray-700">
                    <span className="font-semibold text-blue-600">{c.author}:</span> {c.text}
                    {c.createdAt && (
                      <span className="text-[10px] text-gray-400 ml-2">
                        {new Date(c.createdAt).toLocaleDateString("uk-UA")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Agent card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Агент</p>
            {agent ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2"
                    style={{ borderColor: agentColor }}
                  >
                    {agent.photoUrl ? (
                      <Image
                        src={agent.photoUrl}
                        alt={agent.name ?? ""}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-xl font-bold text-white"
                        style={{ backgroundColor: agentColor }}
                      >
                        {agent.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-navy-900">{agent.name ?? agent.email}</p>
                    <p className="text-xs text-gray-400">
                      {isAssigned ? "Ви — відповідальний агент" : "Відповідальний агент"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {agent.phone && (
                    <a
                      href={`tel:${agent.phone}`}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-navy-900 transition"
                    >
                      <Phone className="w-4 h-4 text-gray-400" />
                      {agent.phone}
                    </a>
                  )}
                  <a
                    href={`mailto:${agent.email}`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-navy-900 transition"
                  >
                    <Mail className="w-4 h-4 text-gray-400" />
                    {agent.email}
                  </a>
                  {(agent as any).instagram && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <span className="text-gray-400">@</span>
                      {(agent as any).instagram.replace("@", "")}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">Агент не призначений</p>
            )}
          </div>

          {/* Owner — only for admin or assigned agent */}
          {canSeeOwner && property.ownerContact && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
              <div className="flex items-center gap-1.5 mb-3">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Власник (приватно)</p>
              </div>
              <p className="font-bold text-navy-900 mb-3">{property.ownerContact.name}</p>
              <div className="space-y-2">
                {property.ownerContact.phone && (
                  <a
                    href={`tel:${property.ownerContact.phone}`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-navy-900 transition"
                  >
                    <Phone className="w-4 h-4 text-gray-400" />
                    {property.ownerContact.phone}
                  </a>
                )}
                {property.ownerContact.email && (
                  <a
                    href={`mailto:${property.ownerContact.email}`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-navy-900 transition"
                  >
                    <Mail className="w-4 h-4 text-gray-400" />
                    {property.ownerContact.email}
                  </a>
                )}
                {property.ownerContact.notes && (
                  <p className="text-xs text-gray-600 mt-2 bg-amber-50 rounded-xl p-3 leading-relaxed">
                    {property.ownerContact.notes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Internal note */}
          {(property as any).internalNote && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Внутрішня примітка</p>
              <p className="text-sm text-gray-600 leading-relaxed">{(property as any).internalNote}</p>
            </div>
          )}

          {/* Commission */}
          {(property as any).commissionAmount != null && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Комісія</p>
              <p className="text-lg font-bold text-navy-900">
                {(property as any).commissionAmount}
                {(property as any).commissionType === "PERCENT"
                  ? "%"
                  : ` ${(property as any).commissionCurrency ?? "USD"}`}
              </p>
            </div>
          )}

          {/* Dates */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Дати</p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-400">Додано: </span>
                <span className="text-gray-700">{fmtDate(property.createdAt)}</span>
              </p>
              <p>
                <span className="text-gray-400">Оновлено: </span>
                <span className="text-gray-700">{fmtDate(property.updatedAt)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
