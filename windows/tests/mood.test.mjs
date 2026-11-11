// Mochi's moods (src/mochi/mood.ts, engine.ts; CoucouKit/MochiMood.swift on the
// Mac): the drops' flight, the stressed hops, and what each level does to him.

import { test } from "node:test";
import assert from "node:assert/strict";

const { BotEngine } = await import("../src/mochi/engine.ts");
const { CALM, dropAt, dropGone, heatWave, isCalm, nextHop, restingHop, throwDrop } = await import("../src/mochi/mood.ts");

// The engine's clock is performance.now(): step it by hand, one frame at a time.
let clock = 1_000_000;
performance.now = () => clock;
/** Runs `seconds` of frames at 60 fps, calling `each` after every frame. */
function run(engine, seconds, each = () => {}) {
  for (let i = 0; i < seconds * 60; i++) {
    clock += 1000 / 60;
    engine.update(1 / 60);
    each(engine);
  }
}

test("a drop rises, then falls past the floor and is gone", () => {
  const drop = throwDrop(10, 0, 0, () => 0.5);
  assert.ok(dropAt(drop, 0.1).y < drop.y, "it rises first");
  assert.ok(dropAt(drop, 0.1).vy < 0);
  assert.ok(dropAt(drop, 0.8).vy > 0, "then falls");
  assert.equal(dropGone(drop, 10.2), false);
  assert.equal(dropGone(drop, 11.7), true, "never more than 1.6 s");
});

test("a busy hop lands elsewhere on the floor; a barely busy one stays put", () => {
  let hop = restingHop();
  for (let i = 0; i < 50; i++) {
    const next = nextHop(hop, 1, i);
    assert.ok(Math.abs(next.to - hop.to) >= 0.12 && Math.abs(next.to) <= 0.28);
    hop = next;
  }
  assert.equal(nextHop(hop, 0.2, 0).to, 0);
});

test("three heat waves, each a 13-point line above the head", () => {
  const wave = heatWave(0, 1.234, 100, 100, 30, 26);
  assert.equal(wave.points.length, 13);
  assert.ok(wave.points.every(([, y]) => y < 100));
  assert.ok(wave.opacity >= 0 && wave.opacity <= 1);
});

test("a calm mood is calm", () => {
  assert.ok(isCalm(CALM));
  assert.ok(!isCalm({ ...CALM, tired: 0.7 }));
});

test("a busy processor: he sweats and hops, and keeps his frames going", () => {
  const engine = new BotEngine();
  engine.moodTarget = { ...CALM, busy: 1 };
  let moved = false;
  let drops = 0;
  run(engine, 3, (e) => {
    moved ||= Math.abs(e.ox) > 0.02;
    drops = Math.max(drops, e.moodDrops.length);
  });
  assert.ok(moved, "he hops sideways");
  assert.ok(drops > 0, "drops fly");
  assert.ok(engine.busy);

  // Calm again: the hops settle back to where he stood.
  engine.moodTarget = CALM;
  run(engine, 6);
  assert.ok(Math.abs(engine.ox) < 0.01);
  assert.equal(engine.moodDrops.length, 0);
});

test("asking for something wins: no sweat during a permission", () => {
  const engine = new BotEngine();
  engine.setState("approval");
  engine.moodTarget = { ...CALM, busy: 1, hot: 1 };
  run(engine, 2);
  assert.equal(engine.moodDrops.length, 0);
  assert.ok(engine.moodBusy < 0.01);
});

test("short memory puffs him up", () => {
  const calm = new BotEngine();
  const full = new BotEngine();
  full.moodTarget = { ...CALM, full: 1 };
  run(full, 3);
  calm.update(1 / 60);
  full.update(1 / 60);
  assert.ok(full.tgSx > calm.tgSx * 1.05, `${full.tgSx} vs ${calm.tgSx}`);
  assert.ok(full.tgSy < calm.tgSy);
});

test("tired: heavy eyes when idle, not at work; nearly empty: asleep", () => {
  const engine = new BotEngine();
  engine.moodTarget = { ...CALM, tired: 1 };
  run(engine, 3);
  assert.equal(engine.eyeOverride, "tired");
  engine.setState("working");
  run(engine, 3);
  assert.notEqual(engine.eyeOverride, "tired");

  const sleepy = new BotEngine();
  sleepy.moodTarget = { ...CALM, asleep: true };
  run(sleepy, 2);
  assert.equal(sleepy.eyeOverride, "closed");
});

test("the minis in the pills never feel the PC", () => {
  const mini = new BotEngine();
  mini.isMini = true;
  mini.moodTarget = { busy: 1, hot: 1, full: 1, tired: 1, asleep: false };
  run(mini, 2);
  assert.equal(mini.moodDrops.length, 0);
  assert.equal(mini.moodBusy, 0);
});

/** A canvas context that takes any call and counts fills and strokes. */
function fakeCanvas() {
  globalThis.Path2D ??= class { moveTo() {} lineTo() {} quadraticCurveTo() {} bezierCurveTo() {} closePath() {} ellipse() {} arc() {} rect() {} addPath() {} };
  const counts = { fill: 0, stroke: 0 };
  const ctx = new Proxy({}, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === "fill" || prop === "stroke") return () => counts[prop]++;
      return () => ({ addColorStop() {} });
    },
  });
  return { ctx, counts };
}

test("sweating, flushed and puffed up, he still draws, and the extras add to the picture", () => {
  const calm = new BotEngine();
  const moody = new BotEngine();
  moody.moodTarget = { busy: 1, hot: 1, full: 1, tired: 0, asleep: false };
  run(moody, 2);
  calm.update(1 / 60);
  assert.ok(moody.moodDrops.length > 0);
  const a = fakeCanvas();
  calm.draw(a.ctx, 120, 120);
  const b = fakeCanvas();
  moody.draw(b.ctx, 120, 120);
  assert.ok(b.counts.fill > a.counts.fill, "tint and drops");
  assert.ok(b.counts.stroke >= a.counts.stroke + 3, "three heat waves");
});
