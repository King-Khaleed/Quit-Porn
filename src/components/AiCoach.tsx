"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  loadSession,
  saveSession,
  clearSession,
  createNewSession,
  sendCoachMessage,
  canSendMessage,
  getRemainingMessages,
  recordUsage,
  getUserDataSummary,
  isPremium,
  type CoachMessage,
  type CoachSession,
} from "@/lib/aiCoach";

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/10 flex items-center justify-center shrink-0 mt-0.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <div className="bg-bg-surface border border-border-primary rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-text-tertiary/40 animate-typing" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-text-tertiary/40 animate-typing" style={{ animationDelay: "200ms" }} />
          <div className="w-2 h-2 rounded-full bg-text-tertiary/40 animate-typing" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onStart }: { onStart: (message: string) => void }) {
  const suggestions = [
    "I'm having an urge right now. Help me through it.",
    "I relapsed today. I need help getting back up.",
    "What technique works best for boredom triggers?",
    "How do I stay motivated after a long streak?",
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <p className="text-lg font-heading font-bold text-text-primary">AI Recovery Coach</p>
      <p className="text-sm text-text-secondary mt-1 max-w-xs leading-relaxed">
        Personalized coaching based on your data. Ask for help, guidance, or just to talk.
      </p>
      <div className="mt-6 w-full max-w-sm space-y-2">
        <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium mb-2">Try asking</p>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onStart(s)}
            className="w-full text-left bg-bg-surface border border-border-primary rounded-xl px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary transition-all animate-fade-in-up"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            "{s}"
          </button>
        ))}
      </div>
    </div>
  );
}

interface Props {
  onClose: () => void;
}

export default function AiCoach({ onClose }: Props) {
  const [session, setSession] = useState<CoachSession | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(getRemainingMessages());
  const [premium, setPremium] = useState(isPremium());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const existing = loadSession();
    if (existing && existing.messages.length > 0) {
      setSession(existing);
    } else {
      setSession(createNewSession());
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages.length, streamingContent]);

  const addMessage = useCallback(
    (msg: CoachMessage) => {
      setSession((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          messages: [...prev.messages, msg],
          updatedAt: new Date().toISOString(),
        };
        saveSession(updated);
        return updated;
      });
    },
    []
  );

  const handleSend = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || loading) return;
      if (!canSendMessage() && !premium) {
        setError("You've used your free messages for today. Upgrade to Premium for unlimited coaching.");
        return;
      }

      setLoading(true);
      setError(null);
      setStreamingContent("");

      const userMsg: CoachMessage = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };
      addMessage(userMsg);
      setInput("");
      recordUsage();
      setRemaining(getRemainingMessages());

      try {
        const currentMessages = session?.messages || [];
        const apiMessages = [...currentMessages, userMsg].map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        const result = await sendCoachMessage(apiMessages);

        const assistantMsg: CoachMessage = {
          role: "assistant",
          content: result.content,
          timestamp: new Date().toISOString(),
        };
        addMessage(assistantMsg);
      } catch (err: any) {
        setError(err.message || "Something went wrong. Please try again.");
      } finally {
        setLoading(false);
        setStreamingContent("");
        inputRef.current?.focus();
      }
    },
    [loading, session, premium, addMessage]
  );

  const handleNewChat = useCallback(() => {
    clearSession();
    setSession(createNewSession());
    setError(null);
    setRemaining(getRemainingMessages());
    setInput("");
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend(input);
      }
    },
    [input, handleSend]
  );

  const messages = session?.messages || [];
  const hasMessages = messages.length > 0;
  const dataSummary = hasMessages ? getUserDataSummary() : "";

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-border-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-secondary transition-colors"
              aria-label="Close coach"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <p className="text-sm font-medium text-text-primary">AI Recovery Coach</p>
              {dataSummary && (
                <p className="text-[10px] text-text-tertiary">{dataSummary}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!premium && (
              <span className="text-[10px] text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded">
                {remaining} free
              </span>
            )}
            {premium && (
              <span className="text-[10px] text-accent font-medium">Premium</span>
            )}
            {hasMessages && (
              <button
                onClick={handleNewChat}
                className="text-[10px] text-accent hover:text-accent-hover transition-colors"
              >
                New chat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        {!hasMessages && !loading && (
          <WelcomeScreen onStart={handleSend} />
        )}

        {hasMessages &&
          messages.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={i}
                className={`flex items-start gap-3 px-5 py-2 animate-fade-in ${
                  isUser ? "flex-row-reverse" : ""
                }`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                )}
                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-bg-elevated border border-border-primary flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? "bg-accent text-black rounded-tr-sm"
                      : "bg-bg-surface border border-border-primary rounded-tl-sm text-text-primary"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

        {loading && <TypingIndicator />}

        {/* Error */}
        {error && (
          <div className="px-5 py-2">
            <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
              <p className="text-xs text-danger leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-5 pb-6 pt-3 border-t border-border-primary">
        {!premium && remaining <= 0 && !hasMessages && (
          <div className="bg-accent-subtle/10 border border-accent/10 rounded-xl px-4 py-3 mb-3 text-center">
            <p className="text-xs text-text-secondary leading-relaxed">
              You've used all free messages today.{" "}
              <a href="/premium" className="text-accent hover:text-accent-hover">
                Upgrade to Premium
              </a>{" "}
              for unlimited coaching.
            </p>
          </div>
        )}
        {!premium && remaining <= 0 && hasMessages && (
          <div className="bg-accent-subtle/10 border border-accent/10 rounded-xl px-4 py-3 mb-3 text-center">
            <p className="text-xs text-text-secondary">
              Free limit reached.{" "}
              <a href="/premium" className="text-accent hover:text-accent-hover">
                Upgrade → Unlimited
              </a>
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={remaining > 0 || premium ? "Tell me what's on your mind..." : "Limit reached"}
            disabled={loading || (!canSendMessage() && !premium)}
            rows={1}
            className="flex-1 bg-bg-surface border border-border-primary rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary/60 resize-none focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed max-h-32"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading || (!canSendMessage() && !premium)}
            className="w-11 h-11 rounded-xl bg-accent text-black flex items-center justify-center hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
