import Link from "next/link";
import { Home, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { getCompanySettings } from "@/lib/company";
import { COMPANY as COMPANY_CONST } from "@/lib/constants";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
  </svg>
);

export default async function Footer({ locale }: { locale: string }) {
  const year = new Date().getFullYear();
  const isUk = locale === "uk";
  const COMPANY = await getCompanySettings();

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-6 h-6 text-gold-400" />
              <span className="text-lg font-bold text-gold-400">
                Житлова компанія Progress
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              {isUk
                ? "Надійний партнер у виборі нерухомості в Івано-Франківську."
                : "Your trusted partner in real estate in Ivano-Frankivsk."}
            </p>
            <div className="flex gap-3 mt-4">
              {COMPANY.instagram && (
                <a href={COMPANY.instagram} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold-400 hover:text-navy-900 flex items-center justify-center transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {COMPANY_CONST.tiktok && (
                <a href={COMPANY_CONST.tiktok} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold-400 hover:text-navy-900 flex items-center justify-center transition-colors">
                  <TikTokIcon />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gold-400 mb-4">
              {isUk ? "Посилання" : "Quick Links"}
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              {[
                { href: `/${locale}/listings?listingType=SALE`, label: isUk ? "Купити" : "Buy" },
                { href: `/${locale}/listings?listingType=RENT`, label: isUk ? "Орендувати" : "Rent" },
                { href: `/${locale}/about`, label: isUk ? "Про нас" : "About" },
                { href: `/${locale}/contact`, label: isUk ? "Контакти" : "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-gold-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gold-400 mb-4">
              {isUk ? "Контакти" : "Contacts"}
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <a href={`tel:${COMPANY.phone}`} className="hover:text-gold-400">
                  {COMPANY.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <a href={`mailto:${COMPANY.email}`} className="hover:text-gold-400">
                  {COMPANY.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                <span>{COMPANY.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-white/40">
          © {year} Житлова компанія Progress.{" "}
          {isUk ? "Всі права захищені." : "All rights reserved."}
        </div>
      </div>
    </footer>
  );
}
