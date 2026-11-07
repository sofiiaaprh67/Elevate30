import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope, Space_Grotesk } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--ff-display",
  display: "swap",
});

const text = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--ff-text",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--ff-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ELEVATE 30",
    template: "%s · ELEVATE 30",
  },
  description:
    "Ambición sin quemarte. Deja de empezar de cero cada lunes: 30 días para construir tu sistema.",
  applicationName: "ELEVATE 30",
  appleWebApp: {
    capable: true,
    title: "ELEVATE 30",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
  },
};

export const viewport: Viewport = {
  themeColor: "#03060C",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-ES"
      className={`${display.variable} ${text.variable} ${mono.variable}`}
    >
      <body>
        <a className="skip" href="#contenido">
          Saltar al contenido
        </a>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
