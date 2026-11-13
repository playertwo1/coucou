import test from "node:test";
import assert from "node:assert/strict";
import { searchAgentHistory, syntheticAgentUsage } from "../src/core/agent-usage.ts";

test("synthetic agent usage is invented, grouped, and never turns unknown cost into zero", () => {
  const usage = syntheticAgentUsage();
  assert.deepEqual(usage.daily.map((item) => item.tokens), [80, 150]);
  assert.deepEqual(usage.projects.map((item) => item.tokens), [150, 80]);
  assert.equal(usage.sessions.reduce((total, item) => total + item.tokens, 0), 230);
  assert.equal(usage.costUsd, null);
  assert.ok(usage.sessions.every((session) => session.costUsd === null));
  assert.deepEqual(usage.projects.map((item) => item.project), ["Jardim", "Oficina"]);
  assert.deepEqual(usage.history.map((item) => item.sessionId), ["synthetic-session-garden", "synthetic-session-workshop"]);
  assert.equal(JSON.stringify(usage).includes("prompt"), false);
  assert.equal(JSON.stringify(usage).includes("C:\\Users"), false);
});

test("session history search matches only project, Codex and UTC date metadata", () => {
  const history = syntheticAgentUsage().history;
  assert.deepEqual(searchAgentHistory(history, "Jardim").map((item) => item.project), ["Jardim"]);
  assert.deepEqual(searchAgentHistory(history, "2026-11-12").map((item) => item.project), ["Oficina"]);
  assert.equal(searchAgentHistory(history, "Codex").length, 2);
  assert.deepEqual(searchAgentHistory(history, "private synthetic prompt"), []);
  assert.equal(searchAgentHistory(history, "  ").length, 2);
});
