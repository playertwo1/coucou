import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, test } from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const windowsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vite = await createServer({
  configFile: resolve(windowsRoot, "vite.config.ts"),
  root: windowsRoot,
  logLevel: "error",
  appType: "custom",
  server: { middlewareMode: true },
});
const { BotEngine, characterForAgent } = await vite.ssrLoadModule("/src/lumen/compass-engine.ts");
after(() => vite.close());

const states = ["idle", "working", "thinking", "searching", "approval", "question", "error", "finished", "ratelimit", "sleeping", "dizzy"];
const emotes = ["love", "surprised", "proud", "wink", "yawn", "happy", "annoyed"];
const agents = [
  ["integration_claude", "generic"], ["agent_codex", "codex"], ["ai_openai", "generic"],
  ["agent_antigravity", "generic"], ["agent_gemini", "generic"], ["agent_opencode", "generic"], ["unknown-agent", "generic"],
];

function canvasProbe() {
  let calls = 0;
  const target = {};
  const ctx = new Proxy(target, {
    get(object, key) {
      if (key in object) return object[key];
      if (typeof key === "string") return () => { calls++; };
      return undefined;
    },
    set(object, key, value) { object[key] = value; return true; },
  });
  return { ctx, calls: () => calls };
}

test("mapeia Codex e usa genérico como fallback nesta subetapa", () => {
  for (const [id, expected] of agents) assert.equal(characterForAgent(id), expected, id);
  assert.equal(characterForAgent(null), "generic");
});

test("desenha todos os estados para os sete ids de agente a 22/96 px e DPR 1/1,5/2", () => {
  for (const [id] of agents) {
    const engine = new BotEngine();
    assert.equal(engine.setAgent(id), characterForAgent(id));
    for (const state of states) {
      engine.setState(state, true);
      for (const size of [22, 96]) for (const dpr of [1, 1.5, 2]) {
        const { ctx, calls } = canvasProbe();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        engine.draw(ctx, size, size);
        assert.ok(calls() > 0, `${id}/${state}/${size}/${dpr} não desenhou`);
      }
    }
  }
});

test("desenha cada emote nos dois tamanhos sem erro", () => {
  const engine = new BotEngine();
  engine.setAgent("agent_codex");
  engine.blink();
  engine.update(0.05);
  engine.draw(canvasProbe().ctx, 96, 96);
  for (const emote of emotes) {
    engine.triggerEmote(emote);
    for (const size of [22, 96]) engine.draw(canvasProbe().ctx, size, size);
  }
});

test("mantém a pose idle fora do loop e respeita movimento reduzido", () => {
  const engine = new BotEngine();
  engine.setState("idle", true);
  assert.equal(engine.busy, false);
  engine.tgEs = 1.08;
  engine.update(1 / 60);
  assert.ok(engine.es > 1);

  const previousWindow = globalThis.window;
  globalThis.window = { matchMedia: () => ({ matches: true }) };
  try {
    engine.setDancing(true);
    engine.tgEs = 1.08;
    engine.update(0.1);
    assert.equal(engine.dancingLevel, 0);
    assert.equal(engine.es, 1.08);
    assert.equal(engine.busy, false);
    engine.setState("working", true);
    engine.draw(canvasProbe().ctx, 96, 96);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("engine não cria timers nem agenda um loop de quadros próprio", async () => {
  const source = await readFile(resolve(windowsRoot, "src/lumen/compass-engine.ts"), "utf8");
  assert.doesNotMatch(source, /requestAnimationFrame|setInterval|setTimeout/);
});
