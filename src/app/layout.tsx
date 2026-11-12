import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CommandPaletteProvider } from "@/components/command-palette";
import { profile } from "@/data/profile";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const title = `${profile.name} · ${profile.role}`;
const description =
  "Desarrollador Full Stack en El Salvador con enfoque en PHP/Laravel, Livewire, JavaScript y MySQL. Experiencia en sistemas internos e integración de pasarelas de pago.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  authors: [{ name: profile.fullName, url: profile.contact.github }],
  keywords: ["Fidel Contreras", "Desarrollador Full Stack", "Laravel", "PHP", "MySQL", "JavaScript", "El Salvador"],
  openGraph: {
    type: "profile",
    locale: "es_SV",
    title,
    description,
    siteName: profile.name,
  },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#14171f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>
        <CommandPaletteProvider>{children}</CommandPaletteProvider>
      </body>
    </html>
  );
}
