const PREFS_KEY = "qp_feedback_prefs";

export type FeedbackPrefs = {
  sound: boolean;
  haptics: boolean;
};

const DEFAULT_PREFS: FeedbackPrefs = { sound: true, haptics: true };

export function getFeedbackPrefs(): FeedbackPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function setFeedbackPrefs(prefs: Partial<FeedbackPrefs>): FeedbackPrefs {
  const next = { ...getFeedbackPrefs(), ...prefs };
  localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  return next;
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, volume = 0.06) {
  if (!getFeedbackPrefs().sound) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = frequency;
  osc.type = "sine";
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playTap() {
  playTone(880, 0.05, 0.05);
}

export function playSuccess() {
  playTone(660, 0.08, 0.06);
  setTimeout(() => playTone(880, 0.1, 0.05), 80);
}

export function playError() {
  playTone(220, 0.12, 0.05);
}

export function vibrate(pattern: number | number[] = 8) {
  if (!getFeedbackPrefs().haptics) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export function tapFeedback() {
  playTap();
  vibrate(6);
}

export function successFeedback() {
  playSuccess();
  vibrate([8, 40, 8]);
}

export function errorFeedback() {
  playError();
  vibrate([20, 30, 20]);
}
