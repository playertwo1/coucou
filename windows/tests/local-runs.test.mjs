import { test } from "node:test";
import assert from "node:assert/strict";
import { createLocalRunWatcher } from "../src/island/local-runs.ts";

const pre = (tool_use_id, label, cwd, extra = {}) => ({
  hook_event_name: "PreToolUse", tool_name: "Bash", session_id: "s1", tool_use_id, cwd,
  tool_input: { command: label }, ...extra,
});
const post = (tool_use_id, status, extra = {}) => ({
  hook_event_name: "PostToolUse", tool_name: "Bash", session_id: "s1", tool_use_id,
  coucou_run_status: status, ...extra,
});

test("interleaved runs stay attached to their original projects and duplicate completion is ignored", () => {
  const watcher = createLocalRunWatcher(() => 100);
  assert.equal(watcher.observe(pre("a", "npm test", "C:\\repos\\alpha")), null);
  assert.equal(watcher.observe(pre("b", "cargo build", "C:\\repos\\beta")), null);
  assert.equal(watcher.pendingCount(), 2);

  assert.deepEqual(watcher.observe(post("b", 1, { cwd: "C:\\repos\\moved" })), {
    label: "cargo build", cwd: "C:\\repos\\beta", started: 100, status: 1,
  });
  assert.deepEqual(watcher.observe(post("a", 0)), {
    label: "npm test", cwd: "C:\\repos\\alpha", started: 100, status: 0,
  });
  assert.equal(watcher.observe(post("a", 0)), null);
  assert.equal(watcher.pendingCount(), 0);
});

test("only simple supported shell commands with a cwd and stable call ID are observed", () => {
  const watcher = createLocalRunWatcher();
  for (const payload of [
    pre("1", "npm test && cargo build", "C:\\repo"),
    pre("1b", "npm\ntest", "C:\\repo"),
    pre("2", "cargo build --release", "C:\\repo"),
    pre(undefined, "npm test", "C:\\repo"),
    pre("4", "npm test", ""),
    { ...pre("5", "npm test", "C:\\repo"), tool_name: "Read" },
  ]) assert.equal(watcher.observe(payload), null);
  assert.equal(watcher.pendingCount(), 0);
});

test("unknown, failed, and cancelled outcomes never become passed", () => {
  const watcher = createLocalRunWatcher();
  watcher.observe(pre("unknown", "npm test", "C:\\repo"));
  assert.equal(watcher.observe(post("unknown", 3))?.status, 3);

  watcher.observe(pre("cancel", "cargo build", "C:\\repo"));
  assert.equal(watcher.observe({ ...post("cancel", 2), hook_event_name: "PostToolUseFailure" })?.status, 2);

  watcher.observe(pre("failed", "npm test", "C:\\repo"));
  assert.equal(watcher.observe(post("failed", 1))?.status, 1);
});

test("stale pending calls expire without inventing a result", () => {
  let time = 0;
  const watcher = createLocalRunWatcher(() => time);
  watcher.observe(pre("old", "npm test", "C:\\repo"));
  time = 30 * 60 * 1000 + 1;
  assert.equal(watcher.observe(post("old", 0)), null);
  assert.equal(watcher.pendingCount(), 0);
});
