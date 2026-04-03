"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";
import { Menu, X, PhoneCall } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/constants";

export default function Navbar() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const isUk = locale === "uk";

  const navLinks = [
    { href: `/${locale}/listings?listingType=SALE`, label: isUk ? "Купити" : "Buy" },
    { href: `/${locale}/listings?listingType=RENT`, label: isUk ? "Орендувати" : "Rent" },
    { href: `/${locale}/about`, label: isUk ? "Про нас" : "About" },
    { href: `/${locale}/contact`, label: isUk ? "Контакти" : "Contact" },
  ];

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <nav className="sticky top-0 z-50 bg-navy-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={`/${locale}`} className="flex items-center">
            <Image
              src="/logo.png"
              alt="Progress Estate"
              width={240}
              height={90}
              className="h-16 w-auto"
            />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={cn("text-sm font-medium transition-colors hover:text-gold-400",
                  pathname.startsWith(link.href.split("?")[0]) ? "text-gold-400" : "text-white/80")}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex rounded-md overflow-hidden border border-white/20">
              {["uk", "en"].map((loc) => (
                <button key={loc} onClick={() => switchLocale(loc)}
                  className={cn("px-3 py-1 text-xs font-medium transition-colors",
                    locale === loc ? "bg-gold-400 text-navy-900" : "text-white/80 hover:text-white")}>
                  {loc.toUpperCase()}
                </button>
              ))}
            </div>
            <a href={`tel:${COMPANY.phone}`}
              className="flex items-center gap-1.5 text-sm text-gold-400 hover:text-gold-300">
              <PhoneCall className="w-4 h-4" />
              {COMPANY.phone}
            </a>
          </div>

          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-navy-800 border-t border-white/10 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="block text-white/80 hover:text-gold-400 py-1"
              onClick={() => setIsOpen(false)}>
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-3 pt-2 border-t border-white/10">
            {["uk", "en"].map((loc) => (
              <button key={loc}
                onClick={() => { switchLocale(loc); setIsOpen(false); }}
                className={cn("px-3 py-1 text-xs rounded",
                  locale === loc ? "bg-gold-400 text-navy-900 font-bold" : "text-white/70")}>
                {loc.toUpperCase()}
              </button>
            ))}
            <a href={`tel:${COMPANY.phone}`} className="text-gold-400 text-sm ml-auto">
              {COMPANY.phone}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
