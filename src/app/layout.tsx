import type { Metadata, Viewport } from "next";
import { Sora, Outfit } from "next/font/google";
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
  title: "QuitPorn – Reclaim Your Life",
  description:
    "A shame-free, neuroscience-based recovery tool. No email, no tracking, no judgment. Private, anonymous, and built for real change.",
  manifest: "/manifest.json",
  robots: "noindex, nofollow",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QuitPorn",
  },
  other: {
    "mobile-web-app-capable": "yes",
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
        <main className="flex-1 flex flex-col">{children}</main>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
