"use client";

import { useState, useEffect } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

const BANNER_SEEN_KEY = "qp_install_banner_seen";
const VISIT_COUNT_KEY = "qp_visit_count";

function getVisitCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10);
    const next = count + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

function wasBannerSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const seen = localStorage.getItem(BANNER_SEEN_KEY);
    if (!seen) return false;
    const timestamp = parseInt(seen, 10);
    if (isNaN(timestamp)) return false;
    return Date.now() - timestamp < 86400000 * 30;
  } catch {
    return false;
  }
}

function markBannerSeen() {
  if (typeof window === "undefined") return;
  localStorage.setItem(BANNER_SEEN_KEY, Date.now().toString());
}

export default function InstallBanner() {
  const { canInstall, isInstalled, isIOS, prompt, dismiss } = useInstallPrompt();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstalled) return;
    const visits = getVisitCount();
    if (visits < 2 || wasBannerSeen()) return;
    if (!canInstall && !isIOS) return;

    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [canInstall, isInstalled, isIOS]);

  const handleInstall = async () => {
    if (canInstall) {
      const accepted = await prompt();
      if (accepted) {
        setVisible(false);
        markBannerSeen();
      }
    } else {
      window.location.href = "/install";
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    markBannerSeen();
    dismiss();
  };

  if (!visible || isInstalled) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-5 animate-slide-up">
      <div className="max-w-lg mx-auto bg-bg-surface border border-border-primary rounded-xl p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">Install QuitPorn</p>
            <p className="text-xs text-text-tertiary mt-0.5">
              {canInstall
                ? "Add to your home screen for offline access & push notifications."
                : "Install from Safari for the full experience."}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-black hover:bg-accent-hover transition-all"
            >
              {canInstall ? "Install" : "Learn How"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
