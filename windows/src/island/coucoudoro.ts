// Coucoudoro's clock on the page — port of CoucoudoroController.swift. One timer fires at the
// running phase's deadline (nothing ticks in between); the card and the pill draw the clock from
// the deadline. A phase change lands on the pill: its sentence, a sound, and the island opens onto
// it unless a card the user is in the middle of is already up.

import { pillDefinition } from "../core/pills";
import {
  COUCOUDORO_ID, Coucoudoro, IDLE_COUCOUDORO, coucoudoroConfig, pause as pauseSnap, remaining, resume as resumeSnap,
  start, stop, tick as tickSnap, type CoucoudoroEvent,
} from "../core/coucoudoro";
import type { IslandViewName } from "../core/layout";
import { Sound } from "../core/sound";
import { State } from "../core/state";
import { t } from "../i18n/i18n";

export interface CoucoudoroHost {
  /** Open the island on this view (the hook server's alert path). */
  alert(view: IslandViewName): void;
}

/** The pill capsule shows the new phase's sentence for this long, then the clock again. */
const BANNER_MS = 8_000;

let host: CoucoudoroHost | null = null;
let timer: number | null = null;

function isPillActive(): boolean {
  return State.settings.activeIntegrations.includes(COUCOUDORO_ID);
}

function task() {
  return State.tasks.find((x) => x.id === COUCOUDORO_ID);
}

export function registerCoucoudoro(island: CoucoudoroHost) {
  host = island;
  // Turning the pill off ends the session (CoucoudoroController.updatePolling).
  State.subscribe(() => {
    if (!isPillActive() && (Coucoudoro.snap.phase !== "idle" || timer != null)) end();
  });
}

export function begin(now = Date.now()) {
  if (!isPillActive()) return;
  const [next, events] = start(coucoudoroConfig(), now);
  Coucoudoro.snap = next;
  ensureTimer();
  surface(events[events.length - 1], now);
}

/** End the session. The next begin() is a fresh work phase. */
export function end() {
  Coucoudoro.snap = stop();
  Coucoudoro.noticeUntil = 0;
  stopTimer();
  paintIdle();
  State.notify();
}

export function pause(now = Date.now()) {
  const s = Coucoudoro.snap;
  if (!isPillActive() || s.phase === "idle" || s.paused) return;
  Coucoudoro.snap = pauseSnap(s, now);
  stopTimer();
  paint("idle", [t("Paused")]);
  State.notify();
}

export function resume(now = Date.now()) {
  const s = Coucoudoro.snap;
  if (!isPillActive() || !s.paused) return;
  Coucoudoro.snap = resumeSnap(s, now);
  ensureTimer();
  paint(Coucoudoro.snap.phase === "work" ? "working" : "idle", [
    Coucoudoro.snap.notice ? eventText(Coucoudoro.snap.notice) : t("Work"),
  ]);
  tick(now);
  State.notify();
}

/** The sentence on the pill: a phase change names the phase that just started, for a few seconds. */
export function banner(now = Date.now()): string | null {
  const { snap, noticeUntil } = Coucoudoro;
  return snap.notice && now < noticeUntil ? eventText(snap.notice) : null;
}

/** What the pill capsule says: the sentence while it is fresh, otherwise the clock. */
export function pillLabel(clockText: (seconds: number) => string, now = Date.now()): string {
  const fresh = banner(now);
  if (fresh) return fresh;
  const left = remaining(Coucoudoro.snap, now);
  return Coucoudoro.snap.phase !== "idle" && left != null ? clockText(left) : "Coucoudoro";
}

export function eventText(event: CoucoudoroEvent): string {
  return event === "restStarts" ? t("Coucoudoro · Rest") : t("Coucoudoro · Work");
}

/** One timer, at the running phase's deadline. */
function ensureTimer() {
  stopTimer();
  const { phase, paused, deadline } = Coucoudoro.snap;
  if (phase === "idle" || paused || deadline == null) return;
  timer = window.setTimeout(() => {
    timer = null;
    tick();
  }, Math.max(0, deadline - Date.now()) + 50);
}

function stopTimer() {
  if (timer != null) window.clearTimeout(timer);
  timer = null;
}

export function tick(now = Date.now()) {
  if (!isPillActive()) {
    if (Coucoudoro.snap.phase !== "idle") end();
    return;
  }
  const [next, events] = tickSnap(Coucoudoro.snap, coucoudoroConfig(), now);
  if (next === Coucoudoro.snap) {
    ensureTimer();
    return;
  }
  Coucoudoro.snap = next;
  ensureTimer();
  surface(events[events.length - 1], now);
}

/**
 * The event lands on the Coucoudoro pill. The island opens onto that pill unless a card the user
 * is in the middle of (an approval, a question, the chat) is already up.
 */
function surface(event: CoucoudoroEvent | undefined, now: number) {
  if (!event) return;
  Coucoudoro.noticeUntil = now + BANNER_MS;
  // Working keeps the pill's place beside the one in front, through rest as well as work.
  const { phase, paused } = Coucoudoro.snap;
  paint(phase !== "idle" && !paused ? "working" : "idle", [eventText(event)]);
  if (canSurface()) {
    State.setFocus(COUCOUDORO_ID);
    host?.alert("overview");
  } else if (State.focusId !== COUCOUDORO_ID) {
    State.setPillBadge(COUCOUDORO_ID, "finished");
  }
  if (!State.paused) Sound.play(event === "workStarts" ? "work" : "finish");
  State.notify();
}

/** Don't take the island away from a card the user is busy in. */
function canSurface(): boolean {
  if (State.paused) return false;
  if (State.pendingApproval != null) return false;
  if (State.mode !== "expanded") return true;
  return State.view === "overview" || State.view === "empty" || State.view === "finished" || State.view === "error";
}

function paint(state: "idle" | "working", steps: string[]) {
  const x = task();
  if (!x) return;
  x.state = state;
  x.steps = steps;
  x.stepIndex = 0;
}

function paintIdle() {
  const x = task();
  if (!x) return;
  x.state = "idle";
  x.steps = [];
  x.stepIndex = 0;
  x.pillBadge = null;
  x.name = pillDefinition(COUCOUDORO_ID)?.name ?? "Coucoudoro";
}

// For tests: forget the session without touching the pill.
export function resetCoucoudoro() {
  stopTimer();
  Coucoudoro.snap = { ...IDLE_COUCOUDORO };
  Coucoudoro.noticeUntil = 0;
  host = null;
}
