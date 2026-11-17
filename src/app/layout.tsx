import type { Metadata, Viewport } from "next";
import { Alexandria } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/layout/service-worker-register";
import { BottomNav } from "@/components/layout/bottom-nav";
import "./globals.css";

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
  display: "swap",
});

export const metadata: Metadata = {
  title: "عائلة الحاج متولي - دردشة ومحادثات الأصدقاء",
  description: "مكانك للدردشة وتكوين الصداقات ومحادثة الأصدقاء",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "عائلة الحاج متولي",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={alexandria.variable} data-theme="dark">
      <body className={`${alexandria.className} flex min-h-screen flex-col antialiased bg-black text-white selection:bg-[#0A84FF]/35 selection:text-white`}>
        {children}
        <BottomNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
