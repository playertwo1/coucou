// Hours with the agents, in memory only (WorkStreak.swift). No timer and nothing
// on disk: the island asks, with an explicit clock, while Mochi is on screen.

/** Twenty minutes. A gap this long, or the keyboard idle this long, starts over. */
export const BREAK_MS = 20 * 60 * 1000;
/** Sleepy eyes after two hours without that break. */
export const SLEEPY_MS = 2 * 60 * 60 * 1000;
/** Very sleepy after three hours. */
export const VERY_SLEEPY_MS = 3 * 60 * 60 * 1000;

const WORK_EVENTS = new Set([
  "UserPromptSubmit", "PreToolUse", "PostToolUse", "PostToolUseFailure", "Stop",
]);

export interface WorkStreak {
  start: number | null;
  last: number | null;
}

export const freshWorkStreak = (): WorkStreak => ({ start: null, last: null });

/** Still the same stretch: the last event and, when known, the keyboard are inside 20 min. */
export function workGoing(streak: WorkStreak, now: number, idleSeconds: number | null): boolean {
  if (streak.start == null || streak.last == null) return false;
  if (now - streak.last >= BREAK_MS) return false;
  if (idleSeconds != null && idleSeconds * 1000 >= BREAK_MS) return false;
  return true;
}

/** An agent event. A break makes this event the start of a new stretch. */
export function noteWork(streak: WorkStreak, now: number, idleSeconds: number | null): WorkStreak {
  const start = workGoing(streak, now, idleSeconds) ? streak.start : now;
  return { start, last: now };
}

/**
 * Sleepiness for this instant. A break clears the stretch and returns 0.
 * Two hours → 0.7. Three hours → 1.
 */
export function workTired(streak: WorkStreak, now: number, idleSeconds: number | null): { tired: number; streak: WorkStreak } {
  if (!workGoing(streak, now, idleSeconds) || streak.start == null) {
    return { tired: 0, streak: freshWorkStreak() };
  }
  const worked = now - streak.start;
  const tired = worked >= VERY_SLEEPY_MS ? 1 : worked >= SLEEPY_MS ? 0.7 : 0;
  return { tired, streak };
}

let state = freshWorkStreak();
let lastIdle: number | null = null;

export function resetWorkStreak() {
  state = freshWorkStreak();
  lastIdle = null;
}

/** The latest keyboard idle from a vitals sample. Unknown idle does not count as a break. */
export function rememberIdle(idleSeconds: number | null) {
  lastIdle = idleSeconds;
}

export function recordAgentWork(name: string, now = Date.now()) {
  if (!WORK_EVENTS.has(name)) return;
  state = noteWork(state, now, lastIdle);
}

export function currentWorkTired(now = Date.now(), idleSeconds: number | null = lastIdle) {
  const next = workTired(state, now, idleSeconds);
  state = next.streak;
  return next.tired;
}

export function workStreakSnapshot(): WorkStreak {
  return { start: state.start, last: state.last };
}
