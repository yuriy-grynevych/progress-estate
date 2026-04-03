"use client";
import { Shield, MapPin, Users } from "lucide-react";
import { useLocale } from "next-intl";

const items = [
  {
    icon: Users,
    titleUk: "Професійна команда",
    titleEn: "Professional Team",
    descUk: "Досвідчені агенти з глибоким знанням ринку нерухомості регіону",
    descEn: "Experienced agents with deep knowledge of the regional real estate market",
  },
  {
    icon: Shield,
    titleUk: "Прозорі угоди",
    titleEn: "Transparent Deals",
    descUk: "Повний супровід угоди без прихованих комісій та сюрпризів",
    descEn: "Full transaction support with no hidden fees or surprises",
  },
  {
    icon: MapPin,
    titleUk: "Місцева експертиза",
    titleEn: "Local Expertise",
    descUk: "Знаємо кожен район Івано-Франківська — допоможемо зробити правильний вибір",
    descEn: "We know every district of Ivano-Frankivsk — helping you make the right choice",
  },
];

export default function WhyUsSection() {
  const locale = useLocale();
  const isUk = locale === "uk";

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-navy-900 text-center mb-12">
          {isUk ? "Чому Progress Estate?" : "Why Progress Estate?"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map(({ icon: Icon, titleUk, titleEn, descUk, descEn }) => (
            <div
              key={titleUk}
              className="text-center p-8 rounded-2xl border border-gray-100 hover:border-gold-400 hover:shadow-lg transition-all"
            >
              <div className="w-14 h-14 bg-navy-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-7 h-7 text-gold-400" />
              </div>
              <h3 className="text-lg font-semibold text-navy-900 mb-2">
                {isUk ? titleUk : titleEn}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {isUk ? descUk : descEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
