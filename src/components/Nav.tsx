"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconJournal, IconAutopsy, IconInsights, IconSettings } from "./icons";
import { tapFeedback } from "@/lib/feedback";

const links = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/journal", label: "Journal", icon: IconJournal },
  { href: "/autopsy", label: "Autopsy", icon: IconAutopsy },
  { href: "/insights", label: "Insights", icon: IconInsights },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mb-2 max-w-lg mx-auto px-3">
        <div className="flex items-center justify-between px-1.5 py-1 rounded-2xl bg-bg-surface/85 backdrop-blur-2xl border border-border-primary/50 shadow-[0_-4px_24px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.02)_inset]">
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => tapFeedback()}
                className="relative flex flex-col items-center gap-0.5 py-1.5 flex-1 min-w-0 active:scale-90 transition-transform duration-150"
              >
                {active && (
                  <span className="absolute inset-1 rounded-xl bg-gradient-to-b from-accent/12 to-accent/5 border border-accent/15 shadow-[0_0_16px_rgba(45,212,191,0.06)]" />
                )}
                <span className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  active
                    ? "bg-gradient-to-b from-accent to-emerald-500 shadow-[0_4px_12px_rgba(45,212,191,0.35)] scale-105"
                    : ""
                }`}>
                  <Icon size={16} className={`transition-all duration-300 ${
                    active ? "text-black drop-shadow-sm" : "text-text-tertiary/70 group-hover:text-text-secondary"
                  }`} />
                </span>
                <span className={`relative z-10 text-[8px] font-semibold tracking-widest uppercase transition-all duration-300 ${
                  active ? "text-accent" : "text-text-tertiary/50"
                }`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
