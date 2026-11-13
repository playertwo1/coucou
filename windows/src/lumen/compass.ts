export type CompassMood = "idle" | "active" | "alert";

export interface CompassOptions {
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
  opacity?: number;
  mood?: CompassMood;
  updateHint?: boolean;
  pulse?: number;
}

const INK = "#26224B";
const PAPER = "#F4E8C9";
const SHADE = "#D2BF96";
const CLAY = "#BE5C41";

/** Four folded paper faces meet at a center point; coordinates are relative to size. */
export function compassFaces(size: number) {
  const p = (x: number, y: number) => [size / 2 + x * size, size / 2 + y * size] as const;
  return [
    { color: CLAY, points: [p(0, 0), p(-0.075, -0.035), p(0, -0.31), p(0.075, -0.035)] },
    { color: INK, points: [p(0, 0), p(0.075, -0.035), p(0.31, 0), p(0.075, 0.035)] },
    { color: SHADE, points: [p(0, 0), p(0.075, 0.035), p(0, 0.31), p(-0.075, 0.035)] },
    { color: CLAY, points: [p(0, 0), p(-0.075, 0.035), p(-0.31, 0), p(-0.075, -0.035)] },
    { color: SHADE, points: [p(0, -0.015), p(0.04, -0.055), p(0.19, -0.19), p(0.12, -0.035)] },
    { color: PAPER, points: [p(0.015, 0), p(0.055, 0.04), p(0.19, 0.19), p(0.035, 0.12)] },
    { color: INK, points: [p(0, 0.015), p(-0.04, 0.055), p(-0.19, 0.19), p(-0.12, 0.035)] },
    { color: SHADE, points: [p(-0.015, 0), p(-0.055, -0.04), p(-0.19, -0.19), p(-0.035, -0.12)] },
  ] as const;
}

export function drawCompass(ctx: CanvasRenderingContext2D, width: number, height: number, options: CompassOptions = {}) {
  const size = Math.min(width, height) * 0.82 * (options.scale ?? 1);
  if (!(size > 0)) return;
  const radius = size * 0.36;
  const mood = options.mood ?? "idle";
  const cx = width / 2;
  const cy = height / 2;

  ctx.save();
  ctx.globalAlpha *= options.opacity ?? 1;
  ctx.translate(cx + (options.x ?? 0), cy + (options.y ?? 0));
  ctx.rotate(options.rotation ?? 0);
  ctx.scale(1 + (options.pulse ?? 0) * 0.06, 1 + (options.pulse ?? 0) * 0.06);
  ctx.translate(-cx, -cy);

  ctx.shadowColor = "rgba(16, 14, 37, 0.22)";
  ctx.shadowBlur = size * 0.08;
  ctx.fillStyle = PAPER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1, size * 0.025);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();

  for (const face of compassFaces(size)) {
    ctx.beginPath();
    ctx.moveTo(face.points[0][0] + cx - size / 2, face.points[0][1] + cy - size / 2);
    for (const [x, y] of face.points.slice(1)) ctx.lineTo(x + cx - size / 2, y + cy - size / 2);
    ctx.closePath();
    ctx.fillStyle = face.color;
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(38, 34, 75, 0.55)";
  ctx.lineWidth = Math.max(0.7, size * 0.009);
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.72, cy);
  ctx.lineTo(cx + radius * 0.72, cy);
  ctx.moveTo(cx, cy - radius * 0.72);
  ctx.lineTo(cx, cy + radius * 0.72);
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.047, 0, Math.PI * 2);
  ctx.fill();

  if (options.updateHint || mood === "alert") {
    ctx.fillStyle = CLAY;
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = Math.max(1, size * 0.035);
    ctx.beginPath();
    ctx.arc(cx + radius * 0.72, cy - radius * 0.72, size * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (mood === "active") {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(cx + radius * 0.72, cy - radius * 0.72, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
