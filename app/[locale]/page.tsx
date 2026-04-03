import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import WhyUsSection from "@/components/home/WhyUsSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import PropertyCard from "@/components/listings/PropertyCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

async function getFeaturedProperties() {
  return prisma.property.findMany({
    where: { isFeatured: true, status: "ACTIVE" },
    include: { images: { orderBy: { order: "asc" } } },
    take: 6,
    orderBy: { createdAt: "desc" },
  });
}

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const featuredProperties = await getFeaturedProperties();
  const isUk = locale === "uk";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />

        {featuredProperties.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-navy-900">
                  {isUk ? "Виділені об'єкти" : "Featured Properties"}
                </h2>
                <Link
                  href={`/${locale}/listings`}
                  className="flex items-center gap-1.5 text-gold-500 hover:text-gold-600 font-medium text-sm"
                >
                  {isUk ? "Всі оголошення" : "All Listings"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} locale={locale} />
                ))}
              </div>
            </div>
          </section>
        )}

        <WhyUsSection />
        <TestimonialsSection locale={locale} />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
