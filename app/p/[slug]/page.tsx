import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PropertyGallery from "@/components/property/PropertyGallery";
import PropertyMap from "@/components/property/PropertyMap";
import ContactForm from "@/components/property/ContactForm";
import { formatPrice, getPropertyTypeLabel, getListingTypeLabel } from "@/lib/utils";
import { PROPERTY_FEATURES } from "@/lib/constants";
import { Bed, Bath, Maximize2, Layers, Calendar, MapPin, Home, Flame, Wrench, Building2, ChefHat } from "lucide-react";
import type { PropertyImage } from "@prisma/client";
import Image from "next/image";

export const dynamic = "force-dynamic";

function formatDescription(text: string): string {
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  const parts = text.split("•");
  if (parts.length <= 1) return `<p>${text.replace(/\n/g, "<br>")}</p>`;
  let html = "";
  const intro = parts[0].trim();
  if (intro) {
    html += intro.split(/\n+/).filter(Boolean).map((p) => `<p>${p.trim()}</p>`).join("");
  }
  const items = parts.slice(1).map((s) => s.trim()).filter(Boolean);
  if (items.length > 0) html += `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  return html;
}

async function getProperty(slug: string) {
  return prisma.property.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: "asc" } },
      assignedUser: {
        select: { id: true, name: true, email: true, phone: true, photoUrl: true, agentToken: true },
      },
    },
  });
}

async function getAgentByToken(token: string) {
  return prisma.user.findUnique({
    where: { agentToken: token },
    select: { id: true, name: true, email: true, phone: true, photoUrl: true, agentToken: true },
  });
}

export default async function SharedPropertyPage({
  params: { slug },
  searchParams,
}: {
  params: { slug: string };
  searchParams: { t?: string };
}) {
  const property = await getProperty(slug);
  if (!property) notFound();

  const agent = searchParams.t
    ? await getAgentByToken(searchParams.t)
    : property.assignedUser ?? null;

  const title = property.titleUk;
  const description = property.descriptionUk;

  const specs = [
    property.areaSqm != null && { icon: <Maximize2 className="w-4 h-4" />, label: "Площа", value: `${property.areaSqm} м²` },
    (property as any).kitchenSqm != null && { icon: <ChefHat className="w-4 h-4" />, label: "Кухня", value: `${(property as any).kitchenSqm} м²` },
    property.rooms != null && { icon: <Home className="w-4 h-4" />, label: "Кімнати", value: property.rooms },
    property.bedrooms != null && { icon: <Bed className="w-4 h-4" />, label: "Спальні", value: property.bedrooms },
    property.bathrooms != null && { icon: <Bath className="w-4 h-4" />, label: "Санвузли", value: property.bathrooms },
    property.floor != null && { icon: <Layers className="w-4 h-4" />, label: "Поверх", value: property.totalFloors ? `${property.floor} / ${property.totalFloors}` : property.floor },
    property.yearBuilt != null && { icon: <Calendar className="w-4 h-4" />, label: "Рік будівлі", value: property.yearBuilt },
    (property as any).renovationType && { icon: <Wrench className="w-4 h-4" />, label: "Ремонт", value: (property as any).renovationType },
    (property as any).wallType && { icon: <Building2 className="w-4 h-4" />, label: "Тип стін", value: (property as any).wallType },
    (property as any).gasType && { icon: <Flame className="w-4 h-4" />, label: "Газ", value: (property as any).gasType },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string | number }[];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Minimal header — no full site navbar */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-2 flex items-center flex-shrink-0">
        <Image src="/logo-progress.png" alt="Житлова компанія Progress" width={140} height={42} className="object-contain" />
      </div>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: gallery + details */}
            <div className="lg:col-span-2 space-y-6">
              <PropertyGallery images={property.images as PropertyImage[]} title={title} />

              {/* Title + price */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-black text-white">
                        {getListingTypeLabel(property.listingType, "uk")}
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {getPropertyTypeLabel(property.type, "uk")}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
                    {(property.address || property.district) && (
                      <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-sm">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        {[property.district, property.address].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gold-500">
                      {formatPrice(Number(property.price), property.currency)}
                    </p>
                    {property.areaSqm && (
                      <p className="text-sm text-gray-400 mt-1">
                        {formatPrice(Math.round(Number(property.price) / property.areaSqm), property.currency)} / м²
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Specs */}
              {specs.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-navy-900 mb-4">Характеристики</h2>
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
                  <h2 className="text-lg font-bold text-navy-900 mb-4">Опис</h2>
                  <div
                    className="prose prose-sm max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: formatDescription(description) }}
                  />
                </div>
              )}

              {/* Features */}
              {property.features.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-navy-900 mb-4">Зручності</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {property.features.map((feature) => {
                      const found = PROPERTY_FEATURES.find((f) => f.value === feature);
                      return (
                        <div key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="w-2 h-2 rounded-full bg-gold-400 flex-shrink-0" />
                          {found ? found.labelUk : feature}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Map */}
              {property.latitude && property.longitude && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-navy-900 mb-4">Розташування</h2>
                  <PropertyMap lat={property.latitude} lng={property.longitude} title={title} />
                </div>
              )}
            </div>

            {/* Right: contact form */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <ContactForm
                  propertyId={property.id}
                  propertyTitle={title}
                  locale="uk"
                  agent={agent}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-4 text-center text-xs text-gray-400">
        Житлова компанія Progress · Івано-Франківськ
      </footer>
    </div>
  );
}
