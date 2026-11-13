import { createFixtures } from "./fixtures";
import { syncSyntheticFullscreenVisibility } from "./fullscreen";
import { installIsolation } from "./isolation";
import "../src/style.css";
import "../src/hub/hub.css";
import "./style.css";

installIsolation();
const fixtures = createFixtures();
const host = window as unknown as {
  __answers: Record<string, unknown>;
  __emit: (event: string, payload: unknown) => void;
  __synthetic: {
    decisions: typeof fixtures.decisions;
    gitStatusReads: typeof fixtures.gitStatusReads;
    gitDiffReads: typeof fixtures.gitDiffReads;
    openedSessions: typeof fixtures.openedSessions;
    openCodexSession: typeof fixtures.openCodexSession;
    request: () => void;
  };
};
host.__answers = {
  approval_decision: (args: { requestId: string; decision: string }) => fixtures.decide(args),
  git_status: (args: { path: string }) => fixtures.gitStatus(args.path),
  git_diff: (args: { path: string }) => fixtures.gitDiff(args.path),
  vitals_read: () => fixtures.vitals,
  fit_zoom: false, custom_sounds: [], agent_hooks_status: {},
  desktop_info: { mode: "off" },
};
await import("../dev/tauri-mock");
host.__answers.launch_agents = ["claude", "codex", "antigravity", "hermes"].map((agent) => ({ agent, available: true }));
host.__answers.launch_session = () => ({ ok: false, error: "synthetic" });
const { Launch } = await import("../src/core/launch");
Launch.projects = ["C:\\Synthetic\\Coucou"];
Launch.folder = Launch.projects[0];
const { State, DEFAULT_SETTINGS } = await import("../src/core/state");
const { Island } = await import("../src/island/island");
const { Sound } = await import("../src/core/sound");
const { registerHookHandlers } = await import("../src/island/hooks");
const { registerShortcutHandlers } = await import("../src/island/shortcuts");
const { setLanguage, t } = await import("../src/i18n/i18n");
const { agentUsageCard } = await import("../src/hub/pages/insights");
const { syntheticAgentUsage } = await import("../src/core/agent-usage");

setLanguage("pt-BR");
State.settings = { ...DEFAULT_SETTINGS, language: "pt-BR", activeIntegrations: ["integration_git"], soundEnabled: false, autostart: false, hooksInstalled: false };
State.loadIntegrationTasks();
Sound.enabled = false;
const root = document.getElementById("root")!;
const island = new Island(root);
island.applySettings();
State.upsertWorkspacePill("integration_claude", "Jardim", "synthetic://Jardim");
State.setFocus("integration_claude");
registerHookHandlers(island);
registerShortcutHandlers(island, () => { State.paused = false; });
island.followPageCursor();
island.fsm.pinned = true;
island.fsm.forceHome();
State.notify();

const controls = document.getElementById("synthetic-controls")!;
const label = document.createElement("strong");
label.textContent = t("Synthetic data only");
const status = document.createElement("output");
status.setAttribute("aria-live", "polite");
const fullscreenStatus = document.createElement("output");
fullscreenStatus.setAttribute("aria-live", "polite");
const request = () => {
  host.__emit("hook", fixtures.permission());
  status.textContent = "";
};
function button(text: string, action: () => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.addEventListener("click", action);
  return button;
}
let fullscreenScenario = false;
const enterFullscreenText = t("Enter synthetic fullscreen");
const exitFullscreenText = t("Exit synthetic fullscreen");
const fullscreenActiveText = t("Synthetic fullscreen is active");
const fullscreenInactiveText = t("Synthetic fullscreen is inactive");
const fullscreenButton = button(enterFullscreenText, () => {
  fullscreenScenario = !fullscreenScenario;
  syncFullscreen();
});
const syncFullscreen = () => {
  const visible = syncSyntheticFullscreenVisibility(root, fullscreenScenario, fixtures.fullscreen.window, [fixtures.fullscreen.monitor], State.pendingApproval != null);
  fullscreenButton.textContent = fullscreenScenario ? exitFullscreenText : enterFullscreenText;
  fullscreenButton.setAttribute("aria-pressed", String(fullscreenScenario));
  fullscreenStatus.textContent = visible ? fullscreenInactiveText : fullscreenActiveText;
};
controls.append(label, button(t("New agent session"), () => host.__emit("shortcut", "newSession")), button("Enviar só no teste", () => document.querySelector<HTMLButtonElement>(".launch-send")?.click()), button(t("Test permission"), request), button(t("Test Git pill"), () => State.setFocus("integration_git")), fullscreenButton, button(t("Reset test data"), () => {
  localStorage.clear();
  sessionStorage.clear();
  location.reload();
}), status, fullscreenStatus);
const usagePanel = document.createElement("div");
usagePanel.hidden = true;
usagePanel.id = "synthetic-agent-usage";
usagePanel.append(agentUsageCard(syntheticAgentUsage()));
const usageButton = button(t("Agent usage"), () => {
  usagePanel.hidden = !usagePanel.hidden;
});
controls.append(usageButton);
document.body.append(usagePanel);
State.subscribe(() => {
  syncFullscreen();
  const last = fixtures.decisions.at(-1);
  status.textContent = last ? `${t("Synthetic data only")} · ${last.requestId} · ${last.decision === "allow" ? t("Allow") : t("Deny")}` : "";
});
syncFullscreen();
host.__synthetic = {
  decisions: fixtures.decisions,
  gitStatusReads: fixtures.gitStatusReads,
  gitDiffReads: fixtures.gitDiffReads,
  openedSessions: fixtures.openedSessions,
  openCodexSession: fixtures.openCodexSession,
  request,
};
