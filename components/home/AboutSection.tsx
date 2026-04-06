import Image from "next/image";

interface AboutSectionProps {
  locale: string;
}

export default function AboutSection({ locale }: AboutSectionProps) {
  const isUk = locale === "uk";

  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-navy-900 mb-10">
          {isUk ? "Про нас" : "About Us"}
        </h2>

        {/* Large team photo */}
        <div className="relative w-full aspect-[16/7] rounded-3xl overflow-hidden mb-10 shadow-xl">
          <Image
            src="/team.jpg"
            alt={isUk ? "Команда Progress" : "Progress Team"}
            fill
            className="object-cover object-top"
            sizes="100vw"
            priority
          />
        </div>

        {/* Description in card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10">
          <p className="text-xl sm:text-2xl text-gray-800 leading-relaxed font-medium mb-6">
            {isUk
              ? "Житлова компанія Progress — це команда досвідчених фахівців у сфері нерухомості Івано-Франківська та регіону. Ми супроводжуємо клієнтів на кожному етапі: від пошуку житла до підписання договору."
              : "Progress Housing Company is a team of experienced real estate professionals in Ivano-Frankivsk and the region. We guide clients at every step — from property search to contract signing."}
          </p>
          <p className="text-base sm:text-lg text-gray-500 leading-relaxed">
            {isUk
              ? "Наша мета — зробити купівлю та оренду нерухомості максимально комфортним і прозорим процесом. Ми пишаємося довірою сотень родин, яким допомогли знайти своє ідеальне житло."
              : "Our goal is to make buying and renting real estate as comfortable and transparent as possible. We are proud of the trust of hundreds of families we have helped find their perfect home."}
          </p>
        </div>
      </div>
    </section>
  );
}
