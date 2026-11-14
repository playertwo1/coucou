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
  ["integration_claude", "claude"],
  ["claude", "claude"],
  ["agent_codex", "codex"],
  ["codex", "codex"],
  ["ai_openai", "chatgpt"],
  ["openai", "chatgpt"],
  ["agent_antigravity", "antigravity"],
  ["antigravity", "antigravity"],
  ["agent_gemini", "gemini"],
  ["gemini", "gemini"],
  ["agent_opencode", "opencode"],
  ["opencode", "opencode"],
  ["agent_cursor", "generic"],
  ["unknown-agent", "generic"],
];

function canvasProbe() {
  const ops = [];
  const target = {};
  const ctx = new Proxy(target, {
    get(object, key) {
      if (key in object) return object[key];
      if (typeof key === "string") {
        return (...args) => {
          ops.push({ op: key, args });
        };
      }
      return undefined;
    },
    set(object, key, value) { object[key] = value; return true; },
  });
  return { ctx, ops, calls: () => ops.length };
}

test("mapeia os sete personagens pelos IDs reais e usa genérico como fallback", () => {
  for (const [id, expected] of agents) assert.equal(characterForAgent(id), expected, id);
  assert.equal(characterForAgent(null), "generic");
  assert.equal(characterForAgent(undefined), "generic");
});

test("desenha todos os estados para os sete personagens a 22/96 px e DPR 1/1,5/2", () => {
  const canonicalIds = ["integration_claude", "agent_codex", "ai_openai", "agent_antigravity", "agent_gemini", "agent_opencode", "unknown-agent"];
  for (const id of canonicalIds) {
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

test("desenha cada emote nos dois tamanhos sem erro para todos os personagens", () => {
  for (const id of ["integration_claude", "agent_codex", "ai_openai", "agent_antigravity", "agent_gemini", "agent_opencode", "unknown-agent"]) {
    const engine = new BotEngine();
    engine.setAgent(id);
    engine.blink();
    engine.update(0.05);
    engine.draw(canvasProbe().ctx, 96, 96);
    for (const emote of emotes) {
      engine.triggerEmote(emote);
      for (const size of [22, 96]) engine.draw(canvasProbe().ctx, size, size);
    }
  }
});

test("searching varre os olhos horizontalmente na pose de pensar; ratelimit e dizzy mantêm poses próprias", () => {
  const searchEngine = new BotEngine();
  searchEngine.setAgent("integration_claude");
  searchEngine.setState("searching", true);
  assert.equal(searchEngine.busy, true);
  const p0 = canvasProbe();
  searchEngine.draw(p0.ctx, 96, 96);
  for (let i = 0; i < 12; i++) searchEngine.update(0.1);
  const p1 = canvasProbe();
  searchEngine.draw(p1.ctx, 96, 96);
  const x0 = p0.ops.find((o) => o.op === "ellipse")?.args[0];
  const x1 = p1.ops.find((o) => o.op === "ellipse")?.args[0];
  assert.ok(typeof x0 === "number" && typeof x1 === "number" && Math.abs(x1 - x0) > 1, "olhos de searching devem varrer");

  const rateEngine = new BotEngine();
  rateEngine.setAgent("agent_opencode");
  rateEngine.setState("ratelimit", true);
  const rateProbe = canvasProbe();
  rateEngine.draw(rateProbe.ctx, 96, 96);
  // Olhos cansados desenham elipses (diferente de sleeping que fecha em curvas).
  assert.ok(rateProbe.ops.some((o) => o.op === "ellipse"), "ratelimit deve desenhar olhos cansados, não dormindo");
  assert.ok(rateProbe.ops.some((o) => o.op === "quadraticCurveTo" && o.args[2] === 81 && o.args[3] === 29), "ratelimit deve desenhar gota de suor");

  const dizzyEngine = new BotEngine();
  dizzyEngine.setAgent("agent_gemini");
  dizzyEngine.setState("dizzy", true);
  assert.equal(dizzyEngine.busy, true);
  const d0 = canvasProbe();
  dizzyEngine.draw(d0.ctx, 96, 96);
  for (let i = 0; i < 6; i++) dizzyEngine.update(0.1);
  const d1 = canvasProbe();
  dizzyEngine.draw(d1.ctx, 96, 96);
  const rot0 = d0.ops.find((o) => o.op === "rotate")?.args[0];
  const rot1 = d1.ops.find((o) => o.op === "rotate")?.args[0];
  assert.ok(typeof rot0 === "number" && typeof rot1 === "number" && rot0 !== rot1, "dizzy deve balançar suavemente");
  // Dizzy nunca desenha boca redonda "o" (ellipse com rx=3.5, ry=4.5).
  assert.ok(!d0.ops.some((o) => o.op === "ellipse" && o.args[2] === 3.5 && o.args[3] === 4.5), "dizzy não pode usar boca de pergunta");
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

    engine.setState("searching", true);
    assert.equal(engine.busy, false);
    const s0 = canvasProbe();
    engine.draw(s0.ctx, 96, 96);
    engine.update(0.5);
    const s1 = canvasProbe();
    engine.draw(s1.ctx, 96, 96);
    assert.equal(s0.ops.find((o) => o.op === "ellipse")?.args[0], s1.ops.find((o) => o.op === "ellipse")?.args[0]);

    engine.setState("dizzy", true);
    assert.equal(engine.busy, false);
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
