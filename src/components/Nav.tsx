"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconJournal, IconAutopsy, IconTechniques, IconInsights, IconSettings } from "./icons";
import { tapFeedback } from "@/lib/feedback";

const links = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/journal", label: "Journal", icon: IconJournal },
  { href: "/autopsy", label: "Autopsy", icon: IconAutopsy },
  { href: "/techniques", label: "Techniques", icon: IconTechniques },
  { href: "/insights", label: "Insights", icon: IconInsights },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mb-3 max-w-lg mx-auto px-3">
        <div className="flex items-center justify-around px-1 py-1.5 rounded-2xl bg-bg-surface/75 backdrop-blur-xl border border-border-primary/80 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => tapFeedback()}
                className={`relative flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all duration-200 active:scale-90 ${
                  active
                    ? "text-accent"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-xl bg-accent/10 border border-accent/20" />
                )}
                <Icon size={20} className="relative z-10" />
                <span className={`relative z-10 text-[10px] font-medium tracking-wide ${
                  active ? "opacity-100" : "opacity-60"
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
