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
          if (key === "createRadialGradient" || key === "createLinearGradient") return { addColorStop() {} };
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
  // Olhos cansados desenham elipses (diferente de sleeping que fecha em curvas) e várias gotas na cabeça.
  assert.ok(rateProbe.ops.some((o) => o.op === "ellipse"), "ratelimit deve desenhar olhos cansados, não dormindo");
  const sweatTips = new Set(
    rateProbe.ops
      .filter((o) => o.op === "quadraticCurveTo" && [24, 34, 65, 81].includes(o.args[2]))
      .map((o) => o.args[2]),
  );
  assert.equal(sweatTips.size, 4, "ratelimit deve desenhar várias gotas de suor na cabeça");

  const checkOp = (state, fn) => {
    const e = new BotEngine();
    e.setAgent("integration_claude");
    e.setState(state, true);
    const probe = canvasProbe();
    e.draw(probe.ctx, 96, 96);
    assert.ok(fn(probe.ops), `estado ${state} deve manter seu destaque próprio`);
  };
  checkOp("thinking", (ops) => ops.some((o) => o.op === "arc" && o.args[0] === 85.5 && o.args[1] === 13));
  checkOp("searching", (ops) => ops.some((o) => o.op === "arc" && o.args[0] === 77 && o.args[2] === 9));
  checkOp("question", (ops) => ops.some((o) => o.op === "arc" && o.args[0] === 79 && o.args[1] === 11.8 && o.args[2] === 3.2));
  checkOp("error", (ops) => ops.some((o) => o.op === "lineTo" && o.args[0] === 91.5 && o.args[1] === 25.5));
  checkOp("approval", (ops) => ops.some((o) => o.op === "arc" && o.args[0] === 78 && o.args[1] === 16 && o.args[2] === 11.5));
  checkOp("finished", (ops) => ops.some((o) => o.op === "lineTo" && o.args[0] === 84.8 && o.args[1] === 11.4));
  checkOp("sleeping", (ops) => ops.some((o) => o.op === "moveTo" && o.args[0] === 82 && o.args[1] === 2));

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

test("animações P1 de transição e loop contínuo respeitam tempo e voltam ao repouso em idle", () => {
  const engine = new BotEngine();
  engine.setAgent("agent_codex");

  // Entrada em finished gira 1x, emite sparks após 0,45 s e depois retorna ao repouso.
  engine.setState("finished");
  assert.equal(engine.busy, true);
  engine.update(0.1);
  engine.update(0.1);
  assert.ok(engine.roll > 0.5 && engine.roll < Math.PI * 2, "finished deve girar na entrada");
  for (let i = 0; i < 10; i++) engine.update(0.05); // chega a 0,70 s -> sparks já disparados
  assert.ok(engine.busy, "sparks de finished mantêm busy durante a celebração");
  for (let i = 0; i < 40; i++) engine.update(0.05); // +2,0 s -> reação encerrada
  assert.equal(engine.roll, 0);
  assert.equal(engine.busy, false, "após o fim de finished, busy volta a false");

  // Entrada em error treme horizontalmente (ox) e depois assenta.
  engine.setState("error");
  engine.update(0.05);
  assert.ok(engine.ox > 0.02, "error deve aplicar tremor horizontal positivo no início");
  engine.update(0.07);
  assert.ok(engine.ox < -0.02, "error deve oscilar para o lado oposto");
  for (let i = 0; i < 30; i++) engine.update(0.05);
  assert.equal(engine.ox, 0);
  assert.equal(engine.busy, false, "após tremor e amortecimento da mola, busy volta a false");

  // Estados contínuos P1 animam e mantêm busy=true enquanto ativos.
  for (const state of ["working", "thinking", "approval", "ratelimit", "sleeping"]) {
    engine.setState(state);
    assert.equal(engine.busy, true, `${state} deve manter laço P1 ativo`);
    const p0 = canvasProbe();
    engine.draw(p0.ctx, 96, 96);
    engine.update(0.1);
    engine.update(0.1);
    const p1 = canvasProbe();
    engine.draw(p1.ctx, 96, 96);
    assert.notDeepEqual(p0.ops, p1.ops, `${state} deve mudar os quadros ao avançar dt`);
  }

  // Retornar a idle zera movimento contínuo após assentar.
  engine.setState("idle");
  for (let i = 0; i < 30; i++) engine.update(0.05);
  assert.equal(engine.busy, false);
});

test("gestos P1 blink, squash, gulp, slap e greet respondem via update(dt) sem timers", () => {
  const engine = new BotEngine();
  engine.setAgent("integration_claude");
  engine.setState("idle", true);

  // blink fecha a pálpebra suavemente e reabre.
  engine.blink();
  engine.update(0.07);
  const bProbe = canvasProbe();
  engine.draw(bProbe.ctx, 96, 96);
  assert.ok(!bProbe.ops.some((o) => o.op === "ellipse"), "no auge da piscada os olhos fecham em arco");
  for (let i = 0; i < 6; i++) engine.update(0.05);
  assert.equal(engine.busy, false);

  // gulp abre a boca, mastiga após 0,46 s e encerra em 1,26 s.
  engine.gulp();
  engine.update(0.1);
  engine.update(0.1);
  assert.ok(engine.slotH > 0.25 && !engine.isChewing);
  for (let i = 0; i < 7; i++) engine.update(0.05); // total 0,55 s
  assert.equal(engine.isChewing, true);
  for (let i = 0; i < 20; i++) engine.update(0.05);
  assert.equal(engine.isChewing, false);
  assert.equal(engine.busy, false);

  // greet e love/proud emitem partículas animadas.
  engine.greet();
  engine.update(0.1);
  assert.ok(engine.oy < -0.02);
  assert.equal(engine.busy, true);
  engine.interruptGreet();
  for (let i = 0; i < 40; i++) engine.update(0.05);

  // 3 tapas em menos de 1,7 s acionam onDizzy.
  let dizzyCalls = 0;
  engine.onDizzy = () => { dizzyCalls += 1; };
  engine.slap();
  engine.update(0.1);
  engine.update(0.1);
  engine.slap();
  engine.update(0.1);
  engine.update(0.1);
  engine.slap();
  assert.equal(dizzyCalls, 1);
});

test("prefers-reduced-motion suprime também os laços e gestos P1", () => {
  const previousWindow = globalThis.window;
  globalThis.window = { matchMedia: () => ({ matches: true }) };
  try {
    const engine = new BotEngine();
    engine.setAgent("ai_openai");
    engine.setState("approval");
    engine.gulp();
    engine.slap();
    engine.triggerEmote("love");
    engine.moodTarget = { busy: 1, hot: 1, full: 1, tired: 1, asleep: true };
    engine.isMini = true;
    engine.setPermanentEmote("love");
    engine.update(0.2);
    assert.equal(engine.busy, false);
    assert.equal(engine.ox, 0);
    assert.equal(engine.oy, 0);
    assert.equal(engine.roll, 0);
    assert.equal(engine.physDx, 0);
    assert.equal(engine.physDy, 0);
    assert.equal(engine.moodBusy, 0);
    assert.equal(engine.moodHot, 0);
    assert.equal(engine.isChewing, false);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("animações P2 de humor (mood.ts) geram saltos, gotas, ondas de calor e voltam a busy=false no CALM", () => {
  const engine = new BotEngine();
  engine.setAgent("agent_antigravity");
  engine.setState("idle", true);

  engine.moodTarget = { busy: 1, hot: 0.9, full: 0.8, tired: 0, asleep: false };
  for (let i = 0; i < 20; i++) engine.update(0.1);
  assert.equal(engine.busy, true, "humor ativo deve manter busy=true");
  assert.ok(engine.moodBusy > 0.5 && engine.moodHot > 0.5 && engine.moodFull > 0.5);
  assert.ok(engine.moodDrops.length > 0, "busy/hot deve gerar moodDrops via mood.ts");

  const probe = canvasProbe();
  engine.draw(probe.ctx, 96, 96);
  assert.ok(probe.ops.some((o) => o.op === "createRadialGradient"), "PC quente deve desenhar tintura térmica");

  engine.moodTarget = { busy: 0, hot: 0, full: 0, tired: 0.9, asleep: true };
  for (let i = 0; i < 20; i++) engine.update(0.1);
  const tiredProbe = canvasProbe();
  engine.draw(tiredProbe.ctx, 96, 96);
  assert.ok(tiredProbe.ops.some((o) => o.op === "quadraticCurveTo"), "asleep no humor deve fechar olhos em arco");

  engine.moodTarget = { busy: 0, hot: 0, full: 0, tired: 0, asleep: false };
  for (let i = 0; i < 65; i++) engine.update(0.1);
  assert.equal(engine.moodBusy, 0);
  assert.equal(engine.moodHot, 0);
  assert.equal(engine.moodDrops.length, 0);
  assert.equal(engine.busy, false, "retornar para CALM assenta busy em false");
});

test("animações P2 de mini bots (isMini) e física secundária (physDx/physDy) funcionam e assentam", () => {
  const mini = new BotEngine();
  mini.isMini = true;
  mini.setAgent("integration_claude");
  mini.setState("idle", true);
  mini.setPermanentEmote("love");
  for (let i = 0; i < 15; i++) mini.update(0.1);
  assert.equal(mini.busy, true);

  const main = new BotEngine();
  main.setAgent("agent_antigravity");
  main.setState("idle", true);
  main.slap();
  main.update(0.05);
  main.update(0.05);
  assert.ok(Math.abs(main.physDx) > 0.001 || Math.abs(main.physDy) > 0.001, "movimento deve excitar a mola secundária");
  for (let i = 0; i < 50; i++) main.update(0.05);
  assert.equal(main.physDx, 0, "mola secundária deve assentar em repouso");
  assert.equal(main.physDy, 0);
  assert.equal(main.busy, false);
});
