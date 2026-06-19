import type { Metadata } from "next";
import { techniques } from "@/data/techniques";

export const metadata: Metadata = {
  title: "60-Second Porn Recovery Techniques – Neuroscience-Backed Interventions",
  description: "Evidence-based techniques to stop porn urges in 60 seconds. Box breathing, grounding exercises, cognitive reframing, and more. Each technique is backed by neuroscience and designed for immediate urge relief.",
  openGraph: {
    title: "60-Second Porn Recovery Techniques – Neuroscience-Backed Interventions",
    description: "Evidence-based techniques to stop porn urges in 60 seconds.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: techniques.slice(0, 5).map((t) => ({
    "@type": "Question",
    name: t.name + ": " + t.subtitle,
    acceptedAnswer: {
      "@type": "Answer",
      text: t.science + " Best for: " + t.bestFor.join(", ") + ". Steps: " + t.steps.join(" "),
    },
  })),
};

export default function TechniquesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
