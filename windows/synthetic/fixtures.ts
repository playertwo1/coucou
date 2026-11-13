// Invented data only. This module has no filesystem, network or native bridge.
export function createFixtures(instanceId = crypto.randomUUID()) {
  const decisions: Array<{ requestId: string; decision: string }> = [];
  const openedFromToast: string[] = [];
  const gitStatusReads: string[] = [];
  const gitDiffReads: string[] = [];
  const openedSessions: string[] = [];
  let next = 0;
  let nextToast = 0;
  const pending = new Map<string, number>();
  const toasts = new Map<string, { requestId: string; expiresAt: number }>();
  const clearToasts = (requestId: string) => {
    for (const [token, toast] of toasts) if (toast.requestId === requestId) toasts.delete(token);
  };
  const consume = (requestId: string, decision: string, now: number) => {
    const expiresAt = pending.get(requestId);
    if (expiresAt === undefined || !["allow", "deny"].includes(decision)) return false;
    if (now >= expiresAt) {
      pending.delete(requestId);
      clearToasts(requestId);
      return false;
    }
    pending.delete(requestId);
    clearToasts(requestId);
    decisions.push({ requestId, decision });
    return true;
  };
  return {
    decisions,
    openedFromToast,
    openedSessions,
    openCodexSession(sessionId: string) {
      if (!["synthetic-session-garden", "synthetic-session-workshop"].includes(sessionId)) return false;
      openedSessions.push(sessionId);
      return true;
    },
    gitStatusReads,
    gitDiffReads,
    fullscreen: {
      monitor: { id: "synthetic-monitor-main", bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
      window: {
        id: "synthetic-game-window", kind: "application" as const, visible: true, minimized: false,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      },
    },
    hasPending(requestId: string) {
      return pending.has(requestId);
    },
    permission(sessionId = "synthetic-session", now = Date.now(), timeoutMs = 108_000) {
      const requestId = `synthetic-request-${++next}`;
      pending.set(requestId, now + timeoutMs);
      return {
        hook_event_name: "PermissionRequest", request_id: requestId,
        session_id: sessionId, cwd: "synthetic://Jardim",
        tool_name: "Bash", tool_input: { command: 'echo "synthetic only"' },
      };
    },
    decide({ requestId, decision, now = Date.now() }: { requestId: string; decision: string; now?: number }) {
      return consume(requestId, decision, now);
    },
    createPermissionToast(requestId: string, { islandVisible, kind = "permission", now = Date.now() }: { islandVisible: boolean; kind?: string; now?: number }) {
      const requestExpiresAt = pending.get(requestId);
      if (kind !== "permission" || islandVisible || requestExpiresAt === undefined || now >= requestExpiresAt) return null;
      const token = `synthetic-toast-${instanceId}-${++nextToast}`;
      toasts.set(token, { requestId, expiresAt: Math.min(now + 30_000, requestExpiresAt) });
      return token;
    },
    toastExpiry(token: string | null) {
      return token ? toasts.get(token)?.expiresAt ?? null : null;
    },
    activatePermissionToast(token: string | null, action: string, now = Date.now()) {
      const toast = token ? toasts.get(token) : undefined;
      if (!token || !toast) return "invalid";
      const requestExpiresAt = pending.get(toast.requestId);
      if (requestExpiresAt === undefined) {
        toasts.delete(token);
        return "resolved";
      }
      if (now >= toast.expiresAt || now >= requestExpiresAt) {
        if (now >= requestExpiresAt) pending.delete(toast.requestId);
        clearToasts(toast.requestId);
        return "expired";
      }
      if (action === "close" || action === "timeout") {
        toasts.delete(token);
        return action === "close" ? "dismissed" : "expired";
      }
      if (action === "open" || action === "allow") {
        toasts.delete(token);
        openedFromToast.push(toast.requestId);
        return "opened";
      }
      if (action !== "deny") return "invalid";
      return consume(toast.requestId, action, now) ? "denied" : "resolved";
    },
    gitStatus(path: string) {
      gitStatusReads.push(path);
      return path === "synthetic://Jardim"
        ? {
            repository: true, root: "synthetic://Jardim", branch: "synthetic/main", detached: false,
            upstream: "synthetic/origin", ahead: 1, behind: 0,
            files: [{ path: "src/garden.ts", status: " M" }, { path: "notes/new-seed.txt", status: "??" }],
          }
        : { repository: false, root: null, branch: null, detached: false, upstream: null, ahead: null, behind: null, files: [] };
    },
    gitDiff(path: string) {
      gitDiffReads.push(path);
      return path === "synthetic://Jardim"
        ? { text: "diff --git a/src/garden.ts b/src/garden.ts\n@@ -1 +1 @@\n-old garden\n+synthetic garden\n", truncated: false }
        : null;
    },
    vitals: { cpu: 0.12, memoryLoad: 42, battery: { percent: 77, onPower: true }, top: [], zones: [{ celsius: 40, passiveLimit: 100, throttleReasons: 0 }], idleSeconds: 0 },
  };
}
