import { createFixtures } from "./fixtures";
import { installIsolation } from "./isolation";
import "../src/style.css";
import "./style.css";

installIsolation();
const fixtures = createFixtures();
const host = window as unknown as {
  __answers: Record<string, unknown>;
  __emit: (event: string, payload: unknown) => void;
  __synthetic: { decisions: typeof fixtures.decisions; request: () => void };
};
host.__answers = {
  approval_decision: (args: { requestId: string; decision: string }) => fixtures.decide(args),
  vitals_read: () => fixtures.vitals,
  fit_zoom: false, custom_sounds: [], agent_hooks_status: {},
  desktop_info: { mode: "off" },
};
await import("../dev/tauri-mock");
const { State, DEFAULT_SETTINGS } = await import("../src/core/state");
const { Island } = await import("../src/island/island");
const { Sound } = await import("../src/core/sound");
const { registerHookHandlers } = await import("../src/island/hooks");
const { setLanguage, t } = await import("../src/i18n/i18n");

setLanguage("pt-BR");
State.settings = { ...DEFAULT_SETTINGS, language: "pt-BR", activeIntegrations: [], soundEnabled: false, autostart: false, hooksInstalled: false };
Sound.enabled = false;
const island = new Island(document.getElementById("root")!);
island.applySettings();
State.upsertWorkspacePill("integration_claude", "Jardim", "synthetic://Jardim");
State.setFocus("integration_claude");
registerHookHandlers(island);
island.followPageCursor();
island.fsm.pinned = true;
island.fsm.forceHome();
State.notify();

const controls = document.getElementById("synthetic-controls")!;
const label = document.createElement("strong");
label.textContent = t("Synthetic data only");
const status = document.createElement("output");
status.setAttribute("aria-live", "polite");
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
controls.append(label, button(t("Test permission"), request), button(t("Reset test data"), () => {
  localStorage.clear();
  sessionStorage.clear();
  location.reload();
}), status);
State.subscribe(() => {
  const last = fixtures.decisions.at(-1);
  status.textContent = last ? `${t("Synthetic data only")} · ${last.requestId} · ${last.decision === "allow" ? t("Allow") : t("Deny")}` : "";
});
host.__synthetic = { decisions: fixtures.decisions, request };
