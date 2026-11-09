// Meeting mode: while the Notetaker records, Mochi listens along and only requests make a sound.

import { test } from "node:test";
import assert from "node:assert/strict";
import { installFakeDom } from "./fakedom.mjs";
import { State } from "../src/core/state.ts";
import { Sound } from "../src/core/sound.ts";

installFakeDom();

test("an idle Mochi listens along during a recording, a waiting card still wins", () => {
  State.stateOverride = null;
  State.meeting = false;
  assert.equal(State.effectiveState, "idle");
  State.meeting = true;
  assert.equal(State.effectiveState, "thinking");
  State.stateOverride = "approval";
  assert.equal(State.effectiveState, "approval");
  State.stateOverride = null;
  State.meeting = false;
});

test("quiet lets only the approval and the question sounds through", () => {
  const played = [];
  const buffers = new Map([["work", 1], ["approval", 1], ["question", 1], ["finish", 1]]);
  Sound.buffers = buffers;
  Sound.ctx = { state: "running", createBufferSource() { played.push("x"); throw new Error("stop"); } };
  Sound.master = {};
  Sound.enabled = true;
  Sound.quiet = true;
  const tries = (name) => {
    played.length = 0;
    try { Sound.play(name); } catch { /* reached the source: it would have sounded */ }
    return played.length > 0;
  };
  assert.equal(tries("work"), false);
  assert.equal(tries("finish"), false);
  assert.equal(tries("approval"), true);
  assert.equal(tries("question"), true);
  Sound.quiet = false;
  assert.equal(tries("work"), true);
});
