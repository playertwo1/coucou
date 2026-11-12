// Invented data only. This module has no filesystem, network or native bridge.
export function createFixtures() {
  const decisions: Array<{ requestId: string; decision: string }> = [];
  const gitStatusReads: string[] = [];
  const gitDiffReads: string[] = [];
  let next = 0;
  const pending = new Set<string>();
  return {
    decisions,
    gitStatusReads,
    gitDiffReads,
    permission() {
      const requestId = `synthetic-request-${++next}`;
      pending.add(requestId);
      return {
        hook_event_name: "PermissionRequest", request_id: requestId,
        session_id: "synthetic-session", cwd: "synthetic://Jardim",
        tool_name: "Bash", tool_input: { command: 'echo "synthetic only"' },
      };
    },
    decide({ requestId, decision }: { requestId: string; decision: string }) {
      if (!pending.has(requestId) || !["allow", "deny"].includes(decision)) return false;
      pending.delete(requestId);
      decisions.push({ requestId, decision });
      return true;
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
