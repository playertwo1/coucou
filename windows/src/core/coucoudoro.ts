// Coucoudoro: work, then rest, then work again, until the user stops. Port of
// CoucoudoroEngine.swift (the countdown, pure: no clock of its own) plus the page's copy of the
// session that the card and the pill read (CoucoudoroController.swift keeps it on the Mac).
// The session is a deadline: nothing ticks in between, so the island stays at 0 % CPU hidden.

export const COUCOUDORO_ID = "integration_coucoudoro";
export const COUCOUDORO_COLOR = "#0EA5E9";

/** Work and rest lengths, in seconds. */
export interface CoucoudoroConfig {
  work: number;
  rest: number;
}

export type CoucoudoroPhase = "idle" | "work" | "rest";

/** The moment a phase begins. */
export type CoucoudoroEvent = "restStarts" | "workStarts";

/** The session, anchored to a deadline (Unix ms) so a late tick does not drift. */
export interface CoucoudoroSnapshot {
  phase: CoucoudoroPhase;
  paused: boolean;
  deadline: number | null;
  /** Seconds left, frozen while paused. The deadline is cleared until resume. */
  pausedRemaining: number | null;
  notice: CoucoudoroEvent | null;
}

export const IDLE_COUCOUDORO: CoucoudoroSnapshot = {
  phase: "idle", paused: false, deadline: null, pausedRemaining: null, notice: null,
};

// shortcut: fixed 25/5 minutes, until Settings gets the two fields (CoucoudoroSettings on the Mac,
// 1…60 minutes each); move the numbers there when it does.
export const DEFAULT_WORK_MINUTES = 25;
export const DEFAULT_REST_MINUTES = 5;

export function coucoudoroConfig(): CoucoudoroConfig {
  return { work: DEFAULT_WORK_MINUTES * 60, rest: DEFAULT_REST_MINUTES * 60 };
}

/** The page's copy of the session, and until when the pill wears the last event instead of the clock. */
export const Coucoudoro = {
  snap: { ...IDLE_COUCOUDORO } as CoucoudoroSnapshot,
  noticeUntil: 0,
};

/** Lengths under a second are pulled up to one second. */
export function sanitize(raw: CoucoudoroConfig): CoucoudoroConfig {
  return { work: Math.max(raw.work, 1), rest: Math.max(raw.rest, 1) };
}

/** A fresh work phase, from the full work length, whatever came before. */
export function start(raw: CoucoudoroConfig, now: number): [CoucoudoroSnapshot, CoucoudoroEvent[]] {
  const config = sanitize(raw);
  const snap: CoucoudoroSnapshot = {
    phase: "work", paused: false, deadline: now + config.work * 1000, pausedRemaining: null, notice: "workStarts",
  };
  return [snap, ["workStarts"]];
}

export function stop(): CoucoudoroSnapshot {
  return { ...IDLE_COUCOUDORO };
}

export function pause(s: CoucoudoroSnapshot, now: number): CoucoudoroSnapshot {
  if (s.phase === "idle" || s.paused) return s;
  return {
    ...s, paused: true, pausedRemaining: Math.max(0, ((s.deadline ?? now) - now) / 1000), deadline: null,
  };
}

export function resume(s: CoucoudoroSnapshot, now: number): CoucoudoroSnapshot {
  if (!s.paused) return s;
  const left = Math.max(0, s.pausedRemaining ?? 0);
  return { ...s, paused: false, pausedRemaining: null, deadline: now + left * 1000 };
}

/**
 * Move the session to `now`. A phase runs until its deadline, then the next one starts and is
 * announced once. If the computer slept, missed phases are not replayed: only the phase that
 * contains `now`.
 */
export function tick(
  s: CoucoudoroSnapshot, raw: CoucoudoroConfig, now: number,
): [CoucoudoroSnapshot, CoucoudoroEvent[]] {
  if (s.phase === "idle" || s.paused || s.deadline == null) return [s, []];
  if (now < s.deadline) return [s, []];
  const landed = land(s.phase, s.deadline, now, sanitize(raw));
  return [{ ...s, phase: landed.phase, deadline: landed.deadline, notice: landed.event }, [landed.event]];
}

/** Seconds left, or null when there is no session. */
export function remaining(s: CoucoudoroSnapshot, now: number): number | null {
  if (s.paused) return s.pausedRemaining;
  if (s.phase === "idle" || s.deadline == null) return null;
  return Math.max(0, (s.deadline - now) / 1000);
}

/** "25:00". Minutes grow past 99 without a leading zero. */
export function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m >= 100 ? m : String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * From a phase that ended at `phaseEnd`, the phase that contains `now`. The next deadline stays on
 * the original schedule (`phaseEnd` plus whole lengths), not `now` plus a length, so a late tick
 * does not stretch the session.
 */
function land(
  phase: CoucoudoroPhase, phaseEnd: number, now: number, config: CoucoudoroConfig,
): { phase: CoucoudoroPhase; deadline: number; event: CoucoudoroEvent } {
  const work = Math.max(1, Math.round(config.work));
  const rest = Math.max(1, Math.round(config.rest));
  const cycle = work + rest;
  const secs = (ms: number) => Math.max(0, Math.floor(ms / 1000));
  if (phase === "work") {
    const restEnd = phaseEnd + rest * 1000;
    if (now < restEnd) return { phase: "rest", deadline: restEnd, event: "restStarts" };
    const over = secs(now - restEnd);
    const origin = restEnd + Math.floor(over / cycle) * cycle * 1000;
    if (over % cycle < work) return { phase: "work", deadline: origin + work * 1000, event: "workStarts" };
    return { phase: "rest", deadline: origin + cycle * 1000, event: "restStarts" };
  }
  // After rest (idle counts as a rest that just ended): the cycle is work then rest.
  const workEnd = phaseEnd + work * 1000;
  if (phase === "rest" && now < workEnd) return { phase: "work", deadline: workEnd, event: "workStarts" };
  if (phase === "idle") return { phase: "work", deadline: phaseEnd + work * 1000, event: "workStarts" };
  const over = secs(now - workEnd);
  const origin = workEnd + Math.floor(over / cycle) * cycle * 1000;
  if (over % cycle < rest) return { phase: "rest", deadline: origin + rest * 1000, event: "restStarts" };
  return { phase: "work", deadline: origin + cycle * 1000, event: "workStarts" };
}
