"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPromptState {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  prompt: () => Promise<boolean>;
  dismiss: () => void;
}

export function useInstallPrompt(): InstallPromptState {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    return mediaQuery.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  });
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mediaQuery.addEventListener("change", handler);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    return () => {
      mediaQuery.removeEventListener("change", handler);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  const prompt = useCallback(async () => {
    if (!deferredPrompt.current) return false;
    deferredPrompt.current.prompt();
    const result = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setCanInstall(false);
    const accepted = result.outcome === "accepted";
    if (accepted) setIsInstalled(true);
    return accepted;
  }, []);

  const dismiss = useCallback(() => {
    deferredPrompt.current = null;
    setCanInstall(false);
  }, []);

  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  return { canInstall, isInstalled, isIOS, prompt, dismiss };
}
