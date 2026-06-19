export interface RelapseRecovery {
  id?: number;
  timestamp: string;
  trigger: string;
  triggerDetail: string;
  lesson: string;
  lessonDetail: string;
  commitment: string;
  completed: boolean;
}

const RECOVERY_KEY = "qp_recoveries";

export function loadRecoveries(): RelapseRecovery[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECOVERY_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function saveRecovery(recovery: RelapseRecovery) {
  if (typeof window === "undefined") return;
  const list = loadRecoveries();
  recovery.id = Date.now();
  list.push(recovery);
  localStorage.setItem(RECOVERY_KEY, JSON.stringify(list));
}

export function getRecoveryStats(): { total: number; mostCommonTrigger: string; mostCommonLesson: string } | null {
  const recoveries = loadRecoveries();
  if (recoveries.length === 0) return null;

  const triggerCounts = new Map<string, number>();
  const lessonCounts = new Map<string, number>();
  for (const r of recoveries) {
    triggerCounts.set(r.trigger, (triggerCounts.get(r.trigger) || 0) + 1);
    lessonCounts.set(r.lesson, (lessonCounts.get(r.lesson) || 0) + 1);
  }

  let mostCommonTrigger = "";
  let maxTriggerCount = 0;
  triggerCounts.forEach((c, t) => {
    if (c > maxTriggerCount) { maxTriggerCount = c; mostCommonTrigger = t; }
  });

  let mostCommonLesson = "";
  let maxLessonCount = 0;
  lessonCounts.forEach((c, l) => {
    if (c > maxLessonCount) { maxLessonCount = c; mostCommonLesson = l; }
  });

  return { total: recoveries.length, mostCommonTrigger, mostCommonLesson };
}
