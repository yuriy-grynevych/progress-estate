import Image from "next/image";
import { Phone, Instagram } from "lucide-react";
import { prisma } from "@/lib/prisma";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

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
    where: { role: { in: ["EMPLOYEE", "ADMIN"] } },
    select: { name: true, email: true, phone: true, photoUrl: true, instagram: true, tiktok: true, facebook: true },
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
              member.photoUrl ??
              PHOTO_MAP[member.email] ??
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
                    className="object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    unoptimized={photo.startsWith("/uploads/")}
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
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {member.instagram && (
                    <a
                      href={`https://instagram.com/${member.instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-pink-500 transition-colors"
                      title="Instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {member.tiktok && (
                    <a
                      href={`https://tiktok.com/@${member.tiktok.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-black transition-colors"
                      title="TikTok"
                    >
                      <TikTokIcon className="w-4 h-4" />
                    </a>
                  )}
                  {member.facebook && (
                    <a
                      href={member.facebook.startsWith("http") ? member.facebook : `https://facebook.com/${member.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Facebook"
                    >
                      <FacebookIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
