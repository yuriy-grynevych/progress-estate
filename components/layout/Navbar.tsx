"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useState, useEffect, useRef } from "react";
import { Menu, X, PhoneCall } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/constants";

type CompanyData = { phone: string; email: string; address: string; instagram: string; facebook: string };

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export default function Navbar() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [company, setCompany] = useState<CompanyData>({
    phone: company.phone, email: COMPANY.email, address: COMPANY.address,
    instagram: company.instagram, facebook: COMPANY.facebook ?? "",
  });
  const isUk = locale === "uk";

  useEffect(() => {
    fetch("/api/company-settings").then(r => r.json()).then(setCompany).catch(() => {});
  }, []);

  // Transparent navbar only on home page
  const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/`;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
      // On home page: show logo after scrolling ~280px (past the hero logo)
      // On other pages: always show logo
      setLogoVisible(!isHomePage || window.scrollY > 280);
    };
    onScroll(); // run immediately on mount
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHomePage]);


  const navLinks = [
    { href: `/${locale}/listings?listingType=SALE`, label: isUk ? "Купити" : "Buy" },
    { href: `/${locale}/listings?listingType=RENT`, label: isUk ? "Орендувати" : "Rent" },
    { href: `/${locale}#about`, label: isUk ? "Про нас" : "About" },
    { href: `/${locale}/contact`, label: isUk ? "Контакти" : "Contact" },
  ];

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 text-white transition-all duration-300",
      (!isHomePage || scrolled) ? "bg-black shadow-lg" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">

          {/* Left: nav links */}
          <div className="hidden md:flex items-center gap-6 flex-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={cn("text-sm font-medium transition-colors hover:text-gold-400",
                  pathname.startsWith(link.href.split("?")[0].split("#")[0]) && !link.href.includes("#about") ? "text-gold-400" : "text-white/90")}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Center: logo (appears after scrolling past hero logo) */}
          <div className="flex-1 flex justify-center md:flex-none md:absolute md:left-1/2 md:-translate-x-1/2">
            <Link href={`/${locale}`} className={cn(
              "transition-all duration-300",
              logoVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
            )}>
              <Image
                src="/logo-progress.png"
                alt="Житлова компанія Progress"
                width={180}
                height={55}
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Right: Instagram + lang + phone */}
          <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
            <a href={company.instagram} target="_blank" rel="noopener noreferrer"
              className="text-white/70 hover:text-gold-400 transition-colors" title="Instagram">
              <InstagramIcon />
            </a>
            <div className="flex rounded-md overflow-hidden border border-white/20">
              {["uk", "en"].map((loc) => (
                <button key={loc} onClick={() => switchLocale(loc)}
                  className={cn("px-3 py-1 text-xs font-medium transition-colors",
                    locale === loc ? "bg-gold-400 text-black" : "text-white/80 hover:text-white")}>
                  {loc.toUpperCase()}
                </button>
              ))}
            </div>
            <a href={`tel:${company.phone}`}
              className="flex items-center gap-1.5 text-sm text-gold-400 hover:text-gold-300">
              <PhoneCall className="w-4 h-4" />
              {company.phone}
            </a>
          </div>

          <button className="md:hidden ml-auto" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-black border-t border-white/10 px-4 py-4 space-y-3">
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
                  locale === loc ? "bg-gold-400 text-black font-bold" : "text-white/70")}>
                {loc.toUpperCase()}
              </button>
            ))}
            <a href={company.instagram} target="_blank" rel="noopener noreferrer"
              className="text-white/70 hover:text-gold-400 ml-2">
              <InstagramIcon />
            </a>
            <a href={`tel:${company.phone}`} className="text-gold-400 text-sm ml-auto">
              {company.phone}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
