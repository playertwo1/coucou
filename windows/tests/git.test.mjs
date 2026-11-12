import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { internals } from "./tauri.mjs";
import { installFakeDom } from "./fakedom.mjs";
import { State, DEFAULT_SETTINGS } from "../src/core/state.ts";
import { renderIntegrationCard } from "../src/views/integrations.ts";

installFakeDom();

const originalInvoke = internals.invoke;
afterEach(() => {
  internals.invoke = originalInvoke;
  State.tasks = [];
  State.focusId = null;
  State.lastWorkspaceSessionCwd = null;
  State.settings = { ...DEFAULT_SETTINGS };
});

test("Git card reads the last workspace project and renders its diff as text", async () => {
  const calls = [];
  internals.invoke = async (command, args) => {
    calls.push([command, args]);
    if (command === "git_status") {
      return {
        repository: true, root: "C:/projects/one", branch: "main", detached: false,
        upstream: "origin/main", ahead: 2, behind: 1,
        files: [{ path: "src/app.ts", status: " M" }],
      };
    }
    if (command === "git_diff") return { text: "<img src=x onerror=alert(1)>", truncated: false };
    return null;
  };

  State.os = "windows";
  State.settings = { ...DEFAULT_SETTINGS, activeIntegrations: ["integration_git"] };
  State.lastWorkspaceSessionCwd = "C:/projects/one";
  State.loadIntegrationTasks();
  const task = State.tasks.find((item) => item.id === "integration_git");
  const card = renderIntegrationCard(task, {
    detailOpen: true, openDetail() {}, closeDetail() {}, openSettings() {},
  });

  await new Promise(setImmediate);
  assert.match(card.textContent, /C:\/projects\/one/);
  assert.match(card.textContent, /main/);
  assert.match(card.textContent, /Ahead 2 · Behind 1/);
  assert.match(card.textContent, /src\/app\.ts/);
  assert.deepEqual(calls[0], ["git_status", { path: "C:/projects/one" }]);

  card.find("button").find((button) => button.textContent === "View diff").fire("click");
  await new Promise(setImmediate);
  assert.equal(card.querySelector(".git-diff").textContent, "<img src=x onerror=alert(1)>");
  assert.deepEqual(calls[1], ["git_diff", { path: "C:/projects/one" }]);
  assert.deepEqual(card.find("img"), []);
});

test("the compact Git card opens its details through the overview hook", async () => {
  internals.invoke = async () => ({
    repository: true, root: "C:/projects/one", branch: "main", detached: false,
    upstream: null, ahead: null, behind: null, files: [],
  });
  State.os = "windows";
  State.settings = { ...DEFAULT_SETTINGS, activeIntegrations: ["integration_git"] };
  State.lastWorkspaceSessionCwd = "C:/projects/one";
  State.loadIntegrationTasks();
  const task = State.tasks.find((item) => item.id === "integration_git");
  let opened = false;
  const card = renderIntegrationCard(task, {
    detailOpen: false, openDetail() { opened = true; }, closeDetail() {}, openSettings() {},
  });

  await new Promise(setImmediate);
  card.find("button").find((button) => button.textContent === "Details").fire("click");
  assert.equal(opened, true);
});

test("Refresh handles a repository removed during the session", async () => {
  let statusReads = 0;
  internals.invoke = async (command) => {
    if (command !== "git_status") return null;
    statusReads += 1;
    return statusReads === 1
      ? { repository: true, root: "C:/projects/one", branch: "main", detached: false, upstream: null, ahead: null, behind: null, files: [] }
      : { repository: false, root: null, branch: null, detached: false, upstream: null, ahead: null, behind: null, files: [] };
  };

  State.os = "windows";
  State.settings = { ...DEFAULT_SETTINGS, activeIntegrations: ["integration_git"] };
  State.lastWorkspaceSessionCwd = "C:/projects/one";
  State.loadIntegrationTasks();
  const task = State.tasks.find((item) => item.id === "integration_git");
  const card = renderIntegrationCard(task, {
    detailOpen: true, openDetail() {}, closeDetail() {}, openSettings() {},
  });

  await new Promise(setImmediate);
  const diffButton = card.find("button").find((button) => button.textContent === "View diff");
  assert.equal(diffButton.disabled, false);

  card.find("button").find((button) => button.textContent === "Refresh").fire("click");
  await new Promise(setImmediate);
  assert.match(card.textContent, /No Git repository found\./);
  assert.equal(diffButton.disabled, true);
  assert.equal(statusReads, 2);
});
