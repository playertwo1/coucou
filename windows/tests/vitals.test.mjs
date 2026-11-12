import { test } from "node:test";
import assert from "node:assert/strict";

const { CALM } = await import("../src/mochi/mood.ts");
const { moodFromVitals, heatFromZones, describeVitals, isVitalsHover, pluggedInWhileLow, shouldReadVitals } = await import("../src/mochi/vitals.ts");
const { DEFAULT_SETTINGS } = await import("../src/core/state.ts");

const reading = (changes = {}) => ({
  cpu: null,
  memoryLoad: null,
  battery: null,
  top: [],
  zones: [],
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

const zone = (celsius, passiveLimit = 100, throttleReasons = 0) => ({ celsius, passiveLimit, throttleReasons });

test("heat follows the thermal zone, not a CPU-package scale", () => {
  assert.deepEqual(heatFromZones([], 0.1, null), { hot: 0, baseline: null });
  assert.deepEqual(heatFromZones([zone(41)], null, null), { hot: 0, baseline: null });
  assert.deepEqual(heatFromZones([zone(41)], 0.2, null), { hot: 0, baseline: null });

  const rest = heatFromZones([zone(41)], 0.19, null);
  assert.deepEqual(rest, { hot: 0, baseline: 41 });
  assert.deepEqual(heatFromZones([zone(48.9)], 0.9, rest.baseline), { hot: 0, baseline: 41 });
  assert.deepEqual(heatFromZones([zone(49)], 0.9, rest.baseline), { hot: 0.4, baseline: 41 });

  const cooler = heatFromZones([zone(36), zone(40)], 0.1, rest.baseline);
  assert.equal(cooler.baseline, 40);
  assert.equal(cooler.hot, 0);

  assert.equal(heatFromZones([zone(42, 99)], 0.9, null).hot, 1);
  assert.equal(heatFromZones([zone(42, 100, 0x1)], 0.9, null).hot, 1);
  assert.equal(heatFromZones([zone(42, 100, 0x2)], 0.9, null).hot, 0);
  assert.equal(heatFromZones([zone(30, 100), zone(36, 80)], 0.9, null).hot, 1);

  assert.equal(moodFromVitals(reading({ memoryLoad: 90 }), 0).mood.full, 0.6);
  assert.equal(moodFromVitals(reading({ memoryLoad: 97 }), 0).mood.full, 1);
});

test("work sleepiness and a low battery take the greater tiredness, and sleep stays on the battery", () => {
  const off = { percent: 9, onPower: false };
  const low = moodFromVitals(reading({ battery: off }), 0, null, 0.7).mood;
  assert.equal(low.tired, 1);
  assert.equal(low.asleep, true);
  const hours = moodFromVitals(reading(), 0, null, 0.7).mood;
  assert.equal(hours.tired, 0.7);
  assert.equal(hours.asleep, false);
  const plugged = moodFromVitals(reading({ battery: { percent: 9, onPower: true } }), 0, null, 1).mood;
  assert.equal(plugged.tired, 1);
  assert.equal(plugged.asleep, false);
});

test("low battery makes Mochi tired or asleep only off power", () => {
  const low = moodFromVitals(reading({ battery: { percent: 19, onPower: false } }), 0).mood;
  assert.equal(low.tired, 1);
  assert.equal(low.asleep, false);
  assert.equal(moodFromVitals(reading({ battery: { percent: 9, onPower: false } }), 0).mood.asleep, true);
  assert.deepEqual(moodFromVitals(reading({ battery: { percent: 9, onPower: true } }), 0).mood, CALM);
});

test("the hover summary has at most two translated parts and two process names", () => {
  const hot = reading({
    cpu: 0.94,
    zones: [zone(53, 50)],
    memoryLoad: 98,
    battery: { percent: 14, onPower: false },
    top: ["node", "Chrome", "ignored.exe"],
  });
  const result = moodFromVitals(hot, 1);
  assert.equal(result.mood.hot, 1);
  assert.equal(describeVitals(hot, result.mood), "CPU 94 % · node, Chrome · Your PC is hot");
  const warm = heatFromZones([zone(49)], 0.5, 41);
  assert.equal(describeVitals(reading({ cpu: 0.1 }), { ...CALM, hot: warm.hot }), "Your PC is warm");
});
