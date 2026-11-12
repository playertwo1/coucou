import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BREAK_MS, SLEEPY_MS, VERY_SLEEPY_MS,
  freshWorkStreak, noteWork, workTired,
} from "../src/mochi/work-streak.ts";

const idle = (seconds) => seconds;

test("two hours is 0.7, three hours is 1, and just short of each stays at the lower level", () => {
  // The last event is this instant: a two-hour gap with no event would already be a break.
  const alive = (at) => ({ start: 0, last: at });
  assert.equal(workTired(alive(SLEEPY_MS - 1), SLEEPY_MS - 1, null).tired, 0);
  assert.equal(workTired(alive(SLEEPY_MS), SLEEPY_MS, null).tired, 0.7);
  assert.equal(workTired(alive(VERY_SLEEPY_MS - 1), VERY_SLEEPY_MS - 1, null).tired, 0.7);
  assert.equal(workTired(alive(VERY_SLEEPY_MS), VERY_SLEEPY_MS, null).tired, 1);
  assert.equal(workTired(alive(VERY_SLEEPY_MS + 1), VERY_SLEEPY_MS + 1, null).tired, 1);
});

test("exactly twenty minutes since the last event starts over, one millisecond less does not", () => {
  let streak = noteWork(freshWorkStreak(), 0, null);
  const kept = noteWork(streak, BREAK_MS - 1, null);
  assert.equal(kept.start, 0);
  assert.equal(workTired(kept, BREAK_MS - 1, null).tired, 0);

  const restarted = noteWork(streak, BREAK_MS, null);
  assert.equal(restarted.start, BREAK_MS);
  assert.deepEqual(workTired(streak, BREAK_MS, null), { tired: 0, streak: freshWorkStreak() });
});

test("keyboard idle of exactly twenty minutes is a break, and a missing idle is not", () => {
  const streak = noteWork(freshWorkStreak(), 0, null);
  assert.equal(workTired(streak, 1_000, idle(1199)).tired, 0);
  assert.equal(workTired(streak, 1_000, idle(1199)).streak.start, 0);
  assert.deepEqual(workTired(streak, 1_000, idle(1200)), { tired: 0, streak: freshWorkStreak() });
  const stillThere = { start: 0, last: SLEEPY_MS };
  assert.equal(workTired(stillThere, SLEEPY_MS, null).tired, 0.7);

  const duringIdle = noteWork(streak, 5_000, idle(1200));
  assert.equal(duringIdle.start, 5_000);
  assert.equal(workTired(duringIdle, 5_000, idle(0)).tired, 0);
});
