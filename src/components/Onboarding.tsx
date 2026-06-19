"use client";

import { useState } from "react";
import { IconLogo } from "@/components/icons";

interface Props {
  onComplete: () => void;
}

const PRICING_OPTIONS = [
  { id: "weekly", label: "Weekly", price: "$1.99/week", sub: "Flexible, cancel anytime" },
  { id: "monthly", label: "Monthly", price: "$3.99/month", sub: "Save 50% vs weekly" },
  { id: "yearly", label: "Yearly", price: "$19.99/year", sub: "Save 58% vs monthly — best value" },
  { id: "onetime", label: "One-time", price: "$39.99 forever", sub: "Lifetime access, never pay again" },
  { id: "free", label: "Free always", price: "$0", sub: "No commitment, ever" },
];

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);

  const handleComplete = () => {
    localStorage.setItem("qp_onboarding_done", "1");
    if (selectedPrice) {
      localStorage.setItem("qp_pricing_preference", selectedPrice);
      try {
        const { getSupabase } = require("@/lib/supabase");
        const supabase = getSupabase();
        supabase.from("onboarding_feedback").insert({
          pricing_preference: selectedPrice,
          created_at: new Date().toISOString(),
        }).then().catch(() => {});
      } catch {}
    }
    onComplete();
  };

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col animate-fade-in">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-12 pb-4">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              s <= step ? "bg-accent w-8" : "bg-bg-elevated w-1.5"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full px-6">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
              <IconLogo size={36} className="text-accent" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-text-primary">
              QuitPorn
            </h1>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed max-w-xs">
              Your private recovery companion. No tracking, no shame — just neuroscience.
            </p>
            <div className="mt-8 space-y-3 w-full max-w-xs">
              {[
                "Zero tracking — no email, no data collection",
                "Zero shame — all progress is private",
                "Neuroscience-backed — techniques that work",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-bg-surface border border-border-primary rounded-xl px-4 py-3 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm text-text-secondary">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto pb-10 w-full">
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Feature Overview */}
        {step === 2 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
            <h2 className="text-xl font-heading font-bold text-text-primary mb-8">
              What You'll Get
            </h2>
            <div className="w-full space-y-3 mb-auto">
              {[
                { title: "Streak Tracking", desc: "Never resets without your choice" },
                { title: "Encrypted Journal", desc: "Only you can read it — AES-256" },
                { title: "Trigger Predictions", desc: "Learn your patterns over time" },
                { title: "60-Second Techniques", desc: "Box breathing, cold water, and more" },
                { title: "AI Recovery Coach", desc: "5 free messages per day" },
              ].map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-left animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <span className="text-accent text-sm font-bold mt-0.5">✓</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{f.title}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pb-10 w-full mt-6 flex gap-3">
              <button
                onClick={handleComplete}
                className="flex-1 py-3 rounded-xl text-sm bg-bg-surface text-text-secondary hover:bg-bg-surface-hover border border-border-primary transition-all"
              >
                Skip
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Pricing Survey */}
        {step === 3 && (
          <div className="flex-1 flex flex-col items-center text-center animate-fade-in">
            <h2 className="text-xl font-heading font-bold text-text-primary mt-8">
              The Real Talk
            </h2>
            <p className="text-sm text-text-secondary mt-2 max-w-xs leading-relaxed">
              This app is 100% free right now. We're exploring premium features soon. If we did charge, what would you prefer?
            </p>
            <div className="w-full mt-6 space-y-2">
              {PRICING_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedPrice(opt.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                    selectedPrice === opt.id
                      ? "bg-accent/10 border-2 border-accent"
                      : "bg-bg-surface border border-border-primary hover:bg-bg-surface-hover"
                  }`}
                >
                  <div>
                    <p className={`text-sm font-medium ${selectedPrice === opt.id ? "text-accent" : "text-text-primary"}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-text-tertiary">{opt.sub}</p>
                  </div>
                  <span className={`text-sm font-bold ${selectedPrice === opt.id ? "text-accent" : "text-text-secondary"}`}>
                    {opt.price}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-text-tertiary mt-4">
              Your answer helps us decide — no commitment
            </p>
            <div className="mt-auto pb-10 w-full pt-8">
              <button
                onClick={handleComplete}
                disabled={!selectedPrice}
                className="w-full py-3 rounded-xl text-sm font-medium bg-accent text-black hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {selectedPrice ? "Ready to Start" : "Select an option to continue"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
