import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhyUsSection from "@/components/home/WhyUsSection";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default function AboutPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const isUk = locale === "uk";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="bg-black text-white py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold mb-4">
              {isUk ? "Про житлова компанія Progress" : "About житлова компанія Progress"}
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              {isUk
                ? "Ваш надійний партнер у нерухомості Івано-Франківська"
                : "Your trusted real estate partner in Ivano-Frankivsk"}
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-navy-900 mb-4">
              {isUk ? "Наша місія" : "Our Mission"}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {isUk
                ? "житлова компанія Progress — це команда досвідчених фахівців з ринку нерухомості Івано-Франківська. Ми допомагаємо нашим клієнтам знайти ідеальне житло, вигідно продати власність або зробити правильні інвестиції в нерухомість регіону. Наш підхід базується на прозорості, чесності та глибокому знанні місцевого ринку."
                : "житлова компанія Progress is a team of experienced real estate specialists in Ivano-Frankivsk. We help our clients find the perfect home, sell their property profitably, or make the right investments in the region's real estate. Our approach is based on transparency, honesty, and deep knowledge of the local market."}
            </p>
          </div>
        </div>

        <WhyUsSection />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
