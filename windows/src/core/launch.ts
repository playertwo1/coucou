// A new Claude Code session from the island, and a file dropped on a session —
// the pure part of SessionLauncher.swift / LaunchScript.swift / SessionDrop.swift.
//
// The projects offered are the folders Claude Code sessions ran in (from the
// hooks), most recent first, ten at most, never the home folder, a root or a
// temp folder.
// They are a per-install convenience, so the webview's storage keeps them:
// lost, the list fills again with the next sessions. The terminal itself is
// opened by Rust (src-tauri/src/launch.rs).

import type { AgentTask } from "./state";
import { HOST_OS } from "./pills";

export const MAX_PROJECTS = 10;

const PROJECTS_KEY = "coucou.launch.projects";
const FOLDER_KEY = "coucou.launch.folder";
const AGENT_KEY = "coucou.launch.agent";

export const LAUNCH_AGENTS = ["claude", "codex", "antigravity", "hermes"] as const;
export type LaunchAgent = (typeof LAUNCH_AGENTS)[number];

export interface LaunchAgentStatus {
  agent: LaunchAgent;
  available: boolean;
}

export type LaunchError = "invalidFolder" | "invalidPrompt" | "agentUnavailable" | "terminalStartFailed" | "synthetic";

export interface LaunchResult {
  ok: boolean;
  error: LaunchError | null;
}

/** The folder without its trailing separators ("C:\" and "/" stay as they are). */
export function normalizeFolder(path: string): string {
  let p = path.trim();
  while (p.length > 1 && /[\\/]$/.test(p) && !/^[A-Za-z]:\\$/.test(p)) p = p.slice(0, -1);
  return p;
}

/** A root ("/", "C:\", "C:") or a home folder (/home/me, /root, C:\Users\me): never a project. */
export function isRootOrHome(path: string): boolean {
  const p = normalizeFolder(path);
  return (
    p === "/" ||
    /^[A-Za-z]:\\?$/.test(p) ||
    /^\/(?:home|Users)\/[^/]+$/.test(p) ||
    p === "/root" ||
    /^[A-Za-z]:\\Users\\[^\\]+$/i.test(p)
  );
}

/**
 * In the temp folder (%TEMP% under C:\Users\me, /tmp, /var/tmp): never a project.
 * Tools run short Claude Code sessions there and delete the folder afterwards.
 */
export function isTemp(path: string): boolean {
  const p = normalizeFolder(path);
  return /^[A-Za-z]:\\Users\\[^\\]+\\AppData\\Local\\Temp(?:\\|$)/i.test(p) || /^\/(?:var\/)?tmp(?:\/|$)/.test(p);
}

/**
 * Projects, most recent first: `folder` in front, no duplicate (letter case
 * ignored on Windows, where paths ignore it), ten at most. The home folder,
 * a root, a temp folder or a relative path leaves the list as it is.
 */
export function rememberProject(folder: string, list: readonly string[], windows: boolean, max = MAX_PROJECTS): string[] {
  const path = normalizeFolder(folder);
  const absolute = path.startsWith("/") || /^[A-Za-z]:\\/.test(path) || path.startsWith("\\\\");
  if (!path || !absolute || isRootOrHome(path) || isTemp(path)) return [...list];
  const same = (a: string) => (windows ? a.toLowerCase() === path.toLowerCase() : a === path);
  return [path, ...list.filter((p) => !same(p))].slice(0, max);
}

/** The name shown for a project: its last folder name. */
export function projectName(path: string): string {
  const p = normalizeFolder(path);
  return p.split(/[\\/]/).filter(Boolean).pop() ?? p;
}

function read(key: string): string | null {
  try {
    return window.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // Storage refused: the list fills again with the next sessions.
  }
}

function readProjects(): string[] {
  try {
    const list = JSON.parse(read(PROJECTS_KEY) ?? "[]");
    // Temp folders remembered before isTemp existed are dropped here.
    return Array.isArray(list) ? list.filter((p): p is string => typeof p === "string" && !isTemp(p)).slice(0, MAX_PROJECTS) : [];
  } catch {
    return [];
  }
}

/** The projects and the one the next session starts in (SessionLauncher). */
export class Launcher {
  projects: string[];
  folder: string | null;
  agent: LaunchAgent;
  private readonly windows: boolean;

  constructor(windows: boolean) {
    this.windows = windows;
    this.projects = readProjects();
    this.folder = read(FOLDER_KEY) || this.projects[0] || null;
    const savedAgent = read(AGENT_KEY);
    this.agent = LAUNCH_AGENTS.includes(savedAgent as LaunchAgent) ? (savedAgent as LaunchAgent) : "claude";
  }

  /** Each Claude Code session teaches it a project. */
  remember(folder: string) {
    const list = rememberProject(folder, this.projects, this.windows);
    if (list.join("\n") !== this.projects.join("\n")) {
      this.projects = list;
      write(PROJECTS_KEY, JSON.stringify(list));
    }
    if (this.folder == null) this.folder = list[0] ?? null;
  }

  /** The folder the next session starts in; a folder picked elsewhere joins the list. */
  choose(folder: string) {
    this.remember(folder);
    this.folder = normalizeFolder(folder);
    write(FOLDER_KEY, this.folder);
  }

  chooseAgent(agent: unknown): boolean {
    if (!LAUNCH_AGENTS.includes(agent as LaunchAgent)) return false;
    this.agent = agent as LaunchAgent;
    write(AGENT_KEY, this.agent);
    return true;
  }
}

/** The one launcher of this window. */
export const Launch = new Launcher(HOST_OS === "windows");

// ── Drop on a session ─────────────────────────────────────────────────────────

const CLAUDE_DESKTOP_ID = "agent_claude-desktop";

/** Sessions offered while a file is dragged over the island: three at most. */
export const MAX_DROP_TARGETS = 3;

/** The pills a file can go to: those with a session in a terminal or an editor. */
export function dropTargets(tasks: readonly AgentTask[]): AgentTask[] {
  return tasks.filter((t) => !!t.sessionId && t.id !== CLAUDE_DESKTOP_ID).slice(0, MAX_DROP_TARGETS);
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Where the list sits on the drop card, in island points (the card is
 * 10…630 × 42…166): on its right, 22 from the edge, 150 wide, centred
 * vertically — the Mac's SessionDropTargets.
 */
export const DROP_LIST = { right: 608, w: 150, titleH: 14, rowH: 22, gap: 5, centreY: 104 } as const;

export function dropTargetsLayout(count: number): { title: Rect; rows: Rect[] } {
  const n = Math.max(0, Math.min(count, MAX_DROP_TARGETS));
  const { right, w, titleH, rowH, gap, centreY } = DROP_LIST;
  const height = titleH + n * (gap + rowH);
  const top = Math.round(centreY - height / 2);
  const x = right - w;
  const rows = Array.from({ length: n }, (_, i) => ({ x, y: top + titleH + gap + i * (rowH + gap), w, h: rowH }));
  return { title: { x, y: top, w, h: titleH }, rows };
}

/** The row under the pointer (island points), with 4 points of slack, or null. */
export function dropTargetAt(x: number, y: number, count: number): number | null {
  const rows = dropTargetsLayout(count).rows;
  const i = rows.findIndex((r) => x >= r.x - 4 && x <= r.x + r.w + 4 && y >= r.y - 4 && y <= r.y + r.h + 4);
  return i >= 0 ? i : null;
}

/** Where the drop card's text must stop so it never runs under the list. */
export const DROP_TEXT_RIGHT_WITH_LIST = DROP_LIST.right - DROP_LIST.w - 12;
