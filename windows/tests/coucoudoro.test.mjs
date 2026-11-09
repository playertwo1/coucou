// Coucoudoro: the countdown in src/core/coucoudoro.ts (CoucoudoroEngine.swift's rules) and the
// page's controller in src/island/coucoudoro.ts (CoucoudoroController.swift).

import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { installFakeDom } from "./fakedom.mjs";
import {
  COUCOUDORO_ID, Coucoudoro, IDLE_COUCOUDORO, daySummary, parseFocusLog, clock, pause, remaining, resume, sanitize, start, stop, tick,
} from "../src/core/coucoudoro.ts";
import {
  banner, begin, end, pause as pauseSession, pillLabel, registerCoucoudoro, resetCoucoudoro, resume as resumeSession,
  tick as tickSession,
} from "../src/island/coucoudoro.ts";
import { DEFAULT_SETTINGS, State } from "../src/core/state.ts";

installFakeDom();

const CONFIG = { work: 25 * 60, rest: 5 * 60 };
const T0 = 1_000_000;
const min = (n) => n * 60_000;

// ── The countdown ───────────────────────────────────────────────────────────

test("start: a fresh work phase of the full length, announced once", () => {
  const [snap, events] = start(CONFIG, T0);
  assert.equal(snap.phase, "work");
  assert.equal(snap.deadline, T0 + min(25));
  assert.deepEqual(events, ["workStarts"]);
});

test("lengths under a second are pulled up to one second", () => {
  assert.deepEqual(sanitize({ work: 0, rest: -3 }), { work: 1, rest: 1 });
});

test("before the deadline nothing happens", () => {
  const [snap] = start(CONFIG, T0);
  const [next, events] = tick(snap, CONFIG, T0 + min(24));
  assert.equal(next, snap);
  assert.deepEqual(events, []);
});

test("work ends: rest starts, on the original schedule", () => {
  const [snap] = start(CONFIG, T0);
  const [next, events] = tick(snap, CONFIG, T0 + min(25) + 800);
  assert.equal(next.phase, "rest");
  assert.equal(next.deadline, T0 + min(30));
  assert.deepEqual(events, ["restStarts"]);
  const [again, more] = tick(next, CONFIG, T0 + min(30) + 50);
  assert.equal(again.phase, "work");
  assert.equal(again.deadline, T0 + min(55));
  assert.deepEqual(more, ["workStarts"]);
});

test("after sleeping through several cycles only the phase that contains now is announced", () => {
  const [snap] = start(CONFIG, T0);
  // 25 work + 5 rest = 30 per cycle. 3 cycles and 10 minutes later: inside the 4th work phase.
  const [work, e1] = tick(snap, CONFIG, T0 + min(100));
  assert.equal(work.phase, "work");
  assert.equal(work.deadline, T0 + min(115));
  assert.deepEqual(e1, ["workStarts"]);
  // 3 cycles and 27 minutes later: inside the 4th rest phase.
  const [rest, e2] = tick(snap, CONFIG, T0 + min(117));
  assert.equal(rest.phase, "rest");
  assert.equal(rest.deadline, T0 + min(120));
  assert.deepEqual(e2, ["restStarts"]);
});

test("pause freezes what is left; resume gives the deadline back from now", () => {
  const [snap] = start(CONFIG, T0);
  const paused = pause(snap, T0 + min(10));
  assert.equal(paused.paused, true);
  assert.equal(paused.deadline, null);
  assert.equal(remaining(paused, T0 + min(99)), 15 * 60);
  assert.deepEqual(tick(paused, CONFIG, T0 + min(99)), [paused, []]);
  const back = resume(paused, T0 + min(20));
  assert.equal(back.paused, false);
  assert.equal(back.deadline, T0 + min(35));
});

test("pause and resume on an idle or running session change nothing", () => {
  assert.equal(pause(IDLE_COUCOUDORO, T0), IDLE_COUCOUDORO);
  const [snap] = start(CONFIG, T0);
  assert.equal(resume(snap, T0), snap);
  assert.deepEqual(stop(), IDLE_COUCOUDORO);
});

test("clock: 25:00, a leading zero, and minutes past 99 stay whole", () => {
  assert.equal(clock(25 * 60), "25:00");
  assert.equal(clock(65), "01:05");
  assert.equal(clock(0.9), "00:00");
  assert.equal(clock(-5), "00:00");
  assert.equal(clock(100 * 60 + 7), "100:07");
});

// ── The controller ──────────────────────────────────────────────────────────

const host = () => {
  const opened = [];
  return { opened, alert: (view) => opened.push(view) };
};

function setup(active = true) {
  resetCoucoudoro();
  State.settings = { ...DEFAULT_SETTINGS, activeIntegrations: active ? [COUCOUDORO_ID] : [] };
  State.loadIntegrationTasks();
  State.pendingApproval = null;
  State.mode = "hidden";
  State.view = "overview";
  State.paused = false;
  State.focusId = null;
  const h = host();
  registerCoucoudoro(h);
  return h;
}

const pillTask = () => State.tasks.find((x) => x.id === COUCOUDORO_ID);

beforeEach(() => resetCoucoudoro());

test("begin: the pill works, says so, and the island opens onto it", () => {
  const h = setup();
  begin(T0);
  assert.equal(Coucoudoro.snap.phase, "work");
  assert.equal(pillTask().state, "working");
  assert.deepEqual(pillTask().steps, ["Coucoudoro · Work"]);
  assert.equal(State.focusId, COUCOUDORO_ID);
  assert.deepEqual(h.opened, ["overview"]);
  assert.equal(banner(T0 + 7_000), "Coucoudoro · Work");
  assert.equal(banner(T0 + 9_000), null);
  end();
});

test("the pill label is the sentence for a few seconds, then the clock", () => {
  setup();
  begin(T0);
  assert.equal(pillLabel(clock, T0 + 1_000), "Coucoudoro · Work");
  assert.equal(pillLabel(clock, T0 + 10_000), "24:50");
  end();
  assert.equal(pillLabel(clock, T0 + 10_000), "Coucoudoro");
});

test("begin does nothing while the pill is off", () => {
  const h = setup(false);
  begin(T0);
  assert.equal(Coucoudoro.snap.phase, "idle");
  assert.deepEqual(h.opened, []);
});

test("the end of work: rest starts, the pill says so", () => {
  const h = setup();
  begin(T0);
  tickSession(T0 + min(25) + 100);
  assert.equal(Coucoudoro.snap.phase, "rest");
  assert.deepEqual(pillTask().steps, ["Coucoudoro · Rest"]);
  assert.equal(h.opened.length, 2);
  end();
});

test("a permission waiting is not taken away: a badge on the pill instead", () => {
  const h = setup();
  begin(T0);
  State.pendingApproval = { pillId: "integration_claude" };
  State.focusId = "integration_claude";
  tickSession(T0 + min(25) + 100);
  assert.equal(h.opened.length, 1);
  assert.equal(pillTask().pillBadge, "finished");
  State.pendingApproval = null;
  end();
});

test("pause and resume keep the phase; stop goes back to ready", () => {
  setup();
  begin(T0);
  pauseSession(T0 + min(5));
  assert.equal(Coucoudoro.snap.paused, true);
  assert.deepEqual(pillTask().steps, ["Paused"]);
  resumeSession(T0 + min(8));
  assert.equal(Coucoudoro.snap.paused, false);
  assert.equal(Coucoudoro.snap.deadline, T0 + min(8) + min(20));
  end();
  assert.equal(Coucoudoro.snap.phase, "idle");
  assert.equal(pillTask().state, "idle");
  assert.deepEqual(pillTask().steps, []);
  assert.equal(pillTask().name, "Coucoudoro");
});

test("turning the pill off ends the session", () => {
  setup();
  begin(T0);
  State.settings = { ...State.settings, activeIntegrations: [] };
  State.notify();
  assert.equal(Coucoudoro.snap.phase, "idle");
});

test("the day's focus: total, phases and projects of today only", () => {
  const now = new Date(2026, 10, 9, 15, 0).getTime();
  const yesterday = new Date(2026, 10, 8, 15, 0).getTime();
  const log = [
    { at: yesterday, seconds: 1500, project: "old", note: null },
    { at: now - min(60), seconds: 1500, project: "coucou", note: "tests" },
    { at: now - min(30), seconds: 1500, project: "coucou", note: null },
    { at: now - min(5), seconds: 1500, project: null, note: null },
  ];
  const day = daySummary(log, now);
  assert.equal(day.seconds, 4500);
  assert.equal(day.cycles, 3);
  assert.deepEqual(day.projects, [["coucou", 3000]]);
  assert.deepEqual(daySummary([], now), { seconds: 0, cycles: 0, projects: [] });
});

test("a stored history keeps only entries of the right shape", () => {
  assert.deepEqual(parseFocusLog("nope"), []);
  assert.deepEqual(parseFocusLog([{ at: 1, seconds: 2 }, { at: "x" }, null, { at: 3, seconds: 4, project: "p", note: "n" }]), [
    { at: 1, seconds: 2, project: null, note: null },
    { at: 3, seconds: 4, project: "p", note: "n" },
  ]);
});
