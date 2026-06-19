import type { Metadata, Viewport } from "next";
import { Sora, Outfit } from "next/font/google";
import ServiceWorkerInit from "@/components/ServiceWorkerInit";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "QuitPorn – Reclaim Your Life", template: "%s | QuitPorn" },
  description:
    "A shame-free, neuroscience-based porn recovery tool. Anonymous, private, encrypted. Techniques, streak tracking, AI coach, and relapse support — built for real change.",
  manifest: "/manifest.json",
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QuitPorn",
  },
  openGraph: {
    title: "QuitPorn – Reclaim Your Life",
    description:
      "A shame-free, neuroscience-based porn recovery tool. Anonymous, private, encrypted.",
    type: "website",
    siteName: "QuitPorn",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuitPorn – Reclaim Your Life",
    description:
      "A shame-free, neuroscience-based porn recovery tool. Anonymous, private, encrypted.",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "google-site-verification": "zvIJiEYmfKERekflP9xpnVxCRJdhI2vjwYbaYGWqK3s",
  },
};

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#07070d",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${outfit.variable} h-full`}
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
      </head>
      <body className="min-h-dvh flex flex-col">
        <ToastProvider>
          <main className="flex-1 flex flex-col">{children}</main>
          <ServiceWorkerInit />
        </ToastProvider>
      </body>
    </html>
  );
}
