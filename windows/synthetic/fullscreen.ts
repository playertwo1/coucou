export interface SyntheticRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SyntheticMonitor {
  id: string;
  bounds: SyntheticRect;
}

export interface SyntheticWindow {
  id: string;
  kind: "application" | "desktop" | "taskbar" | "coucou";
  visible: boolean;
  minimized: boolean;
  bounds: SyntheticRect;
}

function validRect(rect: unknown): rect is SyntheticRect {
  if (!rect || typeof rect !== "object") return false;
  const { x, y, width, height } = rect as SyntheticRect;
  return [x, y, width, height].every(Number.isFinite)
    && width > 0 && height > 0
    && Number.isFinite(x + width) && Number.isFinite(y + height);
}

export function coveringSyntheticMonitors(
  window: SyntheticWindow | null | undefined,
  monitors: readonly SyntheticMonitor[],
): string[] {
  if (!window || window.kind !== "application" || !window.visible || window.minimized || !validRect(window.bounds)) return [];

  const { x, y, width, height } = window.bounds;
  return monitors.filter((monitor) => {
    if (!monitor || typeof monitor.id !== "string" || monitor.id.length === 0 || !validRect(monitor.bounds)) return false;
    const bounds = monitor.bounds;
    return x <= bounds.x && y <= bounds.y
      && x + width >= bounds.x + bounds.width
      && y + height >= bounds.y + bounds.height;
  }).map((monitor) => monitor.id);
}

export function shouldShowSyntheticIsland(isFullscreen: boolean, hasPendingApproval: boolean): boolean {
  return !isFullscreen || hasPendingApproval;
}

export function applySyntheticFullscreenVisibility(
  root: Pick<HTMLElement, "classList" | "setAttribute" | "inert">,
  isFullscreen: boolean,
  hasPendingApproval: boolean,
): boolean {
  const visible = shouldShowSyntheticIsland(isFullscreen, hasPendingApproval);
  root.classList.toggle("synthetic-fullscreen-hidden", !visible);
  root.setAttribute("aria-hidden", String(!visible));
  root.inert = !visible;
  return visible;
}

export function syncSyntheticFullscreenVisibility(
  root: Pick<HTMLElement, "classList" | "setAttribute" | "inert">,
  scenarioActive: boolean,
  window: SyntheticWindow,
  monitors: readonly SyntheticMonitor[],
  hasPendingApproval: boolean,
): boolean {
  const isFullscreen = scenarioActive && coveringSyntheticMonitors(window, monitors).length > 0;
  return applySyntheticFullscreenVisibility(root, isFullscreen, hasPendingApproval);
}
