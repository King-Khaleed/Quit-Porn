"use client";

import Nav from "@/components/Nav";
import { useAuth } from "@/hooks/useAuth";
import { IconStreak, IconCheck } from "@/components/icons";

const PLANS = [
  { id: "monthly", label: "Monthly", price: 3.99, period: "/month", desc: "$3.99/mo — cancel anytime" },
  { id: "yearly", label: "Yearly", price: 19.99, period: "/year", desc: "$19.99/yr — save 58%", save: "Save $27.89/yr vs monthly" },
  { id: "onetime", label: "One-time", price: 39.99, period: " forever", desc: "Pay once, own forever" },
];

const features = [
  "AI-Guided Relapse Autopsy with personalized analysis",
  "Trigger Pattern Detection with confidence scoring",
  "Personalized Micro-Moment recommendations",
  "Advanced analytics and progress tracking",
  "Priority support and feature requests",
  "Accountability partner matching (coming soon)",
];

export default function PremiumPage() {
  const { session } = useAuth();

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary px-6">
        <p className="text-sm text-text-tertiary">Please sign in to view premium.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-8 pb-24">
        <div className="animate-fade-in text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
            <IconStreak size={28} className="text-accent" />
          </div>
          <h1 className="text-xl font-heading font-bold text-text-primary">
            Premium — Coming Soon
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            We&apos;re finalising pricing and features. Here&apos;s what we&apos;re planning.
          </p>
        </div>

        <div className="mt-6 space-y-2">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between bg-bg-surface border border-border-primary rounded-xl px-4 py-3 opacity-70"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{plan.label}</p>
                <p className="text-xs text-text-tertiary">{plan.desc}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-text-secondary">${plan.price}</span>
                <span className="text-xs text-text-tertiary ml-0.5">{plan.period}</span>
                {plan.save && (
                  <p className="text-[10px] text-accent mt-0.5">{plan.save}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <IconCheck size={14} className="text-accent shrink-0" />
              <span className="text-sm text-text-secondary">{f}</span>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="w-full py-3 rounded-xl font-medium text-sm bg-bg-elevated text-text-tertiary text-center border border-border-primary">
            Coming soon — no payment setup yet
          </div>
          <p className="text-xs text-text-tertiary text-center mt-2">
            The free tier includes streak counter, encrypted journal, and AI techniques — no time limits, no tracking.
          </p>
        </div>
      </div>

      <Nav />
    </>
  );
}
