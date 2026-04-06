import Image from "next/image";
import { Phone } from "lucide-react";

const TEAM = [
  { name: "ГРИНЕВИЧ ВЛАДИСЛАВ", photo: "/team/hrynevych-vladyslav.jpg", phone: "+380 93 456 12 34" },
  { name: "МЕЛЬНИК НАТАЛІЯ",    photo: "/team/melnyk-nataliia.jpg",      phone: "+380 67 234 56 78" },
  { name: "БОДНАРУК МАРІЯ",     photo: "/team/bodnaruk-mariia.jpg",       phone: "+380 67 891 23 45" },
  { name: "КУРИЛЯК МАКСИМ",     photo: "/team/kuryliak-maksym.jpg",       phone: "+380 93 567 89 01" },
  { name: "ПЕТЛЯК ГАЛИНА",      photo: "/team/petliak-halyna.jpg",        phone: "+380 50 789 23 45" },
  { name: "ГЕНСІЦЬКА ХРИСТИНА", photo: "/team/hensitska-khrystyna.jpg",   phone: "+380 96 345 67 89" },
  { name: "КНЯЗЮК АДРІАН",      photo: "/team/kniazuk-adrian.jpg",        phone: "+380 50 234 78 90" },
  { name: "КРІСЛАТИЙ ВАСИЛЬ",   photo: "/team/krislatyi-vasyl.jpg",       phone: "+380 96 678 12 34" },
  { name: "БОДНАРУК ХРИСТИНА",  photo: "/team/bodnaruk-khrystyna.jpg",    phone: "+380 67 901 34 56" },
  { name: "ГУДЧАК КАРИНА",      photo: "/team/hudchak-karyna.jpg",        phone: "+380 50 456 78 12" },
];

interface TeamSectionProps {
  locale: string;
}

export default function TeamSection({ locale }: TeamSectionProps) {
  const isUk = locale === "uk";

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-navy-900 mb-10">
          {isUk ? "Наша команда" : "Our Team"}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {TEAM.map((member) => (
            <div key={member.name} className="group flex flex-col">
              {/* Photo */}
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden mb-3 bg-gray-100">
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              </div>
              {/* Info */}
              <p className="font-bold text-navy-900 text-sm leading-tight mb-1">{member.name}</p>
              <a
                href={`tel:${member.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gold-500 transition-colors"
              >
                <Phone className="w-3 h-3 flex-shrink-0" />
                {member.phone}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
