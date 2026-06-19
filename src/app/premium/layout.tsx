import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium Porn Recovery – Coming Soon",
  description: "Premium features for QuitPorn including AI-guided relapse autopsy, trigger pattern detection, and personalized analytics. Free tier available with no time limits.",
  robots: { index: false, follow: false },
};

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
