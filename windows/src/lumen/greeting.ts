import { Sound } from "../core/sound";
import { drawCompass } from "./compass";

export const GREETING_END = 3.8;
export const GREETING_W = 640;
export const GREETING_H = 150;

export interface CompassPose { x: number; y: number; scale: number; rotation: number; opacity: number }

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const easeOut = (t: number) => 1 - (1 - t) ** 3;

export function greetingPose(seconds: number, collapseAt = Number.POSITIVE_INFINITY): CompassPose {
  const t = Math.max(0, seconds);
  const land = easeOut(clamp(t / 0.95, 0, 1));
  const bounce = t < 1.2 ? Math.sin(t * Math.PI * 3.2) * (1 - t / 1.2) * 8 : 0;
  const waving = clamp((t - 1.3) / 0.5, 0, 1) * (1 - clamp((t - 2.5) / 0.5, 0, 1));
  const elapsedAfterCollapse = t - collapseAt;
  const shrink = Number.isFinite(collapseAt) && elapsedAfterCollapse > 0 ? 1 - easeOut(clamp(elapsedAfterCollapse / 0.34, 0, 1)) : 1;
  return {
    x: 320 - 88 * waving,
    y: 130 - 42 * land - bounce,
    scale: (0.6 + land * 0.4) * shrink,
    rotation: Math.sin(t * 2.2) * 0.06 * waving,
    opacity: shrink,
  };
}

export function compassBounds(pose: CompassPose) {
  const radius = Math.min(GREETING_W, GREETING_H) * 0.82 * pose.scale * 0.36;
  return { left: pose.x - radius, right: pose.x + radius, top: pose.y - radius, bottom: pose.y + radius };
}

export class Greeting {
  private startMs = 0;
  private tc = Number.POSITIVE_INFINITY;
  private fired = false;
  private timers: number[] = [];
  onComplete: (() => void) | null = null;

  start() {
    this.startMs = performance.now();
    this.tc = Number.POSITIVE_INFINITY;
    this.fired = false;
    this.cancelTimers();
    Sound.play("greeting");
    this.timers.push(window.setTimeout(() => this.fire(), GREETING_END * 1000));
  }
  hover() { if (this.tc >= 4.1) this.tc = Number.POSITIVE_INFINITY; }
  interrupt() {
    const t = this.elapsed;
    if (!Number.isFinite(this.tc) || this.tc > t) this.tc = t;
    this.cancelTimers();
    Sound.fadeOut("greeting", 0.2);
  }
  leave() { this.cancelTimers(); Sound.fadeOut("greeting", 0.2); }
  get elapsed() { return (performance.now() - this.startMs) / 1000; }
  get done() { return this.fired; }
  private fire() { if (!this.fired) { this.fired = true; this.cancelTimers(); this.onComplete?.(); } }
  private cancelTimers() { this.timers.forEach((id) => window.clearTimeout(id)); this.timers = []; }
  draw(ctx: CanvasRenderingContext2D) {
    const t = this.elapsed;
    if (!this.fired && t >= GREETING_END && this.tc >= 4.1) this.fire();
    const pose = greetingPose(t, this.tc);
    ctx.clearRect(0, 0, GREETING_W, GREETING_H);
    drawCompass(ctx, GREETING_W, GREETING_H, {
      x: pose.x - GREETING_W / 2,
      y: pose.y - GREETING_H / 2,
      rotation: pose.rotation,
      scale: pose.scale,
      opacity: pose.opacity,
      mood: "active",
    });
  }
}
