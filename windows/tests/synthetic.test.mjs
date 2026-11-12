import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createFixtures } from "../synthetic/fixtures.ts";
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

test("synthetic host contains no native IPC or production backend", () => {
  const native = readFileSync(new URL("../synthetic/host/src/main.rs", import.meta.url), "utf8");
  const manifest = readFileSync(new URL("../synthetic/host/Cargo.toml", import.meta.url), "utf8");
  assert.doesNotMatch(native, /with_ipc_handler|coucou_lib|pipe::|keyring|reqwest/);
  assert.doesNotMatch(manifest, /coucou_lib|keyring|reqwest|tauri-plugin/);
  assert.match(native, /connect-src 'none'/);
  assert.match(native, /WebContext::new\(Some\(profile\)\)/);
});
