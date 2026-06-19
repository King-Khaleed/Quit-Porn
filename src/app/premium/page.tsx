"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import { useAuth } from "@/hooks/useAuth";
import { IconStreak, IconCheck, IconAlert } from "@/components/icons";

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
  const [selected, setSelected] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/paddle/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selected, userId: session?.user?.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Checkout unavailable");
      }
      window.open(data.checkoutUrl, "_blank");
    } catch (err: any) {
      setError(err.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

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
            Upgrade Your Recovery
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Unlock personalized insights and AI-powered tools.
          </p>
        </div>

        <div className="mt-6 bg-bg-surface border border-border-primary rounded-xl p-1 flex">
          <button
            onClick={() => setSelected("monthly")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selected === "monthly"
                ? "bg-accent text-black"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelected("yearly")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selected === "yearly"
                ? "bg-accent text-black"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Yearly
            <span className="text-[10px] ml-1 opacity-80">Save 33%</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <span className="text-3xl font-heading font-bold text-text-primary">
            ${selected === "monthly" ? "4.99" : "39.99"}
          </span>
          <span className="text-sm text-text-tertiary ml-1">
            /{selected === "monthly" ? "month" : "year"}
          </span>
          {selected === "yearly" && (
            <p className="text-xs text-accent mt-1">Save $19.89/year vs monthly</p>
          )}
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

        {error && (
          <div className="mt-4 flex items-start gap-2 bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
            <IconAlert size={14} className="text-danger shrink-0 mt-0.5" />
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium text-sm bg-accent text-black hover:bg-accent-hover disabled:opacity-40 transition-all"
          >
            {loading ? "Opening checkout..." : `Subscribe — $${selected === "monthly" ? "4.99" : "39.99"}/mo`}
          </button>
          <p className="text-xs text-text-tertiary text-center mt-2">
            Secure payment via Paddle. Cancel anytime.
          </p>
        </div>

        <div className="mt-6 bg-bg-surface border border-border-primary rounded-xl px-4 py-3">
          <p className="text-xs text-text-secondary leading-relaxed text-center">
            The free tier includes the streak counter, encrypted journal, and basic content blocking — no time limits, no tracking.
          </p>
        </div>
      </div>

      <Nav />
    </>
  );
}
