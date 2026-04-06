"use client";
import { useLocale } from "next-intl";

const stats = [
  { value: "150+", labelUk: "Проданих об'єктів", labelEn: "Properties Sold" },
  { value: "300+", labelUk: "Задоволених клієнтів", labelEn: "Happy Clients" },
  { value: "200+", labelUk: "Активних оголошень", labelEn: "Active Listings" },
  { value: "24/7", labelUk: "Підтримка клієнтів", labelEn: "Client Support" },
];

export default function StatsSection() {
  const locale = useLocale();
  const isUk = locale === "uk";

  return (
    <section className="bg-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(({ value, labelUk, labelEn }) => (
            <div key={labelUk}>
              <div className="text-3xl font-bold text-gold-400 mb-1">{value}</div>
              <div className="text-white/70 text-sm">{isUk ? labelUk : labelEn}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
