"use client";

import { useEffect, useState } from "react";
import InstallGuide from "@/components/InstallGuide";
import Nav from "@/components/Nav";
import { IconCheck } from "@/components/icons";

export default function InstallPage() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mediaQuery.matches || (window.navigator as any).standalone === true);
    const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (isInstalled) {
    return (
      <>
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-8 pb-24">
          <div className="animate-fade-in text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
              <IconCheck size={32} className="text-accent" />
            </div>
            <h1 className="text-xl font-heading font-bold text-text-primary">
              App Installed
            </h1>
            <p className="text-sm text-text-secondary mt-2">
              QuitPorn is already installed on your device. All features work offline. Your data stays encrypted and private.
            </p>
          </div>
        </div>
        <Nav />
      </>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-8 pb-24">
        <div className="animate-fade-in text-center mb-6">
          <h1 className="text-xl font-heading font-bold text-text-primary">
            Install the App
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Add QuitPorn to your home screen for push notifications and offline access.
          </p>
        </div>
        <InstallGuide />
      </div>

      <Nav />
    </>
  );
}
