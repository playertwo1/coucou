import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createFixtures } from "../synthetic/fixtures.ts";
import { applySyntheticFullscreenVisibility, coveringSyntheticMonitors, shouldShowSyntheticIsland, syncSyntheticFullscreenVisibility } from "../synthetic/fullscreen.ts";
import { installIsolation } from "../synthetic/isolation.ts";

test("clipboard and file drops stay in synthetic memory", async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const originalWindow = globalThis.window;
  let nativeReads = 0;
  const fakeNavigator = { get clipboard() { nativeReads++; throw new Error("native clipboard touched"); } };
  const handlers = new Map();
  const fakeWindow = { addEventListener: (name, handler) => handlers.set(name, handler), open: () => ({}) };
  Object.defineProperty(globalThis, "navigator", { value: fakeNavigator, configurable: true });
  globalThis.window = fakeWindow;
  try {
    installIsolation();
    await fakeNavigator.clipboard.writeText("fixture");
    assert.equal(await fakeNavigator.clipboard.readText(), "fixture");
    assert.equal(nativeReads, 0);
    assert.equal(fakeWindow.open("https://example.com"), null);
    for (const handler of handlers.values()) {
      let blocked = 0;
      handler({ preventDefault: () => blocked++, stopImmediatePropagation: () => blocked++ });
      assert.equal(blocked, 2);
    }
  } finally {
    globalThis.window = originalWindow;
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
    else delete globalThis.navigator;
  }
});

test("preview commands have no fallback to the native backend", async () => {
  const originalWindow = globalThis.window;
  const fakeWindow = { __answers: { vitals_read: createFixtures().vitals } };
  globalThis.window = fakeWindow;
  try {
    await import("../dev/tauri-mock.ts");
    for (const command of ["hooks_preview", "config_file_save", "chat_send", "open_url", "capture_begin", "secrets_read"]) {
      assert.equal(await fakeWindow.__TAURI_INTERNALS__.invoke(command, {}), null);
    }
    assert.equal((await fakeWindow.__TAURI_INTERNALS__.invoke("vitals_read", {})).memoryLoad, 42);
  } finally {
    globalThis.window = originalWindow;
  }
});

test("synthetic requests consume only their own pending decision once", () => {
  const fixture = createFixtures();
  const first = fixture.permission();
  const second = fixture.permission();
  assert.ok(first.cwd.startsWith("synthetic://"));
  assert.equal(fixture.decide({ requestId: "real-request", decision: "allow" }), false);
  assert.equal(fixture.decide({ requestId: first.request_id, decision: "always" }), false);
  assert.equal(fixture.decide({ requestId: first.request_id, decision: "allow" }), true);
  assert.equal(fixture.decide({ requestId: first.request_id, decision: "deny" }), false);
  assert.equal(fixture.decide({ requestId: second.request_id, decision: "deny" }), true);
  assert.deepEqual(fixture.decisions.map((d) => d.decision), ["allow", "deny"]);
  assert.deepEqual(createFixtures().decisions, []);
});

test("synthetic toast is issued only for a pending permission while the island is hidden", () => {
  const fixture = createFixtures("run-a");
  const request = fixture.permission("session-a", 1_000, 60_000);
  assert.equal(fixture.createPermissionToast(request.request_id, { islandVisible: true, now: 1_000 }), null);
  assert.equal(fixture.createPermissionToast(request.request_id, { islandVisible: false, kind: "question", now: 1_000 }), null);
  assert.equal(fixture.createPermissionToast("forged-request", { islandVisible: false, now: 1_000 }), null);

  const token = fixture.createPermissionToast(request.request_id, { islandVisible: false, now: 1_000 });
  assert.ok(token);
  assert.equal(token.includes(request.request_id), false);
  assert.equal(fixture.toastExpiry(token), 31_000);
});

test("synthetic Allow opens the exact card for review and Deny decides only its request", () => {
  const fixture = createFixtures("run-a");
  const first = fixture.permission("session-a", 1_000);
  const second = fixture.permission("session-b", 1_000);
  const firstToast = fixture.createPermissionToast(first.request_id, { islandVisible: false, now: 1_000 });
  const secondToast = fixture.createPermissionToast(second.request_id, { islandVisible: false, now: 1_000 });

  assert.equal(fixture.activatePermissionToast(secondToast, "allow", 1_001), "opened");
  assert.equal(fixture.activatePermissionToast(firstToast, "deny", 1_002), "denied");
  assert.equal(fixture.activatePermissionToast(secondToast, "deny", 1_003), "invalid");
  assert.deepEqual(fixture.openedFromToast, [second.request_id]);
  assert.deepEqual(fixture.decisions, [{ requestId: first.request_id, decision: "deny" }]);
});

test("opening, closing or timing out a synthetic toast never decides", () => {
  const fixture = createFixtures("run-a");
  const opened = fixture.permission("session-open", 1_000);
  const dismissed = fixture.permission("session-dismiss", 1_000);
  const timedOut = fixture.permission("session-timeout", 1_000);
  const openToast = fixture.createPermissionToast(opened.request_id, { islandVisible: false, now: 1_000 });
  const dismissToast = fixture.createPermissionToast(dismissed.request_id, { islandVisible: false, now: 1_000 });
  const timeoutToast = fixture.createPermissionToast(timedOut.request_id, { islandVisible: false, now: 1_000 });

  assert.equal(fixture.activatePermissionToast(openToast, "open", 1_001), "opened");
  assert.equal(fixture.activatePermissionToast(dismissToast, "close", 1_001), "dismissed");
  assert.equal(fixture.activatePermissionToast(timeoutToast, "timeout", 1_001), "expired");
  assert.deepEqual(fixture.openedFromToast, [opened.request_id]);
  assert.deepEqual(fixture.decisions, []);
  assert.equal(fixture.decide({ requestId: opened.request_id, decision: "allow", now: 1_002 }), true);
  assert.equal(fixture.decide({ requestId: dismissed.request_id, decision: "deny", now: 1_002 }), true);
  assert.equal(fixture.decide({ requestId: timedOut.request_id, decision: "deny", now: 1_002 }), true);
});

test("synthetic toast expiry is capped by the request deadline and never decides", () => {
  const fixture = createFixtures("run-a");
  const request = fixture.permission("session-request-expiry", 1_000, 5_000);
  const cappedToast = fixture.createPermissionToast(request.request_id, { islandVisible: false, now: 1_000 });
  assert.equal(fixture.toastExpiry(cappedToast), 6_000);
  assert.equal(fixture.activatePermissionToast(cappedToast, "allow", 6_000), "expired");
  assert.deepEqual(fixture.decisions, []);
  assert.equal(fixture.decide({ requestId: request.request_id, decision: "deny", now: 6_000 }), false);

  const later = fixture.permission("session-toast-expiry", 1_000, 60_000);
  const shortToast = fixture.createPermissionToast(later.request_id, { islandVisible: false, now: 1_000 });
  assert.equal(fixture.toastExpiry(shortToast), 31_000);
  assert.equal(fixture.activatePermissionToast(shortToast, "allow", 31_000), "expired");
  assert.deepEqual(fixture.decisions, []);
  assert.equal(fixture.decide({ requestId: later.request_id, decision: "deny", now: 31_001 }), true);
});

test("card decisions and another synthetic app run invalidate old toast tokens", () => {
  const firstRun = createFixtures("run-a");
  const request = firstRun.permission("session-race", 1_000);
  const token = firstRun.createPermissionToast(request.request_id, { islandVisible: false, now: 1_000 });
  assert.equal(firstRun.decide({ requestId: request.request_id, decision: "allow", now: 1_001 }), true);
  assert.equal(firstRun.activatePermissionToast(token, "deny", 1_002), "invalid");
  assert.equal(firstRun.decisions.length, 1);

  const nextRun = createFixtures("run-b");
  const nextRequest = nextRun.permission("session-next", 1_000);
  const nextToken = nextRun.createPermissionToast(nextRequest.request_id, { islandVisible: false, now: 1_000 });
  assert.notEqual(token, nextToken);
  assert.equal(nextRun.activatePermissionToast(token, "allow", 1_001), "invalid");
  assert.deepEqual(nextRun.decisions, []);
});

test("synthetic Git status and diff read only the invented Jardim fixture", () => {
  const fixture = createFixtures();
  const status = fixture.gitStatus("synthetic://Jardim");
  assert.equal(status.repository, true);
  assert.equal(status.root, "synthetic://Jardim");
  assert.deepEqual(status.files.map((file) => file.path), ["src/garden.ts", "notes/new-seed.txt"]);
  assert.deepEqual(fixture.gitDiff("synthetic://Jardim"), {
    text: "diff --git a/src/garden.ts b/src/garden.ts\n@@ -1 +1 @@\n-old garden\n+synthetic garden\n",
    truncated: false,
  });
  assert.equal(fixture.gitStatus("C:/Users/owner/private").repository, false);
  assert.equal(fixture.gitDiff("C:/Users/owner/private"), null);
  assert.deepEqual(fixture.gitStatusReads, ["synthetic://Jardim", "C:/Users/owner/private"]);
  assert.deepEqual(fixture.gitDiffReads, ["synthetic://Jardim", "C:/Users/owner/private"]);
});

test("synthetic host contains no native IPC or production backend", () => {
  const native = readFileSync(new URL("../synthetic/host/src/main.rs", import.meta.url), "utf8");
  const manifest = readFileSync(new URL("../synthetic/host/Cargo.toml", import.meta.url), "utf8");
  assert.doesNotMatch(native, /with_ipc_handler|coucou_lib|pipe::|keyring|reqwest/);
  assert.doesNotMatch(manifest, /coucou_lib|keyring|reqwest|tauri-plugin/);
  assert.match(native, /connect-src 'none'/);
  assert.match(native, /WebContext::new\(Some\(profile\)\)/);
});

test("synthetic fullscreen recognizes a window that covers monitor bounds, including negative origins", () => {
  const monitors = [
    { id: "left", bounds: { x: -1920, y: 0, width: 1920, height: 1080 } },
    { id: "right", bounds: { x: 0, y: -200, width: 2560, height: 1440 } },
  ];
  const spansBoth = {
    id: "fixture-game", kind: "application", visible: true, minimized: false,
    bounds: { x: -1920, y: -200, width: 4480, height: 1440 },
  };
  assert.deepEqual(coveringSyntheticMonitors(spansBoth, monitors), ["left", "right"]);
  assert.deepEqual(coveringSyntheticMonitors({ ...spansBoth, bounds: { x: -1919, y: 0, width: 1919, height: 1080 } }, monitors), []);
});

test("synthetic fullscreen ignores desktop, taskbar, Coucou, hidden, and minimized windows", () => {
  const monitor = { id: "display", bounds: { x: 0, y: 0, width: 1920, height: 1080 } };
  const base = { visible: true, minimized: false, bounds: monitor.bounds };
  for (const kind of ["desktop", "taskbar", "coucou"]) {
    assert.deepEqual(coveringSyntheticMonitors({ ...base, id: kind, kind }, [monitor]), []);
  }
  assert.deepEqual(coveringSyntheticMonitors({ ...base, id: "hidden", kind: "application", visible: false }, [monitor]), []);
  assert.deepEqual(coveringSyntheticMonitors({ ...base, id: "minimized", kind: "application", minimized: true }, [monitor]), []);
  assert.deepEqual(coveringSyntheticMonitors({ ...base, id: "small", kind: "application", bounds: { x: 0, y: 0, width: 1919, height: 1080 } }, [monitor]), []);
});

test("synthetic fullscreen rejects invalid and overflowing rectangles", () => {
  const monitor = { id: "display", bounds: { x: 0, y: 0, width: 1920, height: 1080 } };
  const base = { id: "fixture-app", kind: "application", visible: true, minimized: false };
  for (const bounds of [
    { x: 0, y: 0, width: 0, height: 1080 },
    { x: 0, y: 0, width: 1920, height: -1 },
    { x: Number.NaN, y: 0, width: 1920, height: 1080 },
    { x: Number.MAX_VALUE, y: 0, width: Number.MAX_VALUE, height: 1080 },
  ]) {
    assert.deepEqual(coveringSyntheticMonitors({ ...base, bounds }, [monitor]), []);
  }
  assert.deepEqual(coveringSyntheticMonitors({ ...base, bounds: monitor.bounds }, [{ id: "bad", bounds: { x: 0, y: 0, width: Infinity, height: 1080 } }]), []);
});

test("synthetic fullscreen hides ordinary island events but keeps a pending card visible", () => {
  const sequence = [
    { fullscreen: false, pending: false, visible: true },
    { fullscreen: true, pending: false, visible: false },
    { fullscreen: true, pending: true, visible: true },
    { fullscreen: true, pending: false, visible: false },
    { fullscreen: false, pending: false, visible: true },
  ];
  for (const state of sequence) {
    assert.equal(shouldShowSyntheticIsland(state.fullscreen, state.pending), state.visible);
  }
});

test("a synthetic permission fixture keeps its card visible during fullscreen only while pending", () => {
  const fixture = createFixtures();
  const request = fixture.permission("synthetic-fullscreen-session", 1_000);
  const classes = new Set();
  const root = {
    classList: { toggle(name, on) { if (on) classes.add(name); else classes.delete(name); } },
    setAttribute() {},
    inert: false,
  };

  assert.equal(fixture.hasPending(request.request_id), true);
  assert.equal(syncSyntheticFullscreenVisibility(root, true, fixture.fullscreen.window, [fixture.fullscreen.monitor], fixture.hasPending(request.request_id)), true);
  assert.equal(classes.has("synthetic-fullscreen-hidden"), false);

  assert.equal(fixture.decide({ requestId: request.request_id, decision: "deny", now: 1_001 }), true);
  assert.equal(fixture.hasPending(request.request_id), false);
  assert.equal(syncSyntheticFullscreenVisibility(root, true, fixture.fullscreen.window, [fixture.fullscreen.monitor], fixture.hasPending(request.request_id)), false);
  assert.equal(classes.has("synthetic-fullscreen-hidden"), true);
  assert.deepEqual(fixture.decisions, [{ requestId: request.request_id, decision: "deny" }]);
});

test("synthetic fullscreen visibility is accessible and does not change saved settings", () => {
  const classes = new Set();
  const attributes = new Map();
  const root = {
    classList: { toggle(name, on) { if (on) classes.add(name); else classes.delete(name); } },
    setAttribute(name, value) { attributes.set(name, value); },
    inert: false,
  };
  const settings = { screen: "primary", islandCorner: "top", language: "pt-BR" };
  const before = structuredClone(settings);

  assert.equal(applySyntheticFullscreenVisibility(root, true, false), false);
  assert.equal(classes.has("synthetic-fullscreen-hidden"), true);
  assert.equal(attributes.get("aria-hidden"), "true");
  assert.equal(root.inert, true);

  assert.equal(applySyntheticFullscreenVisibility(root, true, true), true);
  assert.equal(classes.has("synthetic-fullscreen-hidden"), false);
  assert.equal(attributes.get("aria-hidden"), "false");
  assert.equal(root.inert, false);
  assert.deepEqual(settings, before);
});
