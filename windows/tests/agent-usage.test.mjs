import test from "node:test";
import assert from "node:assert/strict";
import { syntheticAgentUsage } from "../src/core/agent-usage.ts";

test("synthetic agent usage is invented, grouped, and never turns unknown cost into zero", () => {
  const usage = syntheticAgentUsage();
  assert.deepEqual(usage.daily.map((item) => item.tokens), [80, 150]);
  assert.deepEqual(usage.projects.map((item) => item.tokens), [150, 80]);
  assert.equal(usage.sessions.reduce((total, item) => total + item.tokens, 0), 230);
  assert.equal(usage.costUsd, null);
  assert.ok(usage.sessions.every((session) => session.costUsd === null));
  assert.deepEqual(usage.projects.map((item) => item.project), ["Jardim", "Oficina"]);
  assert.equal(JSON.stringify(usage).includes("prompt"), false);
  assert.equal(JSON.stringify(usage).includes("C:\\Users"), false);
});
