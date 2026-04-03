import { Star, Quote } from "lucide-react";
import { prisma } from "@/lib/prisma";

async function getTestimonials() {
  return prisma.testimonial.findMany({
    where: { isPublished: true },
    orderBy: { order: "asc" },
    take: 6,
  });
}

export default async function TestimonialsSection({ locale }: { locale: string }) {
  const testimonials = await getTestimonials();
  if (testimonials.length === 0) return null;
  const isUk = locale === "uk";

  return (
    <section className="py-20 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">
            {isUk ? "Відгуки" : "Testimonials"}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            {isUk ? "Що кажуть наші клієнти" : "What our clients say"}
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < t.rating ? "fill-gold-400 text-gold-400" : "fill-white/10 text-white/10"}`}
                  />
                ))}
              </div>

              {/* Quote */}
              <Quote className="w-6 h-6 text-gold-400/40 mb-2" />
              <p className="text-white/80 text-sm leading-relaxed mb-5">
                {isUk ? t.contentUk : t.contentEn}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="w-9 h-9 rounded-full bg-gold-400/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold-400 font-bold text-sm">
                    {t.authorName[0]}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{t.authorName}</p>
                  {t.authorRole && (
                    <p className="text-white/50 text-xs">{t.authorRole}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
