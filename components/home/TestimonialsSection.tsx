import { Star, Quote } from "lucide-react";

const GOOGLE_REVIEWS = [
  {
    id: "1",
    author: "Марія Дземан",
    rating: 5,
    date: "2 місяці тому",
    text: "Задоволена послугами Житлової компанії Progress, а саме рієлтором Христиною Генсіцькою, допомогла вигідно і швидко продати житло, а також і вигідно купити 👍",
  },
  {
    id: "2",
    author: "Вікторія Кирста",
    rating: 5,
    date: "місяць тому",
    text: "Дуже вдячна за допомогу в покупці квартири! Все було на вищому рівні, дуже задоволена роботою, а ще вдячна Марії. Якщо знову буду звертатися, то саме в цю агенцію, всім рекомендую!",
  },
  {
    id: "3",
    author: "Вікторія Вишиванюк",
    rating: 5,
    date: "місяць тому",
    text: "Щиро дякуємо Христині Боднарчук за якісний супровід у здійсненні купівлі! Комунікація була дуже легкою та приємною! Рекомендую на 100%!",
  },
  {
    id: "4",
    author: "Васька Михайлишин",
    rating: 5,
    date: "2 місяці тому",
    text: "Дуже задоволені співпрацею з агенством, особлива подяка Василю, професіонал своєї справи, великий досвід роботи. Рекомендую Progress!",
  },
  {
    id: "5",
    author: "Вікторія Новіцька",
    rating: 5,
    date: "місяць тому",
    text: "Чудова агенція! Все чітко, швидко та прозоро. Дякую команді Progress за професійний підхід та допомогу у виборі житла. Рекомендую всім!",
  },
  {
    id: "6",
    author: "Андрій Савчук",
    rating: 5,
    date: "3 місяці тому",
    text: "Звернувся до компанії Progress з питанням купівлі квартири. Все пройшло чудово, агент був на зв'язку на кожному етапі угоди. Дякую за якісний сервіс!",
  },
];

const GOOGLE_URL =
  "https://www.google.com/search?q=%D0%96%D0%B8%D1%82%D0%BB%D0%BE%D0%B2%D0%B0+%D0%BA%D0%BE%D0%BC%D0%BF%D0%B0%D0%BD%D1%96%D1%8F+PROGRESS+%D1%96%D0%B2%D0%B0%D0%BD%D0%BE-%D1%84%D1%80%D0%B0%D0%BD%D0%BA%D1%96%D0%B2%D1%81%D1%8C%D0%BA+%D0%B2%D1%96%D0%B4%D0%B3%D1%83%D0%BA%D0%B8#lrd=0x473486e94f73a24b:0x1,1";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function TestimonialsSection({ locale }: { locale: string }) {
  const isUk = locale === "uk";

  return (
    <section className="py-20 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">
            {isUk ? "Відгуки" : "Testimonials"}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {isUk ? "Що кажуть наші клієнти" : "What our clients say"}
          </h2>
          {/* Google rating summary */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <GoogleIcon />
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-white font-bold">5.0</span>
            <span className="text-white/50 text-sm">
              {isUk ? "на Google" : "on Google"}
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GOOGLE_REVIEWS.map((t) => (
            <div
              key={t.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors flex flex-col"
            >
              {/* Google source + stars */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <GoogleIcon />
                  <span>Google</span>
                </div>
              </div>

              {/* Quote */}
              <Quote className="w-5 h-5 text-gold-400/40 mb-2 flex-shrink-0" />
              <p className="text-white/80 text-sm leading-relaxed flex-1 mb-5">
                {t.text}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="w-9 h-9 rounded-full bg-gold-400/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold-400 font-bold text-sm">
                    {t.author[0]}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{t.author}</p>
                  <p className="text-white/40 text-xs">{t.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Google button */}
        <div className="flex justify-center mt-10">
          <a
            href={GOOGLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-white text-gray-800 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors shadow-lg text-sm"
          >
            <GoogleIcon />
            {isUk ? "Переглянути більше відгуків на Google" : "See more reviews on Google"}
          </a>
        </div>
      </div>
    </section>
  );
}
