// How the PC feels, as Mochi shows it (CoucouKit/MochiMood.swift on the Mac):
// the pure parts — the levels, the sweat drops' flight, the stressed hops and
// the heat waves. The engine (engine.ts) eases the levels and draws them.

/** Each level runs from 0 (not at all) to 1. vitals.ts sets it; nothing else does. */
export interface MochiMood {
  /** The processor is at full load: Mochi sweats and hops about. */
  busy: number;
  /** The PC is warm: Mochi flushes red, heat waves above his head. */
  hot: number;
  /** Memory is short: Mochi puffs up, like after a big meal. */
  full: number;
  /** The battery is low, or hours with the agents: heavy eyelids, a yawn now and then. */
  tired: number;
  /** The battery is nearly empty: Mochi sleeps. */
  asleep: boolean;
}

export const CALM: MochiMood = Object.freeze({ busy: 0, hot: 0, full: 0, tired: 0, asleep: false });

export const isCalm = (m: MochiMood) => !m.busy && !m.hot && !m.full && !m.tired && !m.asleep;

/** A drop of sweat thrown from Mochi's side, in his units (R), from his resting centre. */
export interface MoodDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds, the engine's clock. */
  born: number;
  size: number;
  /** Long or round, lighter or deeper blue, more or less clear. */
  stretch: number;
  tint: number;
  alpha: number;
  wobble: number;
}

/** Gravity of the sweat drops, in R per second². */
export const DROP_GRAVITY = 6;

const between = (rnd: () => number, a: number, b: number) => a + (b - a) * rnd();

/** A drop leaving one of his sides, rising, then falling in an arc. `ox`/`oy`: where he is. */
export function throwDrop(now: number, ox: number, oy: number, rnd: () => number = Math.random): MoodDrop {
  const side = rnd() < 0.5 ? 1 : -1;
  // Now and then a small round droplet, mostly a full drop.
  const small = rnd() < 0.3;
  return {
    x: side * between(rnd, 0.92, 1.05) + ox,
    y: between(rnd, -0.5, -0.25) + oy,
    vx: side * between(rnd, 0.5, 1.0),
    vy: -between(rnd, 1.5, 2.4),
    born: now,
    size: small ? between(rnd, 0.09, 0.13) : between(rnd, 0.15, 0.26),
    stretch: small ? between(rnd, 0.75, 0.95) : between(rnd, 1.0, 1.55),
    tint: rnd(),
    alpha: between(rnd, 0.7, 1),
    wobble: between(rnd, 0, 2 * Math.PI),
  };
}

/** Where a drop is `age` seconds after it left, and how fast it falls. */
export function dropAt(d: MoodDrop, age: number) {
  return {
    x: d.x + d.vx * age,
    y: d.y + d.vy * age + (DROP_GRAVITY * age * age) / 2,
    vy: d.vy + DROP_GRAVITY * age,
  };
}

/** Past its time or below the floor. */
export const dropGone = (d: MoodDrop, now: number) => now - d.born > 1.6 || dropAt(d, now - d.born).y > 1.05;

/** One of Mochi's stressed hops, from side to side. */
export interface MoodHop {
  from: number;
  to: number;
  start: number;
  duration: number;
  height: number;
  rest: number;
  landed: boolean;
}

export const restingHop = (): MoodHop => ({ from: 0, to: 0, start: 0, duration: 0.2, height: 0, rest: 0, landed: true });

/** The next hop after `last`: elsewhere on the floor, never twice the same; small when barely busy. */
export function nextHop(last: MoodHop, level: number, now: number, rnd: () => number = Math.random): MoodHop {
  let to = 0;
  if (level > 0.3) {
    do to = between(rnd, -0.28, 0.28); while (Math.abs(to - last.to) < 0.12);
  }
  return {
    from: last.to,
    to,
    start: now,
    duration: between(rnd, 0.22, 0.4),
    height: level > 0.3 ? between(rnd, 0.07, 0.18) : 0.05,
    rest: between(rnd, 0.1, 0.55),
    landed: false,
  };
}

/** A hop `q` (0…1) of the way: sideways shift, lift and lean direction. */
export function hopAt(hop: MoodHop, q: number) {
  const eased = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
  return {
    x: hop.from + (hop.to - hop.from) * eased,
    lift: hop.landed ? 0 : Math.sin(Math.PI * q) * hop.height,
    dir: hop.to >= hop.from ? 1 : -1,
  };
}

/** Points of one heat wave: three of them rise above the head, `i` 0…2, `t` in seconds. */
export function heatWave(i: number, t: number, cx: number, cy: number, R: number, ry: number) {
  const x0 = cx + (i - 1) * R * 0.42;
  const phase = t * 3 + i * 1.7;
  const rise = (t * 0.6 + i * 0.33) % 1;
  const top = cy - ry * 1.18 - R * 0.55 * rise;
  const points: [number, number][] = [];
  for (let s = 0; s <= 12; s++) {
    const f = s / 12;
    points.push([x0 + Math.sin(phase + f * 6) * R * 0.07, top - f * R * 0.5]);
  }
  return { points, opacity: Math.sin(rise * Math.PI) };
}
