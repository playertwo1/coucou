export interface AgentUsageSession {
  date: string;
  project: string | null;
  model: string | null;
  tokens: number;
  costUsd: number | null;
}

export interface AgentUsageSnapshot {
  sourceAvailable: boolean;
  partial: boolean;
  sessions: AgentUsageSession[];
  daily: { date: string; tokens: number }[];
  projects: { project: string; tokens: number }[];
  costUsd: number | null;
}

/** Invented rows displayed only in the isolated synthetic desktop. */
export function syntheticAgentUsage(): AgentUsageSnapshot {
  return {
    sourceAvailable: true,
    partial: false,
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
