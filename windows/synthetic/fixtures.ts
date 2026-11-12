// Invented data only. This module has no filesystem, network or native bridge.
export function createFixtures() {
  const decisions: Array<{ requestId: string; decision: string }> = [];
  let next = 0;
  const pending = new Set<string>();
  return {
    decisions,
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
    vitals: { cpu: 0.12, memoryLoad: 42, battery: { percent: 77, onPower: true }, top: [], zones: [{ celsius: 40, passiveLimit: 100, throttleReasons: 0 }], idleSeconds: 0 },
  };
}
