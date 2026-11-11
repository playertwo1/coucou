import { test } from "node:test";
import assert from "node:assert/strict";

const { CALM } = await import("../src/mochi/mood.ts");
const { moodFromVitals, describeVitals, isVitalsHover, pluggedInWhileLow, shouldReadVitals } = await import("../src/mochi/vitals.ts");
const { DEFAULT_SETTINGS } = await import("../src/core/state.ts");

const reading = (changes = {}) => ({
  cpu: null,
  memoryLoad: null,
  battery: null,
  top: [],
  temperature: null,
  idleSeconds: null,
  ...changes,
});

test("busy needs two consecutive readings at 80 percent and scales from 60 percent", () => {
  let result = moodFromVitals(reading({ cpu: 0.8 }), 0);
  assert.equal(result.busySamples, 1);
  assert.deepEqual(result.mood, CALM);

  result = moodFromVitals(reading({ cpu: 0.8 }), result.busySamples);
  assert.ok(Math.abs(result.mood.busy - 2 / 3) < 1e-12);
  assert.equal(moodFromVitals(reading({ cpu: 0.6 }), result.busySamples).busySamples, 0);
  assert.equal(moodFromVitals(reading({ cpu: 1 }), 1).mood.busy, 1);
});

test("vitals are read only when enabled and Mochi is visible", () => {
  assert.equal(shouldReadVitals(true, "hidden", false), false);
  assert.equal(shouldReadVitals(true, "compact", false), true);
  assert.equal(shouldReadVitals(true, "hidden", true), true);
  assert.equal(shouldReadVitals(false, "expanded", true), false);
});

test("the hover summary follows compact-island and expanded-Mochi hover", () => {
  assert.equal(isVitalsHover("compact", true, false), true);
  assert.equal(isVitalsHover("expanded", true, false), false);
  assert.equal(isVitalsHover("expanded", false, true), true);
  assert.equal(isVitalsHover("hidden", true, false), false);
});

test("PC reactions default on and charging wakes a tired Mochi", () => {
  assert.equal(DEFAULT_SETTINGS.mochiReactsToPc, true);
  assert.equal(pluggedInWhileLow({ percent: 19, onPower: false }, { percent: 19, onPower: true }), true);
  assert.equal(pluggedInWhileLow({ percent: 20, onPower: false }, { percent: 20, onPower: true }), false);
  assert.equal(pluggedInWhileLow({ percent: 9, onPower: false }, { percent: 9, onPower: false }), false);
});

test("temperature and memory use the Mac thresholds", () => {
  assert.equal(moodFromVitals(reading({ temperature: 80 }), 0).mood.hot, 0.4);
  assert.equal(moodFromVitals(reading({ temperature: 90 }), 0).mood.hot, 0.8);
  assert.equal(moodFromVitals(reading({ temperature: 95 }), 0).mood.hot, 1);
  assert.equal(moodFromVitals(reading({ memoryLoad: 90 }), 0).mood.full, 0.6);
  assert.equal(moodFromVitals(reading({ memoryLoad: 97 }), 0).mood.full, 1);
});

test("low battery makes Mochi tired or asleep only off power", () => {
  const low = moodFromVitals(reading({ battery: { percent: 19, onPower: false } }), 0).mood;
  assert.equal(low.tired, 1);
  assert.equal(low.asleep, false);
  assert.equal(moodFromVitals(reading({ battery: { percent: 9, onPower: false } }), 0).mood.asleep, true);
  assert.deepEqual(moodFromVitals(reading({ battery: { percent: 9, onPower: true } }), 0).mood, CALM);
});

test("the hover summary has at most two translated parts and two process names", () => {
  const result = moodFromVitals(reading({
    cpu: 0.94,
    temperature: 91,
    memoryLoad: 98,
    battery: { percent: 14, onPower: false },
    top: ["node", "Chrome", "ignored.exe"],
  }), 1);
  assert.equal(describeVitals(reading({
    cpu: 0.94,
    temperature: 91,
    memoryLoad: 98,
    battery: { percent: 14, onPower: false },
    top: ["node", "Chrome", "ignored.exe"],
  }), result.mood), "CPU 94 % · node, Chrome · Your PC is hot");
});
