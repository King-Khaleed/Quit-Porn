"use client";

import { useEffect, useState, useCallback } from "react";
import StreakDisplay from "@/components/StreakDisplay";
import PatternAlertBanner from "@/components/PatternAlert";
import UrgeDial from "@/components/UrgeDial";
import MicroSession from "@/components/MicroSession";
import Nav from "@/components/Nav";
import RelapseRecovery from "@/components/RelapseRecovery";
import UrgeFeed from "@/components/UrgeFeed";
import PatternCard from "@/components/PatternCard";
import Timeline from "@/components/Timeline";
import InstallBanner from "@/components/InstallBanner";
import AiCoach from "@/components/AiCoach";
import PreCommitScreen, { getFocusModeSuggestions as getRiskSuggestions, isHighRiskWindow } from "@/components/PreCommitScreen";
import Onboarding from "@/components/Onboarding";
import { useStreak } from "@/hooks/useStreak";
import { usePatterns } from "@/hooks/usePatterns";
import { useAuth } from "@/hooks/useAuth";
import { saveUrgeLog, getUrgeTrend, getCommitStreak, saveCheckin, loadCheckins, setCommitStreak, type UrgeLog } from "@/lib/urgeTracking";
import { addFeedItem } from "@/lib/feed";
import { requestPersistentStorage } from "@/lib/db";
import { sendNotification } from "@/lib/push";
import { IconLogo, IconCheck } from "@/components/icons";

export default function HomePage() {
  const { session, loading: authLoading, loginAnonymously } = useAuth();
  const { streak, handleRelapse, handleIncrement } = useStreak();
  const { riskScore, patternAlert, analyze } = usePatterns();
  const [greeting, setGreeting] = useState("");
  const [urge, setUrge] = useState(0);
  const [showSession, setShowSession] = useState(false);
  const [showRelapseRecovery, setShowRelapseRecovery] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [lastLog, setLastLog] = useState<UrgeLog | null>(null);
  const [trend, setTrend] = useState(getUrgeTrend());
  const [committedToday, setCommittedToday] = useState(false);
  const [shareDirectLog, setShareDirectLog] = useState(false);
  const [focusMode, setFocusMode] = useState<{ active: boolean; until: string | null }>({ active: false, until: null });
  const [showFocusBanner, setShowFocusBanner] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    requestPersistentStorage();
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Morning");
    else if (hour < 17) setGreeting("Afternoon");
    else setGreeting("Evening");

    setTrend(getUrgeTrend());

    const done = localStorage.getItem("qp_onboarding_done");
    if (!done) setShowOnboarding(true);

    const today = new Date().toISOString().split("T")[0];
    const checkins = loadCheckins();
    setCommittedToday(checkins.some((c: any) => c.date === today && c.committed));
  }, []);

  useEffect(() => {
    if (streak.current > 0 && streak.current % 7 === 0) {
      const sentKey = `qp_milestone_${streak.current}`;
      if (!localStorage.getItem(sentKey)) {
        sendNotification("Milestone", `You're ${streak.current} days clean! Every day is progress.`);
        localStorage.setItem(sentKey, "1");
      }
    }
  }, [streak.current]);

  useEffect(() => {
    const stored = localStorage.getItem("qp_focus_mode");
    if (stored) {
      try {
        const fm = JSON.parse(stored);
        if (fm.active && fm.until && new Date(fm.until) > new Date()) {
          setFocusMode(fm);
          setShowFocusBanner(true);
        } else {
          localStorage.removeItem("qp_focus_mode");
        }
      } catch {}
    }

    const risks = getRiskSuggestions();
    if (risks.length > 0 && !focusMode.active) {
      setShowFocusBanner(true);
    }
  }, []);

  const handleEnterFocusMode = useCallback((hours: number) => {
    const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    const fm = { active: true, until };
    localStorage.setItem("qp_focus_mode", JSON.stringify(fm));
    setFocusMode(fm);
    setShowFocusBanner(true);
  }, []);

  const handleExitFocusMode = useCallback(() => {
    localStorage.removeItem("qp_focus_mode");
    setFocusMode({ active: false, until: null });
    setShowFocusBanner(false);
  }, []);

  const handleUrgeSelect = (value: number) => {
    setUrge(value);
    if (value >= 4) {
      setShowSession(true);
    } else {
      const log: UrgeLog = {
        intensity: value,
        timestamp: new Date().toISOString(),
        mood: "calm",
      };
      saveUrgeLog(log);
      handleIncrement();
      analyze("calm");
      setLastLog(log);
      setShareDirectLog(false);
    }
  };

  const handleSessionComplete = (log: UrgeLog) => {
    setShowSession(false);
    setLastLog(log);
    if (log.intensityAfter && log.intensityAfter < log.intensity) {
      handleIncrement();
    }
    analyze(log.mood || "calm");
    setTrend(getUrgeTrend());
    setUrge(0);
  };

  const handleCommitToday = () => {
    const today = new Date().toISOString().split("T")[0];
    const currentStreak = getCommitStreak();
    saveCheckin({ date: today, committed: true, completed: false });
    setCommittedToday(true);
    setCommitStreak(currentStreak + 1);
  };

  const handleDirectShare = useCallback(() => {
    if (!lastLog) return;
    addFeedItem({
      timestamp: lastLog.timestamp,
      intensity: lastLog.intensity,
      worked: true,
    });
    setShareDirectLog(true);
  }, [lastLog]);

  const handleRelapseStart = useCallback(() => {
    setShowRelapseRecovery(true);
  }, []);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-sm text-text-tertiary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary px-6">
        <div className="max-w-sm w-full text-center space-y-6 animate-fade-in-up">
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
              <IconLogo size={36} className="text-accent" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-text-primary">QuitPorn</h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              A shame-free, neuroscience-based recovery tool. No email, no tracking, no judgment.
            </p>
          </div>
          <div className="space-y-2 text-left text-xs text-text-tertiary bg-bg-surface rounded-xl p-4 border border-border-primary">
            <div className="flex items-start gap-2">
              <IconCheck size={14} className="text-accent mt-0.5 shrink-0" />
              <span>Zero-knowledge encryption — your journal is yours alone</span>
            </div>
            <div className="flex items-start gap-2">
              <IconCheck size={14} className="text-accent mt-0.5 shrink-0" />
              <span>Anonymous, no email or signup required</span>
            </div>
            <div className="flex items-start gap-2">
              <IconCheck size={14} className="text-accent mt-0.5 shrink-0" />
              <span>Neuroscience-based tools, not shame-based guilt</span>
            </div>
          </div>
          <button
            onClick={loginAnonymously}
            className="w-full py-3 rounded-xl font-medium text-sm bg-accent text-black hover:bg-accent-hover transition-all duration-200"
          >
            Start Anonymously
          </button>
          <p className="text-xs text-text-tertiary">No personal data collected. Ever.</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  const trendArrow = trend.trend === "down" ? "↓" : trend.trend === "up" ? "↑" : "→";
  const trendColor = trend.trend === "down" ? "text-accent" : trend.trend === "up" ? "text-danger" : "text-text-tertiary";

  return (
    <>
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pt-8 pb-28">
        <div className="animate-fade-in">
          <p className="text-sm text-text-secondary font-medium">Good {greeting}</p>
          <h1 className="text-xl font-heading font-bold text-text-primary mt-0.5">Your Recovery</h1>
        </div>

        {/* Pattern Card — smart insight */}
        <div className="mt-5">
          <PatternCard />
        </div>

        {/* Focus Mode Banner */}
        {showFocusBanner && (
          <div className="mt-4 bg-accent-subtle/30 border border-accent/20 rounded-xl p-4 animate-fade-in space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {focusMode.active ? "Focus Mode Active" : "High-Risk Window"}
                </p>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  {focusMode.active
                    ? `Blocked sites will trigger an intervention. Active until ${new Date(focusMode.until || "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
                    : getRiskSuggestions().join(" ") + " Blocked sites will show an intervention."}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {focusMode.active ? (
                <button
                  onClick={handleExitFocusMode}
                  className="flex-1 py-2 rounded-lg text-xs font-medium bg-bg-elevated text-text-secondary hover:bg-bg-surface-hover border border-border-primary transition-all"
                >
                  Exit Focus Mode
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleEnterFocusMode(1)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all"
                  >
                    Focus 1h
                  </button>
                  <button
                    onClick={() => handleEnterFocusMode(4)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all"
                  >
                    Focus 4h
                  </button>
                </>
              )}
              <button
                onClick={() => setShowFocusBanner(false)}
                className="px-3 py-2 rounded-lg text-xs text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Urge Dial — the new centerpiece */}
        <div className="mt-5">
          <UrgeDial
            label="How intense is your urge right now?"
            onSelect={handleUrgeSelect}
          />
        </div>

        {/* Quick trend summary */}
        {trend.logs7d > 0 && (
          <div className="mt-4 flex items-center justify-center gap-4 text-xs">
            <span className="text-text-tertiary">
              7d avg: <span className="text-text-secondary font-medium">{trend.average}</span>
            </span>
            <span className={`font-medium ${trendColor}`}>
              {trendArrow} {trend.trend === "down" ? "Improving" : trend.trend === "up" ? "Rising" : "Stable"}
            </span>
            <span className="text-text-tertiary">
              Peak: <span className="text-text-secondary font-medium">{trend.peak7d}</span>
            </span>
          </div>
        )}

        {/* Daily Commitment */}
        {!committedToday && (
          <button
            onClick={handleCommitToday}
            className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all animate-fade-in"
          >
            + I commit to today
          </button>
        )}
        {committedToday && (
          <p className="mt-3 text-xs text-accent text-center animate-fade-in">
            Today's commitment logged. You've got this.
          </p>
        )}

        {/* Streak + Risk */}
        <div className="mt-6 flex items-start gap-4">
          <div className="shrink-0">
            <StreakDisplay streak={streak} />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <PatternAlertBanner alert={patternAlert} riskScore={riskScore} />
          </div>
        </div>

        {/* Relapse button */}
        {streak.current > 0 && (
          <button
            onClick={handleRelapseStart}
            className="mt-2 text-xs text-text-tertiary hover:text-text-secondary transition-colors text-center w-full"
          >
            Had a relapse? Log it here — no shame, just data.
          </button>
        )}

        {/* Timeline */}
        <div className="mt-4">
          <Timeline />
        </div>

        {/* Share toggle for direct logs */}
        {lastLog && !shareDirectLog && !showSession && (
          <div className="mt-3 animate-fade-in">
            <label className="flex items-center justify-center gap-2 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  onChange={handleDirectShare}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-bg-elevated rounded-full peer-checked:bg-accent/40 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-text-tertiary transition-all duration-200 peer-checked:translate-x-4 peer-checked:bg-accent" />
              </div>
              <span className="text-xs text-text-tertiary">Share anonymously to help others</span>
            </label>
          </div>
        )}

        {shareDirectLog && (
          <p className="mt-2 text-xs text-accent text-center animate-fade-in">
            Shared anonymously ✓
          </p>
        )}

        {/* Anonymous Urge Feed */}
        <div className="mt-6">
          <UrgeFeed />
        </div>

        {/* Quick actions */}
        <div className="mt-6 space-y-2">
          <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-widest">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="/journal"
              className="bg-bg-surface border border-border-primary rounded-xl px-3 py-3 hover:bg-bg-surface-hover transition-all"
            >
              <p className="text-xs font-medium text-text-primary">Write Journal</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">Encrypted & private</p>
            </a>
            <a
              href="/techniques"
              className="bg-bg-surface border border-border-primary rounded-xl px-3 py-3 hover:bg-bg-surface-hover transition-all"
            >
              <p className="text-xs font-medium text-text-primary">Techniques</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">60-sec interventions</p>
            </a>
            <button
              onClick={() => focusMode.active ? handleExitFocusMode() : handleEnterFocusMode(1)}
              className={`rounded-xl px-3 py-3 text-left transition-all ${
                focusMode.active
                  ? "bg-accent-subtle/30 border border-accent/30"
                  : "bg-bg-surface border border-border-primary hover:bg-bg-surface-hover"
              }`}
            >
              <p className={`text-xs font-medium ${focusMode.active ? "text-accent" : "text-text-primary"}`}>
                {focusMode.active ? "Focus Mode On" : "Focus Mode"}
              </p>
              <p className="text-[10px] text-text-tertiary mt-0.5">
                {focusMode.active ? "Active — sites intercepted" : "Pre-commit intervention"}
              </p>
            </button>
            <a
              href="/settings"
              className="bg-bg-surface border border-border-primary rounded-xl px-3 py-3 hover:bg-bg-surface-hover transition-all"
            >
              <p className="text-xs font-medium text-text-primary">Settings</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">Blocklist & backup</p>
            </a>
          </div>
        </div>
      </div>

      {/* Micro-Session overlay */}
      {showSession && (
        <MicroSession
          initialIntensity={urge}
          onComplete={handleSessionComplete}
          onDismiss={() => {
            setShowSession(false);
            setUrge(0);
          }}
        />
      )}

      {/* Relapse Recovery overlay */}
      {showRelapseRecovery && (
        <RelapseRecovery
          onComplete={() => {
            setTrend(getUrgeTrend());
          }}
          onDismiss={() => {
            setShowRelapseRecovery(false);
          }}
        />
      )}

      <InstallBanner />

      {/* AI Coach FAB */}
      <button
        onClick={() => setShowCoach(true)}
        className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-accent text-black shadow-lg hover:bg-accent-hover transition-all animate-scale-in flex items-center justify-center"
        aria-label="Open AI Recovery Coach"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </button>

      <Nav />

      {/* AI Coach overlay */}
      {showCoach && (
        <AiCoach onClose={() => setShowCoach(false)} />
      )}
    </>
  );
}
