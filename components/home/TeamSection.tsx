import Image from "next/image";
import { Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";

// Maps email → local photo path (from /public/team/)
const PHOTO_MAP: Record<string, string> = {
  "vladgrenevich7@gmail.com":       "/team/hrynevych-vladyslav.jpg",
  "vassilikrislaty1993@gmail.com":   "/team/krislatyi-vasyl.jpg",
  "dyuymovochka.if@gmail.com":       "/team/hensitska-khrystyna.jpg",
  "getback1974@gmail.com":           "/team/kniazuk-adrian.jpg",
  "karynahudchakk@gmail.com":        "/team/hudchak-karyna.jpg",
  "bodnarukmaria28@gmail.com":       "/team/bodnaruk-mariia.jpg",
  "galyakarach2@gmail.com":          "/team/petliak-halyna.jpg",
  "nataliapidhirniak@gmail.com":     "/team/melnyk-nataliia.jpg",
  "krystyna.bodnarchuk@gmail.com":   "/team/bodnaruk-khrystyna.jpg",
  "maxik20000@gmail.com":            "/team/kuryliak-maksym.jpg",
};

function formatPhone(raw: string): string {
  // +380XXXXXXXXX → +380 XX XXX XX XX
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("380")) {
    return `+380 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }
  return raw;
}

interface TeamSectionProps {
  locale: string;
}

export default async function TeamSection({ locale }: TeamSectionProps) {
  const isUk = locale === "uk";

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { name: true, email: true, phone: true, photoUrl: true },
    orderBy: { name: "asc" },
  });

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-navy-900 mb-10">
          {isUk ? "Наша команда" : "Our Team"}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {employees.map((member) => {
            const photo =
              PHOTO_MAP[member.email] ??
              member.photoUrl ??
              "/team/hrynevych-vladyslav.jpg";
            const phone = member.phone ? formatPhone(member.phone) : null;

            return (
              <div key={member.email} className="group flex flex-col">
                {/* Photo */}
                <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden mb-3 bg-gray-100">
                  <Image
                    src={photo}
                    alt={member.name ?? ""}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                </div>
                {/* Info */}
                <p className="font-bold text-navy-900 text-sm leading-tight mb-1 uppercase">
                  {member.name}
                </p>
                {phone && (
                  <a
                    href={`tel:${member.phone}`}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gold-500 transition-colors"
                  >
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    {phone}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
