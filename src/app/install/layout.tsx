import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Install QuitPorn – PWA Setup Guide for iOS & Android",
  description: "Install QuitPorn as a Progressive Web App on your iPhone, iPad, or Android device. Get push notifications, offline access, and a full-screen app experience.",
  openGraph: {
    title: "Install QuitPorn – PWA Setup Guide for iOS & Android",
    description: "Install QuitPorn as a Progressive Web App on any device.",
  },
};

export default function InstallLayout({ children }: { children: React.ReactNode }) {
  return children;
}
