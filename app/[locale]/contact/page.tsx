import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContactForm from "@/components/property/ContactForm";
import { Phone, Mail, MapPin, Instagram } from "lucide-react";
import { COMPANY } from "@/lib/constants";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default function ContactPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const isUk = locale === "uk";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">
            {isUk ? "Зв'яжіться з нами" : "Contact Us"}
          </h1>
          <p className="text-gray-500 mb-8">
            {isUk
              ? "Готові допомогти з вибором нерухомості"
              : "Ready to help you find the right property"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-navy-900 mb-4">
                {isUk ? "Контактна інформація" : "Contact Information"}
              </h2>
              <div className="space-y-3">
                <a
                  href={`tel:${COMPANY.phone}`}
                  className="flex items-center gap-3 text-gray-700 hover:text-navy-900 text-sm"
                >
                  <Phone className="w-5 h-5 text-gold-400" />
                  {COMPANY.phone}
                </a>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="flex items-center gap-3 text-gray-700 hover:text-navy-900 text-sm"
                >
                  <Mail className="w-5 h-5 text-gold-400" />
                  {COMPANY.email}
                </a>
                <div className="flex items-center gap-3 text-gray-700 text-sm">
                  <MapPin className="w-5 h-5 text-gold-400" />
                  {COMPANY.address}
                </div>
                {COMPANY.instagram && (
                  <a
                    href={COMPANY.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-navy-900 text-sm"
                  >
                    <Instagram className="w-5 h-5 text-gold-400" />
                    @progress.estate.if
                  </a>
                )}
              </div>
            </div>

            <ContactForm propertyId="" propertyTitle="" locale={locale} />
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
