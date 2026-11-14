import type { BotEmoteName, BotStateName } from "../core/layout";
import {
  CALM,
  dropAt,
  dropGone,
  heatWave,
  hopAt,
  isCalm,
  nextHop,
  restingHop,
  throwDrop,
  type MochiMood,
  type MoodDrop,
  type MoodHop,
} from "../mochi/mood";
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
const MEMORY_VIOLET: RGB = [0.655, 0.545, 0.98];

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

type ParticleKind = "heart" | "star" | "spark" | "sweat" | "z";
interface Particle {
  type: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
}
type EnvelopeStep = readonly [durationSec: number, target: number];

/** Evaluates a smoothstepped piecewise keyframe curve starting from `initial`. */
function evalEnvelope(age: number, initial: number, steps: ReadonlyArray<EnvelopeStep>): number {
  if (age <= 0) return initial;
  let elapsed = 0;
  let from = initial;
  for (const [dur, target] of steps) {
    if (age <= elapsed + dur) {
      const p = dur > 0 ? Math.min(1, Math.max(0, (age - elapsed) / dur)) : 1;
      const smooth = p * p * (3 - 2 * p);
      return from + (target - from) * smooth;
    }
    elapsed += dur;
    from = target;
  }
  return from;
}

const envelopeDuration = (steps: ReadonlyArray<EnvelopeStep>) => steps.reduce((sum, [dur]) => sum + dur, 0);

const BLINK_STEPS: ReadonlyArray<EnvelopeStep> = [[0.07, 0.06], [0.13, 1]];
const SQUASH_SY: ReadonlyArray<EnvelopeStep> = [[0.07, 0.78], [0.13, 1.1], [0.17, 1]];
const SQUASH_SX: ReadonlyArray<EnvelopeStep> = [[0.07, 1.16], [0.13, 0.95], [0.17, 1]];
const ERROR_SHAKE: ReadonlyArray<EnvelopeStep> = [[0.05, 0.08], [0.07, -0.08], [0.07, 0.05], [0.09, 0]];
const BADGE_POP: ReadonlyArray<EnvelopeStep> = [[0.18, 1.14], [0.1, 1]];
const ACTIVE_LOOP_STATES: ReadonlySet<BotStateName> = new Set([
  "working", "thinking", "searching", "approval", "ratelimit", "sleeping", "dizzy",
]);
const MOOD_ACTIVE_STATES: ReadonlySet<BotStateName> = new Set([
  "idle", "working", "thinking", "searching", "finished",
]);
const CALM_STATES: ReadonlySet<BotStateName> = new Set(["idle", "finished"]);

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
  moodTarget: MochiMood = { ...CALM };
  moodBusy = 0; moodHot = 0; moodFull = 0; moodTired = 0;
  moodDrops: MoodDrop[] = [];
  physDx = 0; physDy = 0;
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
  private stateStart = 0;
  private busyUntil = 0;
  private updateHint: RGB | null = null;
  private emote: BotEmoteName | null = null;
  private emoteUntil = 0;
  private blinkStart = -1;
  private squashStart = -1;
  private shakeStart = -1;
  private hopStart = -1;
  private hopAmp = 0;
  private waveStart = -1;
  private waveDuration = 0;
  private badgePopStart = -1;
  private gulpStart = -1;
  private gulpChewStarted = false;
  private pendingSparkAt = -1;
  private particles: Particle[] = [];
  private slapTimes: number[] = [];
  private rollStart = 0;
  private rollDuration = 0;
  private rollTurns = 0;
  private eyeOpen = 1;
  private animTilt = 0;
  private animSx = 1;
  private animSy = 1;
  private physVx = 0;
  private physVy = 0;
  private prevOx = 0;
  private prevOy = 0;
  private prevRoll = 0;
  private outfitTarget: Outfit = "none";
  private moodHop: MoodHop = restingHop();
  private nextMoodDrop = 0;
  private nextMoodYawn = 0;
  private stressTremble = { x: 0, y: 0 };
  private moodEye: EyeShape | null = null;
  private miniLookNext = 0;
  private miniLook = { x: 0, y: 0 };
  private miniNextBehavior = 0;

  private markBusyFor(seconds: number) {
    this.busyUntil = Math.max(this.busyUntil, this.elapsed + seconds);
  }

  private startHop(amp: number) {
    this.hopStart = this.elapsed;
    this.hopAmp = amp;
    this.markBusyFor(0.45);
  }

  private startShake() {
    this.shakeStart = this.elapsed;
    this.markBusyFor(envelopeDuration(ERROR_SHAKE));
  }

  setAgent(agentId: string | null) {
    if (agentId === this.agentId) return this.character;
    this.agentId = agentId;
    this.character = characterForAgent(agentId);
    return this.character;
  }

  setState(next: BotStateName, force = false) {
    const prev = this.state;
    if (!force && next === prev) return;
    this.state = next;
    this.stateStart = this.elapsed;
    this.cfg = BOT_STATES[next] ?? BOT_STATES.idle;
    this.setBadge(this.showsUpdateHint && this.updateHint ? { kind: "arrow", color: this.updateHint } : this.cfg.badge, !force);
    this.pendingSparkAt = -1;
    if (force && (next === "idle" || next === "error" || next === "question" || next === "finished")) {
      return;
    }
    switch (next) {
      case "finished":
        this.doRoll(950, 1);
        this.pendingSparkAt = this.elapsed + 0.45;
        this.markBusyFor(1.65);
        break;
      case "error":
        this.startShake();
        break;
      case "approval":
        this.startHop(-0.2);
        break;
      case "dizzy":
        this.doRoll(1300, 2);
        break;
      case "question":
        this.blink();
        break;
      case "ratelimit":
        this.emit("sweat", 2);
        break;
      default:
        if (next !== "sleeping" && prev !== next) this.blink();
        break;
    }
  }

  setUpdateHint(color: RGB | null) {
    this.updateHint = color;
    if (this.state === "idle" || this.state === "sleeping") {
      this.setBadge(color ? { kind: "arrow", color } : this.cfg.badge, false);
    }
  }
  get showsUpdateHint() { return this.updateHint != null && (this.state === "idle" || this.state === "sleeping"); }
  setBadge(badge: Badge | null, animate = false) {
    this.badge = badge;
    if (!badge) {
      this.badgeS = 0;
      this.badgePopStart = -1;
      return;
    }
    if (animate && !reducedMotion()) {
      this.badgePopStart = this.elapsed;
      this.badgeS = 0.05;
      this.markBusyFor(envelopeDuration(BADGE_POP));
    } else {
      this.badgeS = 1;
      this.badgePopStart = -1;
    }
  }
  setOutfit(next: Outfit, animate = true) {
    this.outfitTarget = next;
    if (!animate || reducedMotion()) {
      this.outfit = next;
      this.outfitPresence = next === "none" ? 0 : 1;
      return;
    }
    if (next !== "none" && this.outfit === "none") {
      this.outfit = next;
      this.outfitPresence = 0;
    }
    this.markBusyFor(0.35);
  }
  setPermanentEmote(emote: BotEmoteName | null) {
    this.permanentEmote = emote;
    if (emote === "wink") {
      this.permanentEye = null;
      this.eyeOverride = null;
      this.eyeOverrideUntil = 0;
      this.miniNextBehavior = this.elapsed + 0.8;
      return;
    }
    this.permanentEye = emote ? EMOTE_EYE[emote] : null;
    this.eyeOverride = this.permanentEye;
    this.eyeOverrideUntil = emote ? Number.POSITIVE_INFINITY : 0;
    this.miniNextBehavior = this.elapsed + 1.0;
  }
  triggerEmote(emote: BotEmoteName, duration = 1.8) {
    this.emote = emote;
    const dur = Math.max(0.2, duration);
    this.emoteUntil = this.elapsed + dur;
    this.markBusyFor(Math.min(dur, 1.4));
    switch (emote) {
      case "love":
        this.emit("heart", 4);
        this.startHop(-0.12);
        break;
      case "surprised":
        this.startHop(-0.24);
        this.squash();
        break;
      case "proud":
        this.emit("star", 5);
        this.waveStart = this.elapsed;
        this.waveDuration = Math.min(dur, 1.3);
        break;
      case "wink":
        this.waveStart = this.elapsed;
        this.waveDuration = Math.min(dur, 1.1);
        break;
      case "yawn":
        this.squash();
        this.emit("z", 2);
        break;
      case "happy":
        this.squash();
        break;
      case "annoyed":
        this.startShake();
        break;
    }
  }
  setDancing(dancing: boolean) { this.isDancing = dancing; }
  get busy() {
    if (reducedMotion()) return false;
    const moodActive = !this.isMini && (
      !isCalm(this.moodTarget) ||
      this.moodDrops.length > 0 ||
      this.moodBusy + this.moodHot + this.moodFull + this.moodTired > 0.01 ||
      !this.moodHop.landed
    );
    const springMoving =
      Math.abs(this.physDx) > 0.005 ||
      Math.abs(this.physDy) > 0.005 ||
      Math.abs(this.physVx) > 0.01 ||
      Math.abs(this.physVy) > 0.01;
    const outfitChanging = this.outfit !== this.outfitTarget;
    return (
      ACTIVE_LOOP_STATES.has(this.state) ||
      this.isMini ||
      moodActive ||
      springMoving ||
      outfitChanging ||
      this.isDancing ||
      this.dancingLevel > 0.001 ||
      this.rollDuration > 0 ||
      this.elapsed < this.busyUntil ||
      this.pendingSparkAt >= 0 ||
      this.gulpStart >= 0 ||
      this.particles.length > 0 ||
      Math.abs(this.tgEs - this.es) > 0.002 ||
      this.slotH > 0.002 ||
      Math.abs(this.slotHTarget) > 0.002 ||
      (this.badge != null && this.badgeS < 0.995)
    );
  }

  blink() {
    if (this.blinkStart >= 0 && this.elapsed - this.blinkStart < envelopeDuration(BLINK_STEPS)) return;
    this.blinkStart = this.elapsed;
    this.markBusyFor(envelopeDuration(BLINK_STEPS));
  }
  squash() {
    this.squashStart = this.elapsed;
    this.markBusyFor(envelopeDuration(SQUASH_SY));
  }
  gulp() {
    this.gulpStart = this.elapsed;
    this.gulpChewStarted = false;
    this.isChewing = false;
    this.slotHTarget = 0.42;
    this.squash();
    this.blink();
    this.markBusyFor(1.3);
    Sound.play("gulp");
  }
  slap() {
    this.interruptGreet();
    if (this.state === "dizzy") return;
    this.slapTimes = this.slapTimes.filter((time) => this.elapsed - time < 1.7);
    this.slapTimes.push(this.elapsed);
    this.squash();
    this.startShake();
    Sound.play("slap");
    if (this.slapTimes.length >= 3) {
      this.slapTimes = [];
      this.onDizzy?.();
    } else {
      this.triggerEmote("annoyed", 0.8);
    }
  }
  doRoll(durationMs: number, turns: number) {
    this.rollStart = this.elapsed;
    this.rollDuration = Math.max(0.08, durationMs / 1000);
    this.rollTurns = turns;
    this.roll = 0;
    this.markBusyFor(this.rollDuration);
  }
  greet() {
    this.triggerEmote("happy", 1.8);
    this.startHop(-0.1);
    this.waveStart = this.elapsed;
    this.waveDuration = 1.4;
    Sound.play("greet");
  }
  interruptGreet() {
    if (this.emote === "happy") { this.emote = null; this.emoteUntil = 0; }
    this.waveStart = -1;
    this.waveDuration = 0;
  }
  emit(type: ParticleKind, count: number) {
    const n = Math.max(0, Math.min(6, count));
    for (let i = 0; i < n; i++) {
      const isZ = type === "z";
      const isSweat = type === "sweat";
      const spread = n > 1 ? i / (n - 1) - 0.5 : 0;
      this.particles.push({
        type,
        x: (isZ ? 76 : 74) + spread * 14,
        y: isSweat ? 16 + i * 2 : 18 - i * 1.5,
        vx: isZ ? 6 + Math.abs(spread) * 4 : isSweat ? (spread < 0 ? -7 : 7) : spread * 16,
        vy: isSweat ? 15 + i * 2 : -(14 + Math.abs(spread) * 6),
        age: -i * 0.08,
        life: isSweat ? 0.78 : 1.05,
        size: isZ ? 6.5 : 3.4,
      });
    }
    if (this.particles.length > 12) this.particles.splice(0, this.particles.length - 12);
    if (n > 0) this.markBusyFor(1.2);
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
      this.slotH = this.slotHTarget = 0;
      this.isChewing = false;
      this.gulpStart = -1;
      this.pendingSparkAt = -1;
      this.particles = [];
      this.moodBusy = this.moodHot = this.moodFull = this.moodTired = 0;
      this.moodDrops = [];
      this.moodHop = restingHop();
      this.stressTremble = { x: 0, y: 0 };
      this.moodEye = null;
      this.physDx = this.physDy = this.physVx = this.physVy = 0;
      this.outfit = this.outfitTarget;
      this.outfitPresence = this.outfit === "none" ? 0 : 1;
      this.ox = 0;
      this.oy = 0;
      this.eyeOpen = 1;
      this.animTilt = 0;
      this.animSx = 1;
      this.animSy = 1;
      this.badgeS = this.badge ? 1 : 0;
      return;
    }
    this.dancingLevel = stepDanceLevel(this.dancingLevel, this.isDancing, step);
    this.es += (this.tgEs - this.es) * (1 - Math.exp(-step * 9));
    this.slotH += (this.slotHTarget - this.slotH) * (1 - Math.exp(-step * 16));
    if (this.outfit !== this.outfitTarget || Math.abs((this.outfitTarget === "none" ? 0 : 1) - this.outfitPresence) > 0.005) {
      const targetPresence = this.outfitTarget === "none" ? 0 : 1;
      this.outfitPresence += (targetPresence - this.outfitPresence) * (1 - Math.exp(-step * 14));
      if (Math.abs(targetPresence - this.outfitPresence) <= 0.01) {
        this.outfitPresence = targetPresence;
        this.outfit = this.outfitTarget;
      }
    }

    if (this.pendingSparkAt >= 0 && this.elapsed >= this.pendingSparkAt) {
      this.pendingSparkAt = -1;
      this.emit("spark", 5);
    }

    if (this.gulpStart >= 0) {
      const gulpAge = this.elapsed - this.gulpStart;
      if (!this.gulpChewStarted && gulpAge >= 0.46) {
        this.gulpChewStarted = true;
        this.slotHTarget = 0;
        this.isChewing = true;
      }
      if (gulpAge >= 1.26) {
        this.isChewing = false;
        this.gulpStart = -1;
      }
    }

    if (this.rollDuration > 0) {
      const p = Math.min(1, (this.elapsed - this.rollStart) / this.rollDuration);
      this.roll = this.rollTurns * Math.PI * 2 * (1 - Math.pow(1 - p, 3));
      if (p >= 1) { this.roll = 0; this.rollDuration = 0; }
    }

    // One-shot gesture envelopes
    if (this.blinkStart >= 0) {
      const age = this.elapsed - this.blinkStart;
      this.eyeOpen = evalEnvelope(age, 1, BLINK_STEPS);
      if (age >= envelopeDuration(BLINK_STEPS)) { this.blinkStart = -1; this.eyeOpen = 1; }
    } else {
      this.eyeOpen = 1;
    }

    let gestureSx = 1;
    let gestureSy = 1;
    if (this.squashStart >= 0) {
      const age = this.elapsed - this.squashStart;
      gestureSx = evalEnvelope(age, 1, SQUASH_SX);
      gestureSy = evalEnvelope(age, 1, SQUASH_SY);
      if (age >= envelopeDuration(SQUASH_SY)) this.squashStart = -1;
    }
    if (this.isChewing) {
      const chew = Math.sin(this.elapsed * 18) * 0.03;
      gestureSx *= 1 - chew * 0.6;
      gestureSy *= 1 + chew;
    }

    let gestureOx = 0;
    if (this.shakeStart >= 0) {
      const age = this.elapsed - this.shakeStart;
      gestureOx = evalEnvelope(age, 0, ERROR_SHAKE);
      if (age >= envelopeDuration(ERROR_SHAKE)) this.shakeStart = -1;
    }

    let gestureOy = 0;
    if (this.hopStart >= 0) {
      const age = this.elapsed - this.hopStart;
      const steps: ReadonlyArray<EnvelopeStep> = [[0.14, this.hopAmp], [0.28, 0]];
      gestureOy = evalEnvelope(age, 0, steps);
      if (age >= 0.42) this.hopStart = -1;
    }

    let gestureTilt = 0;
    if (this.waveStart >= 0) {
      const age = this.elapsed - this.waveStart;
      if (age >= this.waveDuration) {
        this.waveStart = -1;
      } else {
        const envelope = Math.sin(Math.PI * Math.min(1, age / this.waveDuration));
        gestureTilt = Math.sin(age * 9.5) * 0.09 * envelope;
      }
    }

    if (this.badgePopStart >= 0) {
      const age = this.elapsed - this.badgePopStart;
      this.badgeS = evalEnvelope(age, 0.05, BADGE_POP);
      if (age >= envelopeDuration(BADGE_POP)) { this.badgePopStart = -1; this.badgeS = this.badge ? 1 : 0; }
    }

    // Continuous active-state P1 motion
    const t = Math.max(0, this.elapsed - this.stateStart);
    let stateOx = 0;
    let stateOy = 0;
    let stateTilt = 0;
    let stateSx = 1;
    let stateSy = 1;
    switch (this.state) {
      case "working":
        stateOy = Math.sin(t * 4.2) * 0.032;
        stateSy = 1 + Math.sin(t * 4.2) * 0.025;
        stateSx = 1 - Math.sin(t * 4.2) * 0.015;
        stateTilt = Math.sin(t * 2.1) * 0.018;
        break;
      case "thinking":
        stateOy = Math.sin(t * 2.4) * 0.022;
        stateTilt = Math.sin(t * 1.9) * 0.028;
        break;
      case "searching":
        stateTilt = Math.sin(t * 2.6) * 0.032;
        break;
      case "approval":
        stateOy = -Math.abs(Math.sin(t * 5.2)) * 0.085;
        stateSy = 1 + Math.abs(Math.sin(t * 5.2)) * 0.03;
        stateSx = 1 - Math.abs(Math.sin(t * 5.2)) * 0.02;
        break;
      case "ratelimit":
        stateOx = Math.sin(t * 24) * 0.014;
        stateSy = 1 + Math.sin(t * 3.4) * 0.032;
        stateSx = 1 - Math.sin(t * 3.4) * 0.018;
        break;
      case "sleeping":
        stateSy = 1 + Math.sin(t * 1.8) * 0.042;
        stateSx = 1 - Math.sin(t * 1.8) * 0.024;
        break;
      case "dizzy":
        stateTilt = Math.sin(t * 4.2 + 0.85) * 0.075;
        break;
    }

    this.ox = gestureOx + stateOx;
    this.oy = gestureOy + stateOy;
    this.animTilt = gestureTilt + stateTilt;
    this.animSx = gestureSx * stateSx;
    this.animSy = gestureSy * stateSy;

    if (this.isMini) this.updateMiniBehavior(t);
    else this.updateMood(step);
    this.updateSecondaryPhysics(step);

    if (this.particles.length > 0) {
      const alive: Particle[] = [];
      for (const p of this.particles) {
        const age = p.age + step;
        if (age >= p.life) continue;
        if (age > 0) {
          p.x += p.vx * step;
          p.y += p.vy * step;
        }
        p.age = age;
        alive.push(p);
      }
      this.particles = alive;
    }
  }

  private easeLevel(curr: number, target: number, k: number) {
    const next = curr + (target - curr) * k;
    return target === 0 && Math.abs(next) < 0.002 ? 0 : next;
  }

  private updateMiniBehavior(t: number) {
    // Discreet idle breathe even when idle, autonomous wandering look, and periodic permanentEmote actions.
    if (this.state === "idle") {
      this.animSy *= 1 + Math.sin(t * 2.2) * 0.04;
      this.animSx *= 1 - Math.sin(t * 2.2) * 0.022;
    }
    if (this.elapsed >= this.miniLookNext) {
      this.miniLook = { x: -0.85 + Math.random() * 1.7, y: -0.5 + Math.random() * 0.9 };
      this.miniLookNext = this.elapsed + 0.7 + Math.random() * 1.4;
    }
    if (this.permanentEmote && this.elapsed >= this.miniNextBehavior) {
      switch (this.permanentEmote) {
        case "happy":
          this.startHop(-0.18);
          this.squash();
          break;
        case "annoyed":
          this.startShake();
          break;
        case "wink":
          this.eyeOverride = "wink";
          this.eyeOverrideUntil = this.elapsed + 0.55;
          this.waveStart = this.elapsed;
          this.waveDuration = 0.6;
          break;
        case "love":
          this.emit("heart", 2);
          this.waveStart = this.elapsed;
          this.waveDuration = 0.75;
          break;
      }
      this.miniNextBehavior = this.elapsed + 2.4 + Math.random() * 1.4;
    }
  }

  private updateMood(step: number) {
    const shows = MOOD_ACTIVE_STATES.has(this.state);
    const calm = CALM_STATES.has(this.state);
    const target = this.moodTarget;
    const k = 1 - Math.pow(0.25, step);
    this.moodBusy = this.easeLevel(this.moodBusy, shows ? target.busy : 0, k);
    this.moodHot = this.easeLevel(this.moodHot, shows ? target.hot : 0, k);
    this.moodFull = this.easeLevel(this.moodFull, shows ? target.full : 0, k);
    this.moodTired = this.easeLevel(this.moodTired, calm ? target.tired : 0, k);
    const sleeping = calm && target.asleep;

    if (this.moodFull > 0.01) {
      const throb = Math.sin(this.elapsed * 3.8) * 0.025 * this.moodFull;
      this.animSx *= 1 + 0.1 * this.moodFull + throb;
      this.animSy *= 1 - 0.055 * this.moodFull - throb * 0.7;
    }

    if (this.moodBusy > 0.02 || !this.moodHop.landed) {
      let hop = this.moodHop;
      const p = hop.duration > 0 ? Math.min(1, (this.elapsed - hop.start) / hop.duration) : 1;
      if (p >= 1) {
        if (!hop.landed) {
          hop.landed = true;
          this.squash();
        }
        if (this.moodBusy > 0.02 && this.elapsed >= hop.start + hop.duration + hop.rest) {
          this.moodHop = hop = nextHop(hop, this.moodBusy, this.elapsed);
        }
      }
      const q = Math.min(1, hop.duration > 0 ? (this.elapsed - hop.start) / hop.duration : 1);
      const { x, lift, dir } = hopAt(hop, q);
      const amount = Math.min(1, this.moodBusy * 1.4);
      this.ox += x * amount;
      this.oy -= lift * amount;
      if (!hop.landed) this.animTilt += dir * 0.12 * Math.sin(Math.PI * q) * amount;
      const tremble = Math.min(1, this.moodBusy * 1.3);
      this.stressTremble = tremble > 0.01
        ? { x: Math.sin(this.elapsed * 63) * 0.012 * tremble, y: Math.cos(this.elapsed * 51) * 0.01 * tremble }
        : { x: 0, y: 0 };
      this.ox += this.stressTremble.x;
      this.oy += this.stressTremble.y;
    } else {
      this.stressTremble = { x: 0, y: 0 };
    }

    if (this.elapsed >= this.nextMoodDrop) {
      if (this.moodBusy > 0.4) {
        this.moodDrops.push(throwDrop(this.elapsed, this.ox, this.oy));
        this.nextMoodDrop = this.elapsed + 0.22 + Math.random() * 0.2;
      } else if (this.moodHot > 0.6) {
        this.moodDrops.push(throwDrop(this.elapsed, this.ox, this.oy));
        this.nextMoodDrop = this.elapsed + 0.6 + Math.random() * 0.45;
      } else {
        this.nextMoodDrop = this.elapsed + 0.3;
      }
      if (this.moodDrops.length > 24) this.moodDrops.shift();
    }
    if (this.moodDrops.length > 0) {
      this.moodDrops = this.moodDrops.filter((d) => !dropGone(d, this.elapsed));
    }

    if (sleeping) {
      this.moodEye = "closed";
      if (this.elapsed >= this.nextMoodYawn) {
        this.emit("z", 1);
        this.nextMoodYawn = this.elapsed + 1.6;
      }
    } else if (this.moodTired > 0.5) {
      this.moodEye = "tired";
      if (this.elapsed >= this.nextMoodYawn) {
        if (this.nextMoodYawn > 0) this.triggerEmote("yawn", 1.2);
        this.nextMoodYawn = this.elapsed + 24;
      }
    } else {
      this.moodEye = null;
    }
  }

  private updateSecondaryPhysics(step: number) {
    if (step <= 0) return;
    const oxVel = (this.ox - this.prevOx) / step;
    const oyVel = (this.oy - this.prevOy) / step;
    const dRoll = this.roll - this.prevRoll;
    const rollVel = Math.abs(dRoll) > Math.PI ? 0 : dRoll / step;
    const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
    const tDx = clamp1(-oxVel * 0.45 - this.lookX * 0.35 - this.animTilt * 2 + rollVel * 0.12);
    const tDy = clamp1(oyVel * 0.5 + this.lookY * 0.25);
    this.physVx += (60 * (tDx - this.physDx) - 9 * this.physVx) * step;
    this.physVy += (60 * (tDy - this.physDy) - 9 * this.physVy) * step;
    this.physDx = clamp1(this.physDx + this.physVx * step);
    this.physDy = clamp1(this.physDy + this.physVy * step);
    if (Math.abs(tDx) < 0.002 && Math.abs(this.physDx) < 0.004 && Math.abs(this.physVx) < 0.01) {
      this.physDx = 0;
      this.physVx = 0;
    }
    if (Math.abs(tDy) < 0.002 && Math.abs(this.physDy) < 0.004 && Math.abs(this.physVy) < 0.01) {
      this.physDy = 0;
      this.physVy = 0;
    }
    this.prevOx = this.ox;
    this.prevOy = this.oy;
    this.prevRoll = this.roll;
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
    const activeMoodEye = !reduced && cfg.eyes === "pill" ? this.moodEye : null;
    const eyes = this.elapsed < this.eyeOverrideUntil && this.eyeOverride ? this.eyeOverride :
      emote ? EMOTE_EYE[emote] : activeMoodEye ?? cfg.eyes;
    const eyeOpen = reduced ? 1 : this.eyeOpen;
    const sleepingEyes = this.state === "sleeping" || activeMoodEye === "closed";
    const mouth: MouthShape = emote === "surprised" || emote === "yawn" ? "o" :
      emote === "happy" || emote === "proud" ? "wideSmile" :
      emote === "annoyed" ? "flat" : cfg.mouth;
    const scale = width / 96;
    const sx = reduced ? 1 : this.animSx;
    const sy = reduced ? 1 : this.animSy;
    const stateTilt = cfg.tilt + (reduced ? 0 : this.animTilt);

    ctx.save();
    ctx.translate((width - 96 * scale) / 2, (height - 96 * scale) / 2);
    ctx.scale(scale, scale);

    ctx.save();
    ctx.translate(48 + (reduced ? 0 : this.ox * 32), 49 + (reduced ? 0 : this.oy * 32));
    ctx.rotate(stateTilt + this.tilt + this.roll);
    ctx.scale(sx * this.es, sy * this.es);
    ctx.translate(-48, -49);

    const fill = this.bodyColor ?? CHARACTER_COLOR[this.character];
    const face = CHARACTER_FACE[this.character];
    const motionTime = reduced ? 0 : Math.max(0, this.elapsed - this.stateStart);
    const miniGaze = !reduced && this.isMini && this.lookX === 0 && this.lookY === 0 ? this.miniLook : null;
    const gaze: readonly [number, number] = !reduced && this.state === "searching"
      ? [Math.cos(motionTime * 2.6) * 2.8 + this.lookX * 0.8, -0.5 - this.lookY * 0.8]
      : !reduced && this.state === "thinking"
        ? [cfg.gaze[0] + Math.sin(motionTime * 2.1) * 0.9 + this.lookX * 1.4, cfg.gaze[1] + Math.cos(motionTime * 1.7) * 0.4 - this.lookY * 1.4]
        : [cfg.gaze[0] + (miniGaze ? miniGaze.x : this.lookX) * 2, cfg.gaze[1] - (miniGaze ? miniGaze.y : this.lookY) * 2];
    const spiralPhase = !reduced && this.state === "dizzy" ? motionTime * 4.5 : 0;

    this.drawCharacter(ctx, fill, reduced);
    if (!reduced && !this.isMini && this.moodHot > 0.01 && this.morph < 0.5) {
      const grad = ctx.createRadialGradient(48, 55, 6, 48, 52, 30);
      grad.addColorStop(0, `rgba(255,92,61,${0.32 * this.moodHot})`);
      grad.addColorStop(1, "rgba(255,92,61,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(48, 52, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    this.drawEyes(ctx, eyes, gaze, sleepingEyes, face, spiralPhase, eyeOpen);
    this.drawMouth(ctx, mouth, face);
    this.drawStateAccent(ctx, motionTime);
    if (!reduced && this.particles.length > 0) this.drawParticles(ctx);
    ctx.restore();

    if (!reduced && !this.isMini && this.morph < 0.3) this.drawMoodExtras(ctx);
    ctx.restore();
  }

  private drawMoodExtras(ctx: CanvasRenderingContext2D) {
    for (const drop of this.moodDrops) {
      const age = this.elapsed - drop.born;
      if (age < 0) continue;
      const at = dropAt(drop, age);
      const alpha = drop.alpha * Math.min(1, age / 0.06) * Math.min(1, Math.max(0, (1.05 - at.y) / 0.25));
      this.drawSweatDrop(ctx, 48 + at.x * 28, 49 + at.y * 28, drop.size * 3.6, alpha);
    }
    if (this.moodFull > 0.15) {
      this.drawMemoryGauge(ctx, this.moodFull);
    }
    if (this.moodHot > 0.5) {
      const strength = (this.moodHot - 0.5) * 2;
      ctx.save();
      ctx.strokeStyle = "rgb(255,140,77)";
      ctx.lineWidth = 2.1;
      ctx.lineCap = "round";
      for (let i = 0; i < 3; i++) {
        const wave = heatWave(i, this.elapsed, 48, 49, 28, 30);
        ctx.globalAlpha = strength * wave.opacity;
        ctx.beginPath();
        wave.points.forEach(([px, py], idx) => (idx ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawMemoryGauge(ctx: CanvasRenderingContext2D, level: number) {
    const alpha = Math.min(1, (level - 0.15) / 0.25);
    const critical = level > 0.72;
    const pulse = critical ? 0.55 + 0.45 * Math.abs(Math.sin(this.elapsed * 5.2)) : 1;
    ctx.save();
    ctx.globalAlpha *= alpha;

    // Pinos superiores claros e dentes dourados de pente de memória RAM na base (legíveis sobre fundo escuro)
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (const px of [7.5, 13.5, 19.5]) {
      ctx.strokeStyle = rgbCss(SAND);
      ctx.beginPath(); ctx.moveTo(px, 6.5); ctx.lineTo(px, 9.5); ctx.stroke();
      ctx.strokeStyle = rgbCss(APPROVAL_AMBER);
      ctx.beginPath(); ctx.moveTo(px, 22.5); ctx.lineTo(px, 26); ctx.stroke();
    }

    roundedRect(ctx, 3.5, 9.5, 20, 13, 2.8);
    ctx.fillStyle = rgbCss(INK);
    ctx.fill();
    ctx.strokeStyle = rgbCss(critical ? ERROR_RED : SAND);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Quatro blocos horizontais de uso de RAM (roxo -> vermelho no pico)
    const activeBars = Math.max(1, Math.min(4, Math.ceil(level * 4)));
    for (let i = 0; i < activeBars; i++) {
      const bx = 6 + i * 4.1;
      const isLast = i === 3;
      ctx.fillStyle = isLast && critical ? rgbCss(ERROR_RED, pulse) : rgbCss(MEMORY_VIOLET);
      roundedRect(ctx, bx, 12, 2.9, 8, 0.8);
      ctx.fill();
    }

    if (critical) {
      ctx.beginPath();
      ctx.arc(23.5, 9, 2.3, 0, Math.PI * 2);
      ctx.fillStyle = rgbCss(ERROR_RED, pulse);
      ctx.fill();
      ctx.strokeStyle = rgbCss(INK);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawCharacter(ctx: CanvasRenderingContext2D, fill: RGB, reduced: boolean) {
    const lagX = reduced ? 0 : this.physDx;
    const lagY = reduced ? 0 : this.physDy;
    switch (this.character) {
      case "claude":
        this.drawClaude(ctx, fill, lagX, lagY);
        break;
      case "codex":
        this.drawCodex(ctx, fill, lagX, lagY);
        break;
      case "chatgpt":
        this.drawChatGpt(ctx, fill);
        break;
      case "antigravity":
        this.drawAntigravity(ctx, fill, lagX, lagY, reduced ? 0 : this.elapsed);
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

  private drawClaude(ctx: CanvasRenderingContext2D, fill: RGB, lagX = 0, lagY = 0) {
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
    ctx.lineTo(37 + lagX * 1.4, 25 + lagY * 1.2);
    ctx.lineTo(31 + lagX * 1.6, 20 + lagY * 1.2);
    ctx.lineTo(25 + lagX * 1.4, 25 + lagY * 1.2);
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

  private drawCodex(ctx: CanvasRenderingContext2D, fill: RGB, lagX = 0, lagY = 0) {
    roundedRect(ctx, 18, 16, 59, 69, 20);
    paintOutlinedShape(ctx, fill);
    roundedRect(ctx, 74 + lagX * 1.2, 55 + lagY * 1.2, 14, 27, 7);
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

  private drawAntigravity(ctx: CanvasRenderingContext2D, fill: RGB, lagX = 0, lagY = 0, elapsed = 0) {
    ctx.beginPath();
    ctx.moveTo(48, 13);
    ctx.bezierCurveTo(60, 13, 75, 36, 75, 48);
    ctx.bezierCurveTo(75, 61, 59, 83, 48, 83);
    ctx.bezierCurveTo(37, 83, 21, 61, 21, 48);
    ctx.bezierCurveTo(21, 36, 36, 13, 48, 13);
    ctx.closePath();
    paintOutlinedShape(ctx, fill);

    const floatAmp = elapsed > 0 ? 1.5 : 0;
    [12.5, 83.5].forEach((bx, idx) => {
      const floatDy = Math.sin(elapsed * 2.8 + idx * Math.PI) * floatAmp;
      ctx.beginPath();
      ctx.arc(bx + lagX * 2.2, 61 + lagY * 2.4 + floatDy, 5.5, 0, Math.PI * 2);
      paintOutlinedShape(ctx, fill);
    });
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
    eyeOpen = 1,
  ) {
    const [gx, gy] = gaze;
    for (const side of [-1, 1]) {
      const x = side < 0 ? face.eyeLeftX : face.eyeRightX;
      const y = face.eyeY + gy;
      const eye = shape === "wink" && side > 0 ? "happy" : shape;
      if (eye === "heart") { heart(ctx, x, y, 5.4, BLUSH); continue; }
      if (eye === "star") { star(ctx, x, y, 5.3, SAND); continue; }
      if (eye === "closed" || eye === "happy" || (sleeping && eye === "pill") || eyeOpen < 0.16) {
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
      const baseRy = eye === "tired" ? 3.2 : eye === "wide" ? 8 : 7.5;
      const ry = baseRy * Math.max(0.2, eyeOpen);
      ctx.beginPath();
      ctx.ellipse(x + gx, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgbCss(INK);
      ctx.fill();
      if (eye !== "tired") {
        if (eyeOpen > 0.45) {
          ctx.beginPath();
          ctx.arc(x + gx - 2, y - 2.2 * eyeOpen, 1.9, 0, Math.PI * 2);
          ctx.fillStyle = rgbCss(SAND);
          ctx.fill();
        }
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
    if (this.isChewing) {
      const pinch = Math.abs(Math.sin(this.elapsed * 16));
      ctx.beginPath();
      ctx.ellipse(mx, y + 1, 5.5 - pinch * 1.2, 1.5 + pinch * 2.2, 0, 0, Math.PI * 2);
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

  private drawSweatDrop(ctx: CanvasRenderingContext2D, tipX: number, tipY: number, scale = 1, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
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
    ctx.restore();
  }

  private drawSweat(ctx: CanvasRenderingContext2D, multiple = false, motionTime = 0) {
    const drops: ReadonlyArray<readonly [number, number, number]> = multiple
      ? [[81, 17, 0.95], [65, 9, 0.8], [24, 21, 0.85], [34, 9, 0.7]]
      : [[81, 17, 1]];
    drops.forEach(([x, y, scale], idx) => {
      if (motionTime <= 0) {
        this.drawSweatDrop(ctx, x, y, scale);
        return;
      }
      const p = (motionTime * 0.95 + idx * 0.27) % 1;
      const alpha = p < 0.78 ? 1 : 1 - (p - 0.78) / 0.22;
      this.drawSweatDrop(ctx, x, y + p * 7, scale * (0.9 + p * 0.15), alpha);
    });
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

  private drawSleepZ(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, alpha = 1) {
    const h = size * 0.5;
    ctx.save();
    ctx.globalAlpha *= alpha;
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
    ctx.restore();
  }

  private drawScaledAccent(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, drawFn: () => void) {
    if (s <= 0.01) return;
    ctx.save();
    if (Math.abs(s - 1) > 0.005) {
      ctx.translate(cx, cy);
      ctx.scale(s, s);
      ctx.translate(-cx, -cy);
    }
    drawFn();
    ctx.restore();
  }

  private drawWorkingDesk(ctx: CanvasRenderingContext2D, motionTime: number, popScale: number) {
    // Mini monitor/terminal no canto superior direito com linhas de código animadas
    this.drawScaledAccent(ctx, 77, 15, popScale, () => {
      roundedRect(ctx, 61, 4, 32, 20, 4.5);
      ctx.fillStyle = rgbCss(SAND);
      ctx.fill();
      ctx.strokeStyle = rgbCss(INK);
      ctx.lineWidth = 2.4;
      ctx.stroke();

      roundedRect(ctx, 64, 7, 26, 14, 2);
      ctx.fillStyle = rgbCss(INK);
      ctx.fill();

      const line1W = motionTime > 0 ? 10 + Math.abs(Math.sin(motionTime * 4.5)) * 9 : 14;
      const line2W = motionTime > 0 ? 7 + Math.abs(Math.cos(motionTime * 3.8)) * 8 : 11;
      const cursorOn = motionTime <= 0 || Math.sin(motionTime * 8) > -0.2;
      ctx.lineCap = "round";
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = rgbCss(TEAL);
      ctx.beginPath(); ctx.moveTo(66.5, 10.5); ctx.lineTo(66.5 + line1W, 10.5); ctx.stroke();
      ctx.strokeStyle = rgbCss(SAND);
      ctx.beginPath(); ctx.moveTo(66.5, 14.2); ctx.lineTo(66.5 + line2W, 14.2); ctx.stroke();
      if (cursorOn) {
        roundedRect(ctx, 66.5, 16.8, 5, 2.2, 0.8);
        ctx.fillStyle = rgbCss(APPROVAL_AMBER);
        ctx.fill();
      }

      ctx.strokeStyle = rgbCss(INK);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(77, 24); ctx.lineTo(77, 27.5);
      ctx.moveTo(71.5, 27.5); ctx.lineTo(82.5, 27.5);
      ctx.stroke();
    });

    // Mini teclado à frente sem cobrir boca ou olhos
    const leftTap = motionTime > 0 ? Math.sin(motionTime * 12) * 1.2 : 0;
    const rightTap = motionTime > 0 ? -Math.sin(motionTime * 12) * 1.2 : 0;
    roundedRect(ctx, 27, 75, 42, 13.5, 4.5);
    ctx.fillStyle = rgbCss(SAND);
    ctx.fill();
    ctx.strokeStyle = rgbCss(INK);
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.fillStyle = rgbCss(INK);
    for (let i = 0; i < 6; i++) {
      roundedRect(ctx, 30.5 + i * 6, 78, 4.2, 2.8, 0.9);
      ctx.fill();
    }
    roundedRect(ctx, 34, 82.8, 28, 3, 1.2);
    ctx.fill();

    for (const [hx, dy] of [[25, leftTap], [71, rightTap]] as const) {
      ctx.beginPath();
      ctx.arc(hx, 81 + dy, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = rgbCss(SAND);
      ctx.fill();
      ctx.strokeStyle = rgbCss(INK);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private drawStateAccent(ctx: CanvasRenderingContext2D, motionTime = 0) {
    if (this.showsUpdateHint) {
      this.drawScaledAccent(ctx, 83.5, 11.5, this.badgeS || 1, () => {
        roundedRect(ctx, 76, 5, 15, 13, 3);
        ctx.fillStyle = rgbCss(this.updateHint ?? SAND);
        ctx.fill();
        ctx.strokeStyle = rgbCss(INK);
        ctx.lineWidth = 2;
        ctx.stroke();
        curve(ctx, 83.5, 7, 83.5, 11, 83.5, 15, 1.5);
      });
      return;
    }
    const popScale = this.badgeS > 0 ? this.badgeS : 1;
    switch (this.state) {
      case "working": {
        this.drawWorkingDesk(ctx, motionTime, popScale);
        break;
      }
      case "thinking": {
        this.drawScaledAccent(ctx, 79, 13, popScale, () => {
          roundedRect(ctx, 66, 5, 27, 16, 8);
          ctx.fillStyle = rgbCss(SAND);
          ctx.fill();
          ctx.strokeStyle = rgbCss(INK);
          ctx.lineWidth = 2.4;
          ctx.stroke();
          [73.5, 79.5, 85.5].forEach((dx, idx) => {
            const wave = motionTime > 0 ? Math.max(0, Math.sin(motionTime * 5.2 - idx * 0.9)) : 0;
            ctx.beginPath();
            ctx.arc(dx, 13 - wave * 2.1, 1.4 + wave * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = rgbCss(INK);
            ctx.fill();
          });
          for (const [x, y, r] of [[65, 24, 2.4], [59.5, 29.5, 1.5]] as const) {
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = rgbCss(SAND); ctx.fill(); ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 1.8; ctx.stroke();
          }
        });
        break;
      }
      case "searching": {
        const dx = motionTime > 0 ? Math.cos(motionTime * 2.6) * 2.4 : 0;
        const dy = motionTime > 0 ? Math.sin(motionTime * 5.2) * 1.1 : 0;
        ctx.save();
        ctx.translate(dx, dy);
        for (const [color, width] of [[INK, 5.2], [SAND, 2.4]] as const) {
          ctx.beginPath(); ctx.moveTo(83.5, 20); ctx.lineTo(91.5, 28);
          ctx.strokeStyle = rgbCss(color); ctx.lineWidth = width; ctx.lineCap = "round"; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(77, 13.5, 9, 0, Math.PI * 2);
        ctx.fillStyle = rgbCss(GLASS_TINT); ctx.fill();
        ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 2.8; ctx.stroke();
        ctx.beginPath(); ctx.arc(77, 13.5, 5.5, -Math.PI * 0.85, -Math.PI * 0.25);
        ctx.strokeStyle = rgbCss(CLAUDE_WHITE); ctx.lineWidth = 1.9; ctx.lineCap = "round"; ctx.stroke();
        ctx.restore();
        break;
      }
      case "approval": {
        const pulse = motionTime > 0 ? 1 + Math.sin(motionTime * 6.5) * 0.08 : 1;
        this.drawScaledAccent(ctx, 78, 16, popScale * pulse, () => {
          const arcOut = motionTime > 0 ? (0.5 + 0.5 * Math.sin(motionTime * 6.5)) * 1.6 : 0;
          for (const [ax, cx] of [[64.5 - arcOut, 60.5 - arcOut], [91.5 + arcOut, 95 + arcOut]] as const) {
            curve(ctx, ax, 8.5, cx, 15.5, ax, 22.5, 2.6);
          }
          for (const [x1, y1, x2, y2] of [[68, 5, 70.5, 8], [88, 5, 85.5, 8]] as const) {
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
            ctx.strokeStyle = rgbCss(APPROVAL_AMBER); ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.stroke();
          }
          ctx.beginPath(); ctx.arc(78, 16, 11.5, 0, Math.PI * 2);
          ctx.fillStyle = rgbCss(APPROVAL_AMBER); ctx.fill();
          ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 2.6; ctx.stroke();
          this.drawExclamation(ctx, 78, 9.5, 21.5, INK);
        });
        break;
      }
      case "question": {
        this.drawScaledAccent(ctx, 79, 15, popScale, () => {
          ctx.beginPath(); ctx.arc(79, 15, 10.8, 0, Math.PI * 2);
          ctx.fillStyle = rgbCss(SAND); ctx.fill();
          ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 2.6; ctx.stroke();
          ctx.beginPath(); ctx.arc(79, 11.8, 3.2, -Math.PI * 0.95, Math.PI * 0.35); ctx.lineTo(79, 16.5);
          ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 2.7; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
          ctx.beginPath(); ctx.arc(79, 20.8, 1.6, 0, Math.PI * 2); ctx.fillStyle = rgbCss(INK); ctx.fill();
        });
        break;
      }
      case "error": {
        this.drawScaledAccent(ctx, 79, 16, popScale, () => {
          ctx.beginPath();
          ctx.moveTo(79, 4.5);
          ctx.lineTo(91.5, 25.5);
          ctx.lineTo(66.5, 25.5);
          ctx.closePath();
          ctx.fillStyle = rgbCss(ERROR_RED); ctx.fill();
          ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 2.6; ctx.lineJoin = "round"; ctx.stroke();
          this.drawExclamation(ctx, 79, 11, 21.8, CLAUDE_WHITE);
        });
        break;
      }
      case "finished": {
        this.drawScaledAccent(ctx, 79, 15.5, popScale, () => {
          ctx.beginPath(); ctx.arc(79, 15.5, 10.5, 0, Math.PI * 2);
          ctx.fillStyle = rgbCss(DONE_GREEN); ctx.fill();
          ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 2.6; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(73.5, 15.8); ctx.lineTo(77.3, 19.6); ctx.lineTo(84.8, 11.4);
          ctx.strokeStyle = rgbCss(CLAUDE_WHITE); ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
          star(ctx, 64, 7.5, 3.4, SAND);
          star(ctx, 90, 28, 2.8, SAND);
        });
        break;
      }
      case "ratelimit":
        this.drawSweat(ctx, true, motionTime);
        break;
      case "sleeping": {
        const anchors: ReadonlyArray<readonly [number, number, number]> = [[68, 25.5, 5.2], [76.5, 16, 7.2], [86.5, 6.5, 9]];
        anchors.forEach(([cx, cy, size], idx) => {
          if (motionTime <= 0) {
            this.drawSleepZ(ctx, cx, cy, size);
            return;
          }
          const phase = (motionTime * 0.45 + idx * 0.33) % 1;
          const alpha = phase < 0.15 ? phase / 0.15 : phase > 0.78 ? (1 - phase) / 0.22 : 1;
          this.drawSleepZ(ctx, cx + phase * 3.5, cy - phase * 6.5, size * (0.85 + phase * 0.25), Math.max(0.25, alpha));
        });
        break;
      }
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      if (p.age < 0) continue;
      const t = Math.min(1, p.age / p.life);
      const alpha = t > 0.72 ? Math.max(0, 1 - (t - 0.72) / 0.28) : 1;
      const size = p.size * (p.type === "z" ? 0.9 + t * 0.35 : 1 - t * 0.2);
      ctx.save();
      ctx.globalAlpha *= alpha;
      if (p.type === "heart") heart(ctx, p.x, p.y, size, BLUSH);
      else if (p.type === "star" || p.type === "spark") star(ctx, p.x, p.y, size, SAND);
      else if (p.type === "sweat") this.drawSweatDrop(ctx, p.x, p.y, 0.75, alpha);
      else this.drawSleepZ(ctx, p.x, p.y, size, alpha);
      ctx.restore();
    }
  }
}

export { CompassEngine as BotEngine };
