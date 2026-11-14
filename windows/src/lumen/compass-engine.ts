import type { BotEmoteName, BotStateName } from "../core/layout";
import type { MochiMood } from "../mochi/mood";
import type { Outfit } from "../mochi/wardrobe";
import { Sound } from "../core/sound";

export type RGB = readonly [number, number, number];
export type EyeShape = "pill" | "wide" | "dot" | "line" | "flat" | "happy" | "closed" | "spiral" | "heart" | "star" | "tired" | "wink" | "cup";
export type BadgeKind = "dots" | "bang" | "question" | "dot" | "arrow";
export interface Badge { kind: BadgeKind; color: RGB }
export type TweenKey = readonly [target: number, durationMs: number, ease: (t: number) => number];
export type LumenCharacter = "codex" | "generic";

type MouthShape = "smile" | "wideSmile" | "frown" | "o" | "flat";
interface StateConfig { color: RGB; badge: Badge | null; eyes: EyeShape; mouth: MouthShape; tilt: number; gaze: readonly [number, number] }

const INK: RGB = [0.149, 0.133, 0.294];
const SAND: RGB = [0.957, 0.91, 0.788];
const TEAL: RGB = [0.176, 0.831, 0.749];
const LIGHT_BLUE: RGB = [0.541, 0.706, 0.973];
const BLUSH: RGB = [0.91, 0.57, 0.63];
const NEUTRAL: MochiMood = { busy: 0, hot: 0, full: 0, tired: 0, asleep: false };

const rgbCss = (color: RGB, alpha = 1) => `rgba(${Math.round(color[0] * 255)},${Math.round(color[1] * 255)},${Math.round(color[2] * 255)},${alpha})`;
const EMOTE_EYE: Record<BotEmoteName, EyeShape> = {
  love: "heart", surprised: "wide", proud: "star", wink: "wink", yawn: "tired", happy: "happy", annoyed: "line",
};

export const BOT_STATES: Record<BotStateName, StateConfig> = {
  idle: { color: SAND, badge: null, eyes: "pill", mouth: "smile", tilt: 0, gaze: [0, 0] },
  working: { color: TEAL, badge: null, eyes: "pill", mouth: "smile", tilt: 0.055, gaze: [0, 1.5] },
  thinking: { color: TEAL, badge: { kind: "dots", color: SAND }, eyes: "pill", mouth: "smile", tilt: 0, gaze: [1.5, -1.5] },
  searching: { color: TEAL, badge: { kind: "dots", color: SAND }, eyes: "pill", mouth: "smile", tilt: 0, gaze: [3, 0] },
  approval: { color: TEAL, badge: { kind: "bang", color: SAND }, eyes: "wide", mouth: "smile", tilt: 0, gaze: [0, 0] },
  question: { color: TEAL, badge: { kind: "question", color: SAND }, eyes: "pill", mouth: "o", tilt: -0.04, gaze: [0, 0] },
  error: { color: TEAL, badge: { kind: "dot", color: BLUSH }, eyes: "flat", mouth: "frown", tilt: 0, gaze: [0, 2] },
  finished: { color: TEAL, badge: { kind: "dot", color: SAND }, eyes: "happy", mouth: "wideSmile", tilt: 0, gaze: [0, 0] },
  ratelimit: { color: TEAL, badge: { kind: "dot", color: LIGHT_BLUE }, eyes: "tired", mouth: "flat", tilt: 0, gaze: [0, 1] },
  sleeping: { color: TEAL, badge: null, eyes: "closed", mouth: "smile", tilt: 0, gaze: [0, 0] },
  dizzy: { color: TEAL, badge: null, eyes: "spiral", mouth: "frown", tilt: 0, gaze: [0, 0] },
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
  return agentId === "agent_codex" || agentId === "codex" ? "codex" : "generic";
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
    return this.isDancing || this.dancingLevel > 0.001 || this.elapsed < this.pulseUntil ||
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

    ctx.save();
    ctx.translate((width - 96 * scale) / 2, (height - 96 * scale) / 2);
    ctx.scale(scale, scale);
    ctx.translate(48 + this.ox * 5, 49 + this.oy * 5);
    ctx.rotate(cfg.tilt + this.tilt + this.roll);
    ctx.scale(sx * this.es, sy * this.es);
    ctx.translate(-48, -49);

    const fill = this.bodyColor ?? (this.character === "codex" ? TEAL : SAND);
    const gaze: readonly [number, number] = [cfg.gaze[0] + this.lookX * 2, cfg.gaze[1] - this.lookY * 2];
    if (this.character === "codex") this.drawCodexBody(ctx, fill);
    else this.drawGenericBody(ctx, fill);
    if (this.character === "codex") this.drawToolTab(ctx);
    if (this.character === "generic") this.drawGenericOval(ctx);
    this.drawEyes(ctx, eyes, gaze, this.state === "sleeping");
    this.drawMouth(ctx, mouth, this.character === "generic");
    this.drawStateAccent(ctx);
    if (!reduced && this.elapsed < this.particleUntil) this.drawParticle(ctx);
    ctx.restore();
  }

  private drawCodexBody(ctx: CanvasRenderingContext2D, fill: RGB) {
    roundedRect(ctx, 18, 16, 59, 69, 20);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.shadowColor = "rgba(0,0,0,0.32)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = rgbCss(fill);
    ctx.fill();
    ctx.strokeStyle = rgbCss(INK);
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  private drawToolTab(ctx: CanvasRenderingContext2D) {
    roundedRect(ctx, 74, 55, 14, 27, 7);
    ctx.fillStyle = rgbCss(SAND);
    ctx.fill();
    ctx.strokeStyle = rgbCss(INK);
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  private drawGenericBody(ctx: CanvasRenderingContext2D, fill: RGB) {
    roundedRect(ctx, 16, 12, 64, 72, 21);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.shadowColor = "rgba(0,0,0,0.32)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = rgbCss(fill);
    ctx.fill();
    ctx.strokeStyle = rgbCss(INK);
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  private drawGenericOval(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.ellipse(48, 69, 25, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgbCss(INK);
    ctx.fill();
  }

  private drawEyes(ctx: CanvasRenderingContext2D, shape: EyeShape, gaze: readonly [number, number], sleeping: boolean) {
    const [gx, gy] = gaze;
    for (const side of [-1, 1]) {
      const x = side < 0 ? 34 : 56;
      const y = 43 + gy;
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
          const angle = (i / 18) * Math.PI * 2.4;
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
        curve(ctx, x - 5, y, x, y + (eye === "line" ? 0.5 : 1.5), x + 5, y, 3.4);
        continue;
      }
      const rx = eye === "wide" ? 6.3 : eye === "dot" ? 4.2 : 5.5;
      const ry = eye === "tired" ? 3.4 : eye === "wide" ? 8 : 7.5;
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
        curve(ctx, x - 5.5, y - 2, x, y - 4.5, x + 5.5, y - 2, 2.5);
      }
    }
  }

  private drawMouth(ctx: CanvasRenderingContext2D, shape: MouthShape, generic: boolean) {
    const y = generic ? 57 : 62;
    if (this.morph > 0.1 || this.slotH > 0.08) {
      ctx.beginPath();
      ctx.ellipse(48, 64, 7 + 4 * this.morph, 2.5 + this.slotH * 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgbCss(INK);
      ctx.fill();
      return;
    }
    if (shape === "o") {
      ctx.beginPath();
      ctx.ellipse(48, y, 3.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgbCss(INK);
      ctx.fill();
    } else if (shape === "frown") {
      curve(ctx, 41, y + 3, 48, y - 4, 55, y + 3, 3.2);
    } else if (shape === "flat") {
      curve(ctx, 43, y, 48, y + 0.5, 53, y, 3);
    } else {
      curve(ctx, shape === "wideSmile" ? 38 : 41, y - 1, 48, y + (shape === "wideSmile" ? 10 : 7), shape === "wideSmile" ? 58 : 55, y - 1, shape === "wideSmile" ? 3.6 : 3.2);
    }
  }

  private drawSweat(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.moveTo(79, 18);
    ctx.quadraticCurveTo(73, 27, 79, 30);
    ctx.quadraticCurveTo(85, 27, 79, 18);
    ctx.fillStyle = rgbCss(LIGHT_BLUE);
    ctx.fill();
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
      case "thinking":
      case "searching":
        ctx.beginPath(); ctx.arc(82, 13, 4.2, 0, Math.PI * 2); ctx.arc(74, 3.5, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = rgbCss(SAND); ctx.fill(); ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 1.8; ctx.stroke();
        break;
      case "approval":
        // Opposing side arcs read as a soft attention mark, never stacked Wi-Fi waves.
        curve(ctx, 76, 9, 69, 14, 76, 20, 2.4);
        curve(ctx, 89, 9, 96, 14, 89, 20, 2.4);
        ctx.beginPath(); ctx.arc(82.5, 14.5, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = rgbCss(SAND); ctx.fill(); ctx.strokeStyle = rgbCss(INK); ctx.lineWidth = 1.8; ctx.stroke();
        break;
      case "sleeping":
        ctx.beginPath(); ctx.arc(82, 13, 4, 0, Math.PI * 2); ctx.arc(73.5, 3, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = rgbCss(INK); ctx.fill();
        break;
      case "finished":
        ctx.beginPath(); ctx.arc(82, 13, 3.3, 0, Math.PI * 2); ctx.arc(73.5, 3.5, 2, 0, Math.PI * 2);
        ctx.fillStyle = rgbCss(SAND); ctx.fill();
        break;
      case "error":
        ctx.beginPath(); ctx.arc(82, 14, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = rgbCss(BLUSH); ctx.fill();
        break;
      case "ratelimit":
        this.drawSweat(ctx);
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
