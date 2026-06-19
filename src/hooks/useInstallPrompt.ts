"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface InstallPromptState {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  prompt: () => Promise<boolean>;
  dismiss: () => void;
}

export function useInstallPrompt(): InstallPromptState {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPrompt = useRef<any>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mediaQuery.matches || (window.navigator as any).standalone === true);

    const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mediaQuery.addEventListener("change", handler);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
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
