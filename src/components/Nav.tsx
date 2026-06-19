"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconJournal, IconAutopsy, IconTechniques, IconInsights, IconSettings } from "./icons";

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-lg border-t border-border-primary">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                active
                  ? "text-accent"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              <Icon size={20} />
              <span className={`text-[10px] font-medium tracking-wide ${
                active ? "opacity-100" : "opacity-60"
              }`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
