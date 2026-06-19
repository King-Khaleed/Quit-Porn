"use client";

import { useState } from "react";

interface AutopsyResult {
  analysis: string;
  loading: boolean;
  error: string | null;
}

interface Props {
  onComplete: (result: string) => void;
}

export default function AutopsyForm({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [result, setResult] = useState<AutopsyResult>({
    analysis: "",
    loading: false,
    error: null,
  });

  const questions = [
    {
      q: "What happened just before the urge?",
      hint: "Where were you? What time was it? What were you doing?",
    },
    {
      q: "What were you feeling in that moment?",
      hint: "Bored? Lonely? Stressed? Anxious? Tired?",
    },
    {
      q: "What could you try differently next time?",
      hint: "Is there one small thing you could change?",
    },
  ];

  const handleAnswer = (text: string) => {
    const newAnswers = [...answers];
    newAnswers[step] = text;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setResult({ analysis: "", loading: true, error: null });

    const prompt = `You are a compassionate, neuroscience-informed recovery coach. A user answered three questions after a relapse:

1. Context: "${answers[0]}"
2. Feelings: "${answers[1]}"
3. Alternative: "${answers[2]}"

Generate a brief analysis (3-4 sentences) that:
- Identifies the pattern without judgment
- Acknowledges their effort in reflecting
- Offers one concrete, science-backed recommendation
- Ends with an encouraging affirmation

Use warm, non-judgmental language. Never use shame language. Never say "you failed" or "you're weak." Frame relapse as a data point for learning.`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
          "X-Title": "QuitPorn",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error("Analysis failed. Please try again.");

      const data = await response.json();
      const analysis = data.choices?.[0]?.message?.content || "Reflecting on your patterns is a sign of strength. Be kind to yourself today.";
      setResult({ analysis, loading: false, error: null });
      onComplete(analysis);
    } catch (err) {
      setResult({
        analysis: "",
        loading: false,
        error: err instanceof Error ? err.message : "Something went wrong. Your reflection is still valuable.",
      });
    }
  };

  if (result.analysis) {
    return null;
  }

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex gap-1.5 mb-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= step ? "bg-accent" : "bg-bg-elevated"
            }`}
          />
        ))}
      </div>

      <div>
        <label className="block text-base font-heading font-semibold text-text-primary mb-2">
          {questions[step].q}
        </label>
        <p className="text-xs text-text-tertiary mb-3">{questions[step].hint}</p>
        <textarea
          value={answers[step]}
          onChange={(e) => handleAnswer(e.target.value)}
          placeholder="Write honestly — this is private and encrypted..."
          rows={3}
          className="w-full bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary/60 resize-none focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all duration-200"
        />
      </div>

      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={handleBack}
            className="flex-1 py-2.5 rounded-xl text-sm bg-bg-surface text-text-secondary hover:bg-bg-surface-hover border border-border-primary transition-all duration-200"
          >
            Back
          </button>
        )}
        {step < 2 ? (
          <button
            onClick={handleNext}
            disabled={answers[step].trim().length < 3}
            className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-accent text-black hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={result.loading || answers[2].trim().length < 3}
            className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-accent text-black hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            {result.loading ? "Analyzing..." : "Get Analysis"}
          </button>
        )}
      </div>

      {result.error && (
        <p className="text-sm text-danger text-center">{result.error}</p>
      )}
    </div>
  );
}
