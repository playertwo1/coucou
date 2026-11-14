import type { BotEmoteName, BotStateName } from "../core/layout";
import type { MochiMood } from "../mochi/mood";
import type { Outfit } from "../mochi/wardrobe";
import { Sound } from "../core/sound";

export type RGB = readonly [number, number, number];
export type EyeShape = "pill" | "wide" | "dot" | "line" | "flat" | "happy" | "closed" | "spiral" | "heart" | "star" | "tired" | "wink" | "cup";
export type BadgeKind = "dots" | "bang" | "question" | "dot" | "arrow";
export interface Badge { kind: BadgeKind; color: RGB }
export type TweenKey = readonly [target: number, durationMs: number, ease: (t: number) => number];
export type LumenCharacter = "claude" | "codex" | "chatgpt" | "antigravity" | "gemini" | "opencode" | "generic";

type MouthShape = "smile" | "wideSmile" | "frown" | "o" | "flat" | "pant" | "sleep";
interface StateConfig { color: RGB; badge: Badge | null; eyes: EyeShape; mouth: MouthShape; tilt: number; gaze: readonly [number, number] }
interface FaceLayout { eyeLeftX: number; eyeRightX: number; eyeY: number; mouthX: number; mouthY: number }

const INK: RGB = [0.149, 0.133, 0.294];
const SAND: RGB = [0.957, 0.91, 0.788];
const CLAUDE_WHITE: RGB = [0.961, 0.965, 0.973];
const TEAL: RGB = [0.176, 0.831, 0.749];
const CHATGPT_GREEN: RGB = [0.063, 0.639, 0.498];
const ANTIGRAVITY_MAGENTA: RGB = [0.91, 0.475, 0.976];
const LIGHT_BLUE: RGB = [0.541, 0.706, 0.973];
const GLASS_TINT: RGB = [0.859, 0.925, 0.996];
const OPENCODE_GREEN: RGB = [0.29, 0.871, 0.502];
const BLUSH: RGB = [0.91, 0.57, 0.63];
const APPROVAL_AMBER: RGB = [0.984, 0.749, 0.141];
const ERROR_RED: RGB = [0.937, 0.306, 0.349];
const DONE_GREEN: RGB = [0.165, 0.788, 0.459];
const NEUTRAL: MochiMood = { busy: 0, hot: 0, full: 0, tired: 0, asleep: false };

const AGENT_CHARACTER_MAP: Record<string, LumenCharacter> = {
  integration_claude: "claude",
  claude: "claude",
  agent_codex: "codex",
  codex: "codex",
  ai_openai: "chatgpt",
  openai: "chatgpt",
  agent_antigravity: "antigravity",
  antigravity: "antigravity",
  agent_gemini: "gemini",
  gemini: "gemini",
  agent_opencode: "opencode",
  opencode: "opencode",
};

const CHARACTER_COLOR: Record<LumenCharacter, RGB> = {
  claude: CLAUDE_WHITE,
  codex: TEAL,
  chatgpt: CHATGPT_GREEN,
  antigravity: ANTIGRAVITY_MAGENTA,
  gemini: LIGHT_BLUE,
  opencode: OPENCODE_GREEN,
  generic: SAND,
};

const CHARACTER_FACE: Record<LumenCharacter, FaceLayout> = {
  claude: { eyeLeftX: 37, eyeRightX: 59, eyeY: 45, mouthX: 48, mouthY: 58 },
  codex: { eyeLeftX: 34, eyeRightX: 56, eyeY: 43, mouthX: 48, mouthY: 62 },
  chatgpt: { eyeLeftX: 36, eyeRightX: 58, eyeY: 44, mouthX: 47, mouthY: 57 },
  antigravity: { eyeLeftX: 37, eyeRightX: 59, eyeY: 43, mouthX: 48, mouthY: 55 },
  gemini: { eyeLeftX: 37, eyeRightX: 59, eyeY: 34, mouthX: 48, mouthY: 46 },
  opencode: { eyeLeftX: 37, eyeRightX: 59, eyeY: 41, mouthX: 48, mouthY: 52 },
  generic: { eyeLeftX: 37, eyeRightX: 59, eyeY: 39, mouthX: 48, mouthY: 52 },
};

const rgbCss = (color: RGB, alpha = 1) => `rgba(${Math.round(color[0] * 255)},${Math.round(color[1] * 255)},${Math.round(color[2] * 255)},${alpha})`;
const EMOTE_EYE: Record<BotEmoteName, EyeShape> = {
  love: "heart", surprised: "wide", proud: "star", wink: "wink", yawn: "tired", happy: "happy", annoyed: "line",
};

export const BOT_STATES: Record<BotStateName, StateConfig> = {
  idle: { color: SAND, badge: null, eyes: "pill", mouth: "smile", tilt: 0, gaze: [0, 0] },
  working: { color: TEAL, badge: null, eyes: "pill", mouth: "smile", tilt: 0.055, gaze: [0, 1.5] },
  thinking: { color: TEAL, badge: { kind: "dots", color: SAND }, eyes: "pill", mouth: "flat", tilt: 0, gaze: [1.8, -2.5] },
  searching: { color: TEAL, badge: { kind: "dots", color: GLASS_TINT }, eyes: "pill", mouth: "smile", tilt: 0, gaze: [3, -0.5] },
  approval: { color: TEAL, badge: { kind: "bang", color: APPROVAL_AMBER }, eyes: "wide", mouth: "smile", tilt: 0, gaze: [0.5, -1] },
  question: { color: TEAL, badge: { kind: "question", color: SAND }, eyes: "pill", mouth: "o", tilt: -0.05, gaze: [1.5, -1.5] },
  error: { color: TEAL, badge: { kind: "bang", color: ERROR_RED }, eyes: "flat", mouth: "frown", tilt: 0, gaze: [0, 1.5] },
  finished: { color: TEAL, badge: { kind: "dot", color: DONE_GREEN }, eyes: "happy", mouth: "wideSmile", tilt: 0, gaze: [0, 0] },
  ratelimit: { color: TEAL, badge: { kind: "dot", color: LIGHT_BLUE }, eyes: "tired", mouth: "pant", tilt: -0.045, gaze: [0, 2] },
  sleeping: { color: TEAL, badge: null, eyes: "closed", mouth: "sleep", tilt: 0.03, gaze: [0, 0] },
  dizzy: { color: TEAL, badge: null, eyes: "spiral", mouth: "frown", tilt: 0.05, gaze: [0, 0] },
};

export const STATE_SOUND: Partial<Record<BotStateName, string>> = {
  working: "work", thinking: "think", searching: "search", approval: "approval",
  question: "question", error: "error", finished: "finish", ratelimit: "rate",
  sleeping: "sleep", dizzy: "dizzy",
};

export function hexToRGB(hex: string): RGB {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  const n = Number.parseInt(full, 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

export function characterForAgent(agentId: string | null | undefined): LumenCharacter {
  return (agentId && AGENT_CHARACTER_MAP[agentId]) || "generic";
}

export function stepDanceLevel(level: number, dancing: boolean, dt: number) {
  const target = dancing ? 1 : 0;
  return level + (target - level) * (1 - Math.exp(-Math.max(0, dt) * 7));
}

export function danceTransform(seconds: number, level: number, radius: number) {
  const wave = Math.sin(seconds * Math.PI * 2) * level;
  return { dx: 0, dy: -radius * 0.08 * Math.max(0, wave), rotate: wave * 0.05, sx: 1 + Math.abs(wave) * 0.04, sy: 1 - Math.abs(wave) * 0.035 };
}

function reducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function paintOutlinedShape(
  ctx: CanvasRenderingContext2D,
  fill: RGB,
  lineWidth = 3,
  fillRule: CanvasFillRule = "nonzero",
) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.shadowColor = "rgba(0,0,0,0.32)";
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 2;
  ctx.fill(fillRule);
  ctx.restore();
  ctx.fillStyle = rgbCss(fill);
  ctx.fill(fillRule);
  ctx.strokeStyle = rgbCss(INK);
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.stroke();
}

function curve(ctx: CanvasRenderingContext2D, x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, width = 3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.strokeStyle = rgbCss(INK);
  ctx.stroke();
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: RGB) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.35);
  ctx.bezierCurveTo(x - size, y - size * 0.2, x - size * 0.45, y - size, x, y - size * 0.45);
  ctx.bezierCurveTo(x + size * 0.45, y - size, x + size, y - size * 0.2, x, y + size * 0.35);
  ctx.closePath();
  ctx.fillStyle = rgbCss(color);
  ctx.fill();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: RGB) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? r * 0.48 : r;
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = rgbCss(color);
  ctx.fill();
}

export class CompassEngine {
  isMini = false;
  bodyColor: RGB | null = null;
  moodTarget: MochiMood = { ...NEUTRAL };
  moodBusy = 0; moodHot = 0; moodFull = 0; moodTired = 0;
  moodDrops: unknown[] = [];
  state: BotStateName = "idle";
  cfg: StateConfig = BOT_STATES.idle;
  badge: Badge | null = null;
  badgeS = 0;
  isDancing = false;
  dancingLevel = 0;
  lookX = 0; lookY = 0;
  morph = 0; slotH = 0; slotHTarget = 0; slotHVel = 0;
  tgEs = 1; es = 1;
  tilt = 0; roll = 0; ox = 0; oy = 0; particleOverhang = 0;
  eyeOverride: EyeShape | null = null;
  eyeOverrideUntil = 0;
  permanentEye: EyeShape | null = null;
  permanentEmote: BotEmoteName | null = null;
  outfit: Outfit = "none";
  outfitPresence = 0;
  isChewing = false;
  onDizzy: (() => void) | null = null;
  agentId: string | null = null;
  character: LumenCharacter = "generic";

  private elapsed = 0;
  private pulseUntil = 0;
  private updateHint: RGB | null = null;
  private emote: BotEmoteName | null = null;
  private emoteUntil = 0;
  private blinkUntil = 0;
  private squashUntil = 0;
  private gulpUntil = 0;
  private particleType: "heart" | "star" | "spark" | "sweat" | "z" | null = null;
  private particleCount = 0;
  private particleUntil = 0;
  private slapTimes: number[] = [];
  private rollStart = 0;
  private rollDuration = 0;
  private rollTurns = 0;

  setAgent(agentId: string | null) {
    if (agentId === this.agentId) return this.character;
    this.agentId = agentId;
    this.character = characterForAgent(agentId);
    return this.character;
  }

  setState(next: BotStateName, force = false) {
    if (!force && next === this.state) return;
    this.state = next;
    this.cfg = BOT_STATES[next] ?? BOT_STATES.idle;
    this.badge = this.cfg.badge;
    this.badgeS = this.badge ? 1 : 0;
  }

  setUpdateHint(color: RGB | null) { this.updateHint = color; }
  get showsUpdateHint() { return this.updateHint != null && (this.state === "idle" || this.state === "sleeping"); }
  setBadge(badge: Badge | null) { this.badge = badge; this.badgeS = badge ? 1 : 0; }
  setOutfit(next: Outfit, _animate = true) { this.outfit = next; this.outfitPresence = next === "none" ? 0 : 1; }
  setPermanentEmote(emote: BotEmoteName | null) {
    this.permanentEmote = emote;
    this.permanentEye = emote ? EMOTE_EYE[emote] : null;
    this.eyeOverride = this.permanentEye;
    this.eyeOverrideUntil = emote ? Number.POSITIVE_INFINITY : 0;
  }
  triggerEmote(emote: BotEmoteName, duration = 1.8) {
    this.emote = emote;
    this.emoteUntil = this.elapsed + Math.max(0, duration);
    this.pulseUntil = this.elapsed + 0.45;
  }
  setDancing(dancing: boolean) { this.isDancing = dancing; }
  get busy() {
    if (reducedMotion()) return false;
    return this.state === "searching" || this.state === "dizzy" ||
      this.isDancing || this.dancingLevel > 0.001 || this.elapsed < this.pulseUntil ||
      this.elapsed < this.particleUntil || this.rollDuration > 0 || Math.abs(this.tgEs - this.es) > 0.002;
  }

  blink() { this.blinkUntil = this.elapsed + 0.14; this.pulseUntil = this.blinkUntil; }
  squash() { this.squashUntil = this.elapsed + 0.32; this.pulseUntil = this.squashUntil; }
  gulp() {
    this.gulpUntil = this.elapsed + 0.42;
    this.slotHTarget = 0.34;
    this.pulseUntil = this.gulpUntil;
    Sound.play("gulp");
  }
  slap() {
    this.interruptGreet();
    if (this.state === "dizzy") return;
    this.slapTimes = this.slapTimes.filter((time) => this.elapsed - time < 1.7);
    this.slapTimes.push(this.elapsed);
    this.squash();
    this.triggerEmote("annoyed", 0.8);
    Sound.play("slap");
    if (this.slapTimes.length >= 3) {
      this.slapTimes = [];
      this.onDizzy?.();
    }
  }
  doRoll(durationMs: number, turns: number) {
    this.rollStart = this.elapsed;
    this.rollDuration = Math.max(0.08, durationMs / 1000);
    this.rollTurns = turns;
    this.roll = 0;
    this.pulseUntil = this.elapsed + this.rollDuration;
  }
  greet() {
    this.triggerEmote("happy", 1.2);
    this.squash();
    Sound.play("greet");
  }
  interruptGreet() { this.emote = null; this.emoteUntil = 0; }
  emit(type: "heart" | "star" | "spark" | "sweat" | "z", count: number) {
    this.particleType = type;
    this.particleCount = Math.max(0, Math.min(6, count));
    this.particleUntil = this.elapsed + 0.8;
    this.pulseUntil = this.particleUntil;
  }
  animateMorph(target: number) { this.morph = Math.max(0, Math.min(1, target)); }
  resetMorph() { this.animateMorph(0); this.slotHTarget = 0; }
  anim(_prop: string, _keys: TweenKey[], onComplete?: () => void) { onComplete?.(); }

  update(dt: number) {
    const step = Math.max(0, Math.min(0.1, dt));
    this.elapsed += step;
    if (reducedMotion()) {
      this.dancingLevel = 0;
      this.roll = 0;
      this.rollDuration = 0;
      this.es = this.tgEs;
      this.slotH = this.slotHTarget = this.gulpUntil = 0;
      return;
    }
    this.dancingLevel = stepDanceLevel(this.dancingLevel, this.isDancing, step);
    this.es += (this.tgEs - this.es) * (1 - Math.exp(-step * 9));
    this.slotH += (this.slotHTarget - this.slotH) * (1 - Math.exp(-step * 16));
    if (this.gulpUntil > 0 && this.elapsed >= this.gulpUntil) {
      this.gulpUntil = 0;
      this.slotHTarget = 0;
    }
    if (this.rollDuration > 0) {
      const p = Math.min(1, (this.elapsed - this.rollStart) / this.rollDuration);
      this.roll = this.rollTurns * Math.PI * 2 * (1 - Math.pow(1 - p, 3));
      if (p >= 1) { this.roll = 0; this.rollDuration = 0; }
    }
  }

  applyDance(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (reducedMotion() || this.dancingLevel <= 0.001) return;
    const radius = Math.min(width, height) * 0.34;
    const dance = danceTransform(this.elapsed, this.dancingLevel, radius);
    const x = width / 2 + dance.dx;
    const y = height / 2 + dance.dy;
    ctx.translate(x, y);
    ctx.rotate(dance.rotate);
    ctx.scale(dance.sx, dance.sy);
    ctx.translate(-x, -y);
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const cfg = this.cfg ?? BOT_STATES.idle;
    const reduced = reducedMotion();
    const emote = !reduced && this.elapsed < this.emoteUntil ? this.emote : null;
    const eyes = !reduced && this.elapsed < this.blinkUntil ? "closed" :
      this.elapsed < this.eyeOverrideUntil && this.eyeOverride ? this.eyeOverride :
      emote ? EMOTE_EYE[emote] : cfg.eyes;
    const mouth: MouthShape = emote === "surprised" || emote === "yawn" ? "o" :
      emote === "happy" || emote === "proud" ? "wideSmile" :
      emote === "annoyed" ? "flat" : cfg.mouth;
    const scale = width / 96;
    const pulse = !reduced && this.elapsed < this.squashUntil
      ? Math.sin(Math.PI * (1 - (this.squashUntil - this.elapsed) / 0.32)) : 0;
    const sx = 1 + pulse * 0.08;
    const sy = 1 - pulse * 0.09;
    const stateTilt = !reduced && this.state === "dizzy"
      ? Math.sin(this.elapsed * 4.2 + 0.85) * 0.065
      : cfg.tilt;

    ctx.save();
    ctx.translate((width - 96 * scale) / 2, (height - 96 * scale) / 2);
    ctx.scale(scale, scale);
    ctx.translate(48 + this.ox * 5, 49 + this.oy * 5);
    ctx.rotate(stateTilt + this.tilt + this.roll);
    ctx.scale(sx * this.es, sy * this.es);
    ctx.translate(-48, -49);

    const fill = this.bodyColor ?? CHARACTER_COLOR[this.character];
    const face = CHARACTER_FACE[this.character];
    const gaze: readonly [number, number] = !reduced && this.state === "searching"
      ? [Math.cos(this.elapsed * 2.6) * 2.8 + this.lookX * 0.8, -0.5 - this.lookY * 0.8]
      : [cfg.gaze[0] + this.lookX * 2, cfg.gaze[1] - this.lookY * 2];
    const spiralPhase = !reduced && this.state === "dizzy" ? this.elapsed * 4 : 0;

    this.drawCharacter(ctx, fill);
    this.drawEyes(ctx, eyes, gaze, this.state === "sleeping", face, spiralPhase);
    this.drawMouth(ctx, mouth, face);
    this.drawStateAccent(ctx);
    if (!reduced && this.elapsed < this.particleUntil) this.drawParticle(ctx);
    ctx.restore();
  }

  private drawCharacter(ctx: CanvasRenderingContext2D, fill: RGB) {
    switch (this.character) {
      case "claude":
        this.drawClaude(ctx, fill);
        break;
      case "codex":
        this.drawCodex(ctx, fill);
        break;
      case "chatgpt":
        this.drawChatGpt(ctx, fill);
        break;
      case "antigravity":
        this.drawAntigravity(ctx, fill);
        break;
      case "gemini":
        this.drawGemini(ctx, fill);
        break;
      case "opencode":
        this.drawOpenCode(ctx, fill);
        break;
      case "generic":
        this.drawGeneric(ctx, fill);
        break;
    }
  }

  private drawClaude(ctx: CanvasRenderingContext2D, fill: RGB) {
    ctx.beginPath();
    ctx.moveTo(32, 13);
    ctx.lineTo(60, 13);
    ctx.lineTo(77, 30);
    ctx.lineTo(77, 72);
    ctx.arcTo(77, 85, 64, 85, 13);
    ctx.lineTo(32, 85);
    ctx.arcTo(19, 85, 19, 72, 13);
    ctx.lineTo(19, 26);
    ctx.arcTo(19, 13, 32, 13, 13);
    ctx.closePath();
    paintOutlinedShape(ctx, fill);

    ctx.beginPath();
    ctx.moveTo(60, 13);
    ctx.lineTo(60, 26);
    ctx.arcTo(60, 30, 64, 30, 4);
    ctx.lineTo(77, 30);
    ctx.closePath();
    ctx.fillStyle = rgbCss(fill);
    ctx.fill();
    ctx.strokeStyle = rgbCss(INK);
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(27, 8);
    ctx.lineTo(35, 8);
    ctx.arcTo(37, 8, 37, 10, 2);
    ctx.lineTo(37, 25);
    ctx.lineTo(31, 20);
    ctx.lineTo(25, 25);
    ctx.lineTo(25, 10);
    ctx.arcTo(25, 8, 27, 8, 2);
    ctx.closePath();
    ctx.fillStyle = rgbCss(SAND);
    ctx.fill();
    ctx.strokeStyle = rgbCss(INK);
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  private drawCodex(ctx: CanvasRenderingContext2D, fill: RGB) {
    roundedRect(ctx, 18, 16, 59, 69, 20);
    paintOutlinedShape(ctx, fill);
    roundedRect(ctx, 74, 55, 14, 27, 7);
    ctx.fillStyle = rgbCss(SAND);
    ctx.fill();
    ctx.strokeStyle = rgbCss(INK);
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  private drawChatGpt(ctx: CanvasRenderingContext2D, fill: RGB) {
    ctx.beginPath();
    ctx.arc(47, 48, 32, 1.18, 0.72, false);
    ctx.bezierCurveTo(74.5, 76, 73, 82, 68.5, 82);
    ctx.bezierCurveTo(64.5, 82, 61.5, 79.5, 59.19, 77.59);
    ctx.closePath();
    paintOutlinedShape(ctx, fill);
  }

  private drawAntigravity(ctx: CanvasRenderingContext2D, fill: RGB) {
    ctx.beginPath();
    ctx.moveTo(48, 13);
    ctx.bezierCurveTo(60, 13, 75, 36, 75, 48);
    ctx.bezierCurveTo(75, 61, 59, 83, 48, 83);
    ctx.bezierCurveTo(37, 83, 21, 61, 21, 48);
    ctx.bezierCurveTo(21, 36, 36, 13, 48, 13);
    ctx.closePath();
    paintOutlinedShape(ctx, fill);

    for (const bx of [12.5, 83.5]) {
      ctx.beginPath();
      ctx.arc(bx, 61, 5.5, 0, Math.PI * 2);
      paintOutlinedShape(ctx, fill);
    }
  }

  private drawGemini(ctx: CanvasRenderingContext2D, fill: RGB) {
    const r = 19.5;
    const topAngle = Math.acos(10 / r);
    const waistAngle = Math.asin(15 / r);
    ctx.beginPath();
    ctx.arc(58, 33, r, -Math.PI + topAngle, waistAngle, false);
    ctx.arc(58, 63, r, -waistAngle, Math.PI - topAngle, false);
    ctx.arc(38, 63, r, topAngle, Math.PI + waistAngle, false);
    ctx.arc(38, 33, r, Math.PI - waistAngle, -topAngle, false);
    ctx.closePath();
    paintOutlinedShape(ctx, fill);
  }

  private drawOpenCode(ctx: CanvasRenderingContext2D, fill: RGB) {
    ctx.beginPath();
    ctx.moveTo(20, 39);
    ctx.arc(48, 39, 28, Math.PI, 0, false);
    ctx.lineTo(76, 71);
    ctx.arcTo(76, 85, 62, 85, 14);
    ctx.lineTo(34, 85);
    ctx.arcTo(20, 85, 20, 71, 14);
    ctx.closePath();
    ctx.moveTo(61.5, 31);
    ctx.arc(48, 31, 13.5, 0, Math.PI, true);
    ctx.closePath();
    paintOutlinedShape(ctx, fill, 3, "evenodd");

    roundedRect(ctx, 29, 61, 38, 16, 8);
    ctx.fillStyle = rgbCss(SAND);
    ctx.fill();
    ctx.strokeStyle = rgbCss(INK);
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  private drawGeneric(ctx: CanvasRenderingContext2D, fill: RGB) {
    roundedRect(ctx, 16, 12, 64, 72, 21);
    paintOutlinedShape(ctx, fill);
    roundedRect(ctx, 25, 60, 46, 17, 8.5);
    ctx.fillStyle = rgbCss(INK);
    ctx.fill();
  }

  private drawEyes(
    ctx: CanvasRenderingContext2D,
    shape: EyeShape,
    gaze: readonly [number, number],
    sleeping: boolean,
    face: FaceLayout,
    spiralPhase: number,
  ) {
    const [gx, gy] = gaze;
    for (const side of [-1, 1]) {
      const x = side < 0 ? face.eyeLeftX : face.eyeRightX;
      const y = face.eyeY + gy;
      const eye = shape === "wink" && side > 0 ? "happy" : shape;
      if (eye === "heart") { heart(ctx, x, y, 5.4, BLUSH); continue; }
      if (eye === "star") { star(ctx, x, y, 5.3, SAND); continue; }
      if (eye === "closed" || eye === "happy" || (sleeping && eye === "pill")) {
        curve(ctx, x - 5, y, x, y + (eye === "happy" ? -6 : 4), x + 5, y, 3.3);
        continue;
      }
      if (eye === "spiral") {
        ctx.beginPath();
        for (let i = 0; i <= 18; i++) {
          const angle = spiralPhase + (i / 18) * Math.PI * 2.4;
          const radius = 0.5 + (i / 18) * 4.6;
          const px = x + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = rgbCss(INK);
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";
        ctx.stroke();
        continue;
      }
      if (eye === "line" || eye === "flat") {
        curve(ctx, x - 5, y, x, y + (eye === "line" ? 0.5 : 1.5), x + 5, y, 3.3);
        if (eye === "flat") curve(ctx, x + 5 * side, y - 6.5, x, y - 4.5, x - 4 * side, y - 3, 2.3);
        continue;
      }
      const rx = eye === "wide" ? 6.3 : eye === "dot" ? 4.2 : 5.5;
      const ry = eye === "tired" ? 3.2 : eye === "wide" ? 8 : 7.5;
      ctx.beginPath();
      ctx.ellipse(x + gx, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgbCss(INK);
      ctx.fill();
      if (eye !== "tired") {
        ctx.beginPath();
        ctx.arc(x + gx - 2, y - 2.2, 1.9, 0, Math.PI * 2);
        ctx.fillStyle = rgbCss(SAND);
        ctx.fill();
      } else {
        curve(ctx, x + 5.5 * side, y - 2.2, x, y - 4, x - 4.5 * side, y - 5.8, 2.5);
        curve(ctx, x - 4.5, y + 4.8, x, y + 6.3, x + 4.5, y + 4.8, 1.8);
      }
    }
  }

  private drawMouth(ctx: CanvasRenderingContext2D, shape: MouthShape, face: FaceLayout) {
    const mx = face.mouthX;
    const y = face.mouthY;
    if (this.morph > 0.1 || this.slotH > 0.08) {
      ctx.beginPath();
      ctx.ellipse(mx, y + 2, 7 + 4 * this.morph, 2.5 + this.slotH * 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgbCss(INK);
      ctx.fill();
      return;
    }
    if (shape === "o" || shape === "sleep") {
      ctx.beginPath();
      ctx.ellipse(mx, y, shape === "sleep" ? 2.4 : 3.5, shape === "sleep" ? 2.6 : 4.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgbCss(INK);
      ctx.fill();
    } else if (shape === "pant") {
      ctx.beginPath();
      ctx.ellipse(mx, y + 1.5, 5.4, 4.1, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgbCss(INK);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(mx, y + 3.2, 2.8, 1.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgbCss(BLUSH);
      ctx.fill();
    } else if (shape === "frown") {
      curve(ctx, mx - 7, y + 3, mx, y - 4, mx + 7, y + 3, 3.2);
    } else if (shape === "flat") {
      curve(ctx, mx - 5, y, mx, y + 0.5, mx + 5, y, 3);
    } else {
      const half = shape === "wideSmile" ? 10 : 7;
      const depth = shape === "wideSmile" ? 10 : 7;
      curve(ctx, mx - half, y - 1, mx, y + depth, mx + half, y - 1, shape === "wideSmile" ? 3.6 : 3.2);
    }
  }

  private drawSweatDrop(ctx: CanvasRenderingContext2D, tipX: number, tipY: number, scale = 1) {
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.quadraticCurveTo(tipX - 6 * scale, tipY + 9 * scale, tipX, tipY + 12 * scale);
    ctx.quadraticCurveTo(tipX + 6 * scale, tipY + 9 * scale, tipX, tipY);
    ctx.closePath();
    ctx.fillStyle = rgbCss(LIGHT_BLUE);
    ctx.fill();
    ctx.strokeStyle = rgbCss(INK);
    ctx.lineWidth = Math.max(1.5, 1.8 * scale);
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  private drawSweat(ctx: CanvasRenderingContext2D, multiple = false) {
    const drops: ReadonlyArray<readonly [number, number, number]> = multiple
      ? [[81, 17, 0.95], [65, 9, 0.8], [24, 21, 0.85], [34, 9, 0.7]]
      : [[81, 17, 1]];
    for (const [x, y, scale] of drops) this.drawSweatDrop(ctx, x, y, scale);
  }

  private drawExclamation(ctx: CanvasRenderingContext2D, x: number, topY: number, dotY: number, color: RGB) {
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, dotY - 4.3);
    ctx.strokeStyle = rgbCss(color);
    ctx.lineWidth = 3.1;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, dotY, 1.7, 0, Math.PI * 2);
    ctx.fillStyle = rgbCss(color);
    ctx.fill();
  }

  private drawSleepZ(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
    const h = size * 0.5;
    for (const [color, width] of [[INK, size * 0.5], [LIGHT_BLUE, size * 0.24]] as const) {
      ctx.beginPath();
      ctx.moveTo(cx - h, cy - h);
      ctx.lineTo(cx + h, cy - h);
      ctx.lineTo(cx - h, cy + h);
      ctx.lineTo(cx + h, cy + h);
      ctx.strokeStyle = rgbCss(color);
      ctx.lineWidth = Math.max(1.6, width);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  private drawStateAccent(ctx: CanvasRenderingContext2D) {
    if (this.showsUpdateHint) {
      roundedRect(ctx, 76, 5, 15, 13, 3);
      ctx.fillStyle = rgbCss(this.updateHint ?? SAND);
      ctx.fill();
      ctx.strokeStyle = rgbCss(INK);
      ctx.lineWidth = 2;
      ctx.stroke();
      curve(ctx, 83.5, 7, 83.5, 11, 83.5, 15, 1.5);
      return;
    }
    switch (this.state) {
      case "thinking": {
        roundedRect(ctx, 66, 5, 27, 16, 8);
        ctx.fillStyle = rgbCss(SAND);
        ctx.fill();
        ctx.strokeStyle = rgbCss(INK);
        ctx.lineWidth = 2.4;
        ctx.stroke();
        for (const dx of [73.5, 79.5, 85.5]) {
          ctx.beginPath(); ctx.arc(dx, 13, 1.4, 0, Math.PI * 2); ctx.fillStyle = rgbCss(INK); ctx.fill();
        }
        for (const [x, y, r] of [[65, 24, 2.4], [59.5, 29.5, 1.5]] as const) {
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = rgbCss(SAND); ctx.fill(); ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 1.8; ctx.stroke();
        }
        break;
      }
      case "searching": {
        for (const [color, width] of [[INK, 5.2], [SAND, 2.4]] as const) {
          ctx.beginPath(); ctx.moveTo(83.5, 20); ctx.lineTo(91.5, 28);
          ctx.strokeStyle = rgbCss(color); ctx.lineWidth = width; ctx.lineCap = "round"; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(77, 13.5, 9, 0, Math.PI * 2);
        ctx.fillStyle = rgbCss(GLASS_TINT); ctx.fill();
        ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 2.8; ctx.stroke();
        ctx.beginPath(); ctx.arc(77, 13.5, 5.5, -Math.PI * 0.85, -Math.PI * 0.25);
        ctx.strokeStyle = rgbCss(CLAUDE_WHITE); ctx.lineWidth = 1.9; ctx.lineCap = "round"; ctx.stroke();
        break;
      }
      case "approval": {
        for (const [ax, cx] of [[64.5, 60.5], [91.5, 95]] as const) curve(ctx, ax, 8.5, cx, 15.5, ax, 22.5, 2.6);
        for (const [x1, y1, x2, y2] of [[68, 5, 70.5, 8], [88, 5, 85.5, 8]] as const) {
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
          ctx.strokeStyle = rgbCss(APPROVAL_AMBER); ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(78, 16, 11.5, 0, Math.PI * 2);
        ctx.fillStyle = rgbCss(APPROVAL_AMBER); ctx.fill();
        ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 2.6; ctx.stroke();
        this.drawExclamation(ctx, 78, 9.5, 21.5, INK);
        break;
      }
      case "question": {
        ctx.beginPath(); ctx.arc(79, 15, 10.8, 0, Math.PI * 2);
        ctx.fillStyle = rgbCss(SAND); ctx.fill();
        ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 2.6; ctx.stroke();
        ctx.beginPath(); ctx.arc(79, 11.8, 3.2, -Math.PI * 0.95, Math.PI * 0.35); ctx.lineTo(79, 16.5);
        ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 2.7; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
        ctx.beginPath(); ctx.arc(79, 20.8, 1.6, 0, Math.PI * 2); ctx.fillStyle = rgbCss(INK); ctx.fill();
        break;
      }
      case "error": {
        ctx.beginPath();
        ctx.moveTo(79, 4.5);
        ctx.lineTo(91.5, 25.5);
        ctx.lineTo(66.5, 25.5);
        ctx.closePath();
        ctx.fillStyle = rgbCss(ERROR_RED); ctx.fill();
        ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 2.6; ctx.lineJoin = "round"; ctx.stroke();
        this.drawExclamation(ctx, 79, 11, 21.8, CLAUDE_WHITE);
        break;
      }
      case "finished": {
        ctx.beginPath(); ctx.arc(79, 15.5, 10.5, 0, Math.PI * 2);
        ctx.fillStyle = rgbCss(DONE_GREEN); ctx.fill();
        ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 2.6; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(73.5, 15.8); ctx.lineTo(77.3, 19.6); ctx.lineTo(84.8, 11.4);
        ctx.strokeStyle = rgbCss(CLAUDE_WHITE); ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
        star(ctx, 64, 7.5, 3.4, SAND);
        star(ctx, 90, 28, 2.8, SAND);
        break;
      }
      case "ratelimit":
        this.drawSweat(ctx, true);
        break;
      case "sleeping":
        for (const [cx, cy, size] of [[68, 25.5, 5.2], [76.5, 16, 7.2], [86.5, 6.5, 9]] as const) {
          this.drawSleepZ(ctx, cx, cy, size);
        }
        break;
    }
  }

  private drawParticle(ctx: CanvasRenderingContext2D) {
    const x = 82, y = 12;
    const n = Math.min(3, this.particleCount);
    if (this.particleType === "heart") {
      for (let i = 0; i < n; i++) heart(ctx, x + i * 5, y - i * 4, 3.5, BLUSH);
    } else if (this.particleType === "star" || this.particleType === "spark") {
      for (let i = 0; i < n; i++) star(ctx, x + i * 5, y - i * 4, 3.5, SAND);
    } else if (this.particleType === "sweat") this.drawSweat(ctx);
    else {
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fillStyle = rgbCss(SAND); ctx.fill();
    }
  }
}

export { CompassEngine as BotEngine };
