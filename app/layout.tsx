import type { Metadata, Viewport } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { InstallBanner } from "@/components/InstallBanner";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LeonFrutta · Richiesta d'ordine",
  description: "Invia a LeonFrutta la tua richiesta d'ordine di frutta e verdura.",
  applicationName: "LeonFrutta",
  appleWebApp: {
    capable: true,
    title: "LeonFrutta",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  // Favicon e icona iOS arrivano da app/icon.png e app/apple-icon.png.
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8fafc",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={`${dmSans.variable} ${jakarta.variable} antialiased`}>
      <body className="min-h-dvh">
        {children}
        <BottomNav />
        <InstallBanner />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
