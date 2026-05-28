import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ChatWidget from "@/components/ChatWidget";
import SessionProvider from "@/components/admin/SessionProvider";

const locales = ["uk", "en"];

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) notFound();
  setRequestLocale(locale);
  const [messages, session] = await Promise.all([getMessages(), getServerSession(authOptions)]);

  return (
    <SessionProvider session={session}>
      <NextIntlClientProvider messages={messages}>
        {children}
        <ChatWidget />
      </NextIntlClientProvider>
    </SessionProvider>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
