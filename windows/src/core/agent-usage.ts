export interface AgentUsageSession {
  date: string;
  project: string | null;
  model: string | null;
  tokens: number;
  costUsd: number | null;
}

export interface HistorySession {
  sessionId: string;
  date: string;
  project: string | null;
}

export interface AgentUsageSnapshot {
  sourceAvailable: boolean;
  partial: boolean;
  sessions: AgentUsageSession[];
  history: HistorySession[];
  daily: { date: string; tokens: number }[];
  projects: { project: string; tokens: number }[];
  costUsd: number | null;
}

export function searchAgentHistory(sessions: HistorySession[], query: string): HistorySession[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return sessions;
  return sessions.filter((session) => {
    const fields = ["Codex", session.date, session.project ?? ""].join(" ").toLocaleLowerCase();
    return terms.every((term) => fields.includes(term));
  });
}

/** Invented rows displayed only in the isolated synthetic desktop. */
export function syntheticAgentUsage(): AgentUsageSnapshot {
  return {
    sourceAvailable: true,
    partial: false,
    history: [
      { sessionId: "synthetic-session-garden", date: "2026-11-13", project: "Jardim" },
      { sessionId: "synthetic-session-workshop", date: "2026-11-12", project: "Oficina" },
    ],
    sessions: [
      { date: "2026-11-13", project: "Jardim", model: "synthetic-no-price", tokens: 150, costUsd: null },
      { date: "2026-11-12", project: "Oficina", model: null, tokens: 80, costUsd: null },
    ],
    daily: [
      { date: "2026-11-12", tokens: 80 },
      { date: "2026-11-13", tokens: 150 },
    ],
    projects: [
      { project: "Jardim", tokens: 150 },
      { project: "Oficina", tokens: 80 },
    ],
    costUsd: null,
  };
}
