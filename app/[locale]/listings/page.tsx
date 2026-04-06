import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/listings/PropertyCard";
import FilterBar from "@/components/listings/FilterBar";
import Pagination from "@/components/listings/Pagination";
import { PAGE_SIZE } from "@/lib/constants";
import { Prisma } from "@prisma/client";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

interface SearchParams {
  listingType?: string;
  type?: string;
  district?: string;
  priceMin?: string;
  priceMax?: string;
  areaMin?: string;
  areaMax?: string;
  rooms?: string;
  search?: string;
  page?: string;
  sort?: string;
  [key: string]: string | undefined;
}

async function getProperties(sp: SearchParams) {
  const page = Number(sp.page ?? 1);

  const where: Prisma.PropertyWhereInput = {
    status: "ACTIVE",
    ...(sp.listingType && { listingType: sp.listingType as any }),
    ...(sp.type && { type: sp.type as any }),
    ...(sp.district && { district: sp.district }),
    ...((sp.priceMin || sp.priceMax)
      ? {
          price: {
            ...(sp.priceMin && { gte: Number(sp.priceMin) }),
            ...(sp.priceMax && { lte: Number(sp.priceMax) }),
          },
        }
      : {}),
    ...((sp.areaMin || sp.areaMax)
      ? {
          areaSqm: {
            ...(sp.areaMin && { gte: Number(sp.areaMin) }),
            ...(sp.areaMax && { lte: Number(sp.areaMax) }),
          },
        }
      : {}),
    ...(sp.rooms && { rooms: { gte: Number(sp.rooms) } }),
    ...(sp.search && {
      OR: [
        { titleUk: { contains: sp.search, mode: "insensitive" } },
        { titleEn: { contains: sp.search, mode: "insensitive" } },
        { address: { contains: sp.search, mode: "insensitive" } },
      ],
    }),
  };

  const orderBy: Prisma.PropertyOrderByWithRelationInput =
    sp.sort === "price_asc"
      ? { price: "asc" }
      : sp.sort === "price_desc"
      ? { price: "desc" }
      : sp.sort === "areaSqm_desc"
      ? { areaSqm: "desc" }
      : { createdAt: "desc" };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { images: { orderBy: { order: "asc" } } },
    }),
    prisma.property.count({ where }),
  ]);

  return { properties, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export default async function ListingsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: SearchParams;
}) {
  setRequestLocale(locale);
  const { properties, total, page, totalPages } = await getProperties(searchParams);
  const isUk = locale === "uk";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-navy-900 mb-6">
            {isUk ? "Оголошення" : "Listings"}
            <span className="text-gray-400 font-normal text-base ml-3">
              ({total})
            </span>
          </h1>
          <div className="flex flex-col lg:flex-row gap-8">
            <FilterBar locale={locale} searchParams={searchParams} />
            <div className="flex-1 min-w-0">
              {properties.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <p className="text-lg font-medium">
                    {isUk ? "Оголошень не знайдено" : "No properties found"}
                  </p>
                  <p className="text-sm mt-1">
                    {isUk
                      ? "Спробуйте змінити параметри пошуку"
                      : "Try adjusting your search parameters"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4">
                    {properties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        locale={locale}
                      />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-8">
                      <Pagination currentPage={page} totalPages={totalPages} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
