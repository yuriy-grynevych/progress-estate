import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "житлова компанія Progress | Нерухомість в Івано-Франківську",
  description: "Купівля, продаж та оренда нерухомості в Івано-Франківську та регіоні",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
