import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyGallery from "@/components/property/PropertyGallery";
import PropertyMap from "@/components/property/PropertyMap";
import ContactForm from "@/components/property/ContactForm";
import { formatPrice, getPropertyTypeLabel, getListingTypeLabel } from "@/lib/utils";
import { PROPERTY_FEATURES } from "@/lib/constants";
import { Bed, Bath, Maximize2, Layers, Calendar, MapPin, Home } from "lucide-react";
import type { PropertyImage } from "@prisma/client";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

async function getProperty(slug: string) {
  const property = await prisma.property.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: "asc" } },
      assignedUser: {
        select: { id: true, name: true, email: true, phone: true, photoUrl: true, agentToken: true },
      },
    },
  });

  if (property) {
    await prisma.property.update({
      where: { id: property.id },
      data: { viewCount: { increment: 1 } },
    });
  }

  return property;
}

async function getAgentByToken(token: string) {
  return prisma.user.findUnique({
    where: { agentToken: token },
    select: { id: true, name: true, email: true, phone: true, photoUrl: true, agentToken: true },
  });
}

export async function generateMetadata({
  params: { slug, locale },
}: {
  params: { slug: string; locale: string };
}) {
  const property = await prisma.property.findUnique({ where: { slug } });
  if (!property) return {};
  const title = locale === "uk" ? property.titleUk : property.titleEn;
  return {
    title: `${title} | Progress Estate`,
    description: property.address,
  };
}

export default async function PropertyPage({
  params: { slug, locale },
  searchParams,
}: {
  params: { slug: string; locale: string };
  searchParams: { t?: string };
}) {
  setRequestLocale(locale);
  const property = await getProperty(slug);
  if (!property) notFound();

  // Token overrides assigned agent; fallback to assigned agent
  const agent = searchParams.t
    ? await getAgentByToken(searchParams.t)
    : property.assignedUser ?? null;

  const isUk = locale === "uk";
  const title = isUk ? property.titleUk : property.titleEn;
  const description = isUk ? property.descriptionUk : property.descriptionEn;

  const specs = [
    property.areaSqm && {
      icon: <Maximize2 className="w-4 h-4" />,
      label: isUk ? "Площа" : "Area",
      value: `${property.areaSqm} м²`,
    },
    property.rooms && {
      icon: <Home className="w-4 h-4" />,
      label: isUk ? "Кімнати" : "Rooms",
      value: property.rooms,
    },
    property.bedrooms && {
      icon: <Bed className="w-4 h-4" />,
      label: isUk ? "Спальні" : "Bedrooms",
      value: property.bedrooms,
    },
    property.bathrooms && {
      icon: <Bath className="w-4 h-4" />,
      label: isUk ? "Санвузли" : "Bathrooms",
      value: property.bathrooms,
    },
    property.floor && {
      icon: <Layers className="w-4 h-4" />,
      label: isUk ? "Поверх" : "Floor",
      value: property.totalFloors
        ? `${property.floor} / ${property.totalFloors}`
        : property.floor,
    },
    property.yearBuilt && {
      icon: <Calendar className="w-4 h-4" />,
      label: isUk ? "Рік будівлі" : "Year built",
      value: property.yearBuilt,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string | number }[];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-sm text-gray-500 flex items-center gap-2">
            <a href={`/${locale}`} className="hover:text-navy-900">
              {isUk ? "Головна" : "Home"}
            </a>
            <span>/</span>
            <a href={`/${locale}/listings`} className="hover:text-navy-900">
              {isUk ? "Оголошення" : "Listings"}
            </a>
            <span>/</span>
            <span className="text-navy-900 truncate max-w-xs">{title}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: gallery + details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gallery */}
              <PropertyGallery images={property.images as PropertyImage[]} title={title} />

              {/* Title + price */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-black text-white">
                        {getListingTypeLabel(property.listingType, locale)}
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {getPropertyTypeLabel(property.type, locale)}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
                    {property.address && (
                      <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-sm">
                        <MapPin className="w-4 h-4" />
                        {property.address}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gold-500">
                      {formatPrice(Number(property.price), property.currency)}
                    </p>
                    {property.areaSqm && (
                      <p className="text-sm text-gray-400 mt-1">
                        {formatPrice(
                          Math.round(Number(property.price) / property.areaSqm),
                          property.currency
                        )}{" "}
                        / м²
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Specs */}
              {specs.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-navy-900 mb-4">
                    {isUk ? "Характеристики" : "Specifications"}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {specs.map((spec, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="text-gold-500">{spec.icon}</div>
                        <div>
                          <p className="text-xs text-gray-500">{spec.label}</p>
                          <p className="font-semibold text-navy-900">{spec.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {description && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-navy-900 mb-4">
                    {isUk ? "Опис" : "Description"}
                  </h2>
                  <div
                    className="prose prose-sm max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                </div>
              )}

              {/* Features */}
              {property.features.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-navy-900 mb-4">
                    {isUk ? "Зручності" : "Amenities"}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {property.features.map((feature) => {
                      const found = PROPERTY_FEATURES.find((f) => f.value === feature);
                      return (
                        <div key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="w-2 h-2 rounded-full bg-gold-400 flex-shrink-0" />
                          {found ? (isUk ? found.labelUk : found.labelEn) : feature}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Map */}
              {property.latitude && property.longitude && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-navy-900 mb-4">
                    {isUk ? "Розташування" : "Location"}
                  </h2>
                  <PropertyMap lat={property.latitude} lng={property.longitude} title={title} />
                </div>
              )}
            </div>

            {/* Right: contact form */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ContactForm
                  propertyId={property.id}
                  propertyTitle={title}
                  locale={locale}
                  agent={agent}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
