type Hook = {
  hook_event_name?: string;
  coucou_agent?: string;
  session_id?: string;
  cwd?: string;
  tool_use_id?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  coucou_run_status?: 0 | 1 | 2 | 3;
};

type Run = { label: "npm test" | "cargo build"; cwd: string; started: number };
type RunStatus = 0 | 1 | 2 | 3;

const MAX_PENDING = 64;
const MAX_COMPLETED = 128;
const MAX_AGE_MS = 30 * 60 * 1000;
const SHELL_TOOLS = new Set(["Bash", "PowerShell", "shell", "run_command"]);

function commandLabel(payload: Hook): Run["label"] | null {
  if (!SHELL_TOOLS.has(payload.tool_name ?? "")) return null;
  const command = payload.tool_input?.command;
  if (typeof command !== "string") return null;
  const exact = command.trim().replace(/[ \t]+/g, " ");
  return exact === "npm test" || exact === "cargo build" ? exact : null;
}

function callKey(payload: Hook): string | null {
  if (!payload.tool_use_id) return null;
  return [payload.coucou_agent ?? "claude", payload.session_id ?? "", payload.tool_use_id].join("\0");
}

export function createLocalRunWatcher(now = () => Date.now()) {
  const pending = new Map<string, Run>();
  const completed = new Map<string, number>();

  function prune(time: number) {
    for (const [key, run] of pending) if (time - run.started > MAX_AGE_MS) pending.delete(key);
    for (const [key, finished] of completed) if (time - finished > MAX_AGE_MS) completed.delete(key);
    while (pending.size > MAX_PENDING) pending.delete(pending.keys().next().value!);
    while (completed.size > MAX_COMPLETED) completed.delete(completed.keys().next().value!);
  }

  return {
    observe(payload: Hook) {
      const time = now();
      prune(time);
      const key = callKey(payload);
      if (!key) return null;

      if (payload.hook_event_name === "PreToolUse") {
        const label = commandLabel(payload);
        if (!label || !payload.cwd || pending.has(key) || completed.has(key)) return null;
        pending.set(key, { label, cwd: payload.cwd, started: time });
        prune(time);
        return null;
      }

      if (payload.hook_event_name !== "PostToolUse" && payload.hook_event_name !== "PostToolUseFailure") return null;
      const run = pending.get(key);
      if (!run) return null;
      pending.delete(key);
      completed.set(key, time);
      prune(time);
      const status = payload.hook_event_name === "PostToolUseFailure"
        ? payload.coucou_run_status === 2 ? 2 : 1
        : payload.coucou_run_status ?? 3;
      return { ...run, status: status as RunStatus };
    },
    pendingCount: () => pending.size,
  };
}
