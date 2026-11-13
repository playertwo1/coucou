import type { BotEmoteName, BotStateName } from "../core/layout";
import type { MochiMood } from "../mochi/mood";
import type { Outfit } from "../mochi/wardrobe";
import { Sound } from "../core/sound";
import { drawCompass, type CompassMood } from "./compass";

export type RGB = readonly [number, number, number];
export type EyeShape = "pill" | "wide" | "dot" | "line" | "flat" | "happy" | "closed" | "spiral" | "heart" | "star" | "tired" | "wink" | "cup";
export type BadgeKind = "dots" | "bang" | "question" | "dot" | "arrow";
export interface Badge { kind: BadgeKind; color: RGB }
export type TweenKey = readonly [target: number, durationMs: number, ease: (t: number) => number];

interface StateConfig { color: RGB; badge: Badge | null }
const INDIGO: RGB = [0.149, 0.133, 0.294];
const TERRACOTTA: RGB = [0.745, 0.361, 0.255];
const SAND: RGB = [0.831, 0.749, 0.588];
export const BOT_STATES: Record<BotStateName, StateConfig> = {
  idle: { color: SAND, badge: null },
  working: { color: INDIGO, badge: { kind: "dots", color: INDIGO } },
  thinking: { color: INDIGO, badge: { kind: "dots", color: INDIGO } },
  searching: { color: INDIGO, badge: { kind: "dots", color: INDIGO } },
  approval: { color: TERRACOTTA, badge: { kind: "bang", color: TERRACOTTA } },
  question: { color: SAND, badge: { kind: "question", color: TERRACOTTA } },
  error: { color: TERRACOTTA, badge: { kind: "dot", color: TERRACOTTA } },
  finished: { color: INDIGO, badge: { kind: "dot", color: INDIGO } },
  ratelimit: { color: TERRACOTTA, badge: { kind: "dot", color: TERRACOTTA } },
  sleeping: { color: SAND, badge: null },
  dizzy: { color: TERRACOTTA, badge: null },
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

export function stepDanceLevel(level: number, dancing: boolean, dt: number) {
  const target = dancing ? 1 : 0;
  return level + (target - level) * (1 - Math.exp(-Math.max(0, dt) * 7));
}

export function danceTransform(seconds: number, level: number, radius: number) {
  const wave = Math.sin(seconds * Math.PI * 2) * level;
  return { dx: 0, dy: -radius * 0.08 * Math.max(0, wave), rotate: wave * 0.05, sx: 1 + Math.abs(wave) * 0.04, sy: 1 - Math.abs(wave) * 0.035 };
}

export class CompassEngine {
  isMini = false;
  bodyColor: RGB | null = null;
  moodTarget: MochiMood = { busy: 0, hot: 0, full: 0, tired: 0, asleep: false };
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
  onDizzy: (() => void) | null = null;
  private elapsed = 0;
  private pulseUntil = 0;
  private updateHint = false;
  private emote: BotEmoteName | null = null;
  private emoteUntil = 0;
  private targetRotation = 0;
  private rotation = 0;

  setState(next: BotStateName, force = false) {
    if (!force && next === this.state) return;
    this.state = next;
    this.cfg = BOT_STATES[next] ?? BOT_STATES.idle;
    this.badge = this.cfg.badge;
    this.badgeS = this.badge ? 1 : 0;
    this.targetRotation = next === "dizzy" ? Math.PI * 2 : 0;
  }

  setUpdateHint(color: RGB | null) { this.updateHint = color != null; }
  get showsUpdateHint() { return this.updateHint; }
  setBadge(badge: Badge | null) { this.badge = badge; this.badgeS = badge ? 1 : 0; }
  setOutfit(next: Outfit, _animate = true) { this.outfit = next; }
  setPermanentEmote(emote: BotEmoteName | null) { this.permanentEmote = emote; }
  triggerEmote(emote: BotEmoteName, duration = 1.8) { this.emote = emote; this.emoteUntil = this.elapsed + duration; this.pulseUntil = this.elapsed + 0.45; }
  setDancing(dancing: boolean) { this.isDancing = dancing; }
  get busy() { return this.state !== "idle" || this.isDancing || this.elapsed < this.pulseUntil || this.updateHint; }

  blink() { this.pulseUntil = this.elapsed + 0.22; }
  squash() { this.pulseUntil = this.elapsed + 0.35; }
  gulp() { this.pulseUntil = this.elapsed + 0.3; Sound.play("gulp"); }
  slap() { this.triggerEmote("surprised", 0.6); Sound.play("slap"); }
  doRoll(_durationMs: number, turns: number) { this.targetRotation += turns * Math.PI * 2; }
  greet() { this.triggerEmote("happy", 1.2); Sound.play("greet"); }
  interruptGreet() { this.emote = null; }
  emit(_type: "heart" | "star" | "spark" | "sweat" | "z", _count: number) { this.pulseUntil = this.elapsed + 0.45; }
  animateMorph(target: number) { this.morph = Math.max(0, Math.min(1, target)); }
  resetMorph() { this.animateMorph(0); }
  anim(_prop: string, _keys: TweenKey[], onComplete?: () => void) { onComplete?.(); }

  update(dt: number) {
    const step = Math.max(0, Math.min(0.1, dt));
    this.elapsed += step;
    this.dancingLevel = stepDanceLevel(this.dancingLevel, this.isDancing, step);
    this.rotation += (this.targetRotation - this.rotation) * (1 - Math.exp(-step * 8));
    if (this.state === "working" || this.state === "thinking" || this.state === "searching") this.rotation += step * 0.22;
    this.es += (this.tgEs - this.es) * (1 - Math.exp(-step * 9));
  }

  applyDance(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (this.dancingLevel <= 0.001) return;
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
    const alert = this.state === "approval" || this.state === "question" || this.state === "error" || this.state === "ratelimit";
    const mood: CompassMood = alert ? "alert" : this.state === "idle" ? "idle" : "active";
    const pulse = this.elapsed < this.pulseUntil ? 1 : 0;
    drawCompass(ctx, width, height, {
      rotation: this.rotation + this.lookX * 0.035,
      scale: this.es,
      mood,
      updateHint: this.updateHint,
      pulse,
    });
    this.emote = this.elapsed < this.emoteUntil ? this.emote : null;
  }
}

export { CompassEngine as BotEngine };
