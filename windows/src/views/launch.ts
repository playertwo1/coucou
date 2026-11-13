// The island's "New Claude Code session" card — port of LaunchView in
// SessionLauncher.swift: Mochi on the left, the project, what Claude should do.
// Rust opens the terminal (src-tauri/src/launch.rs); the session then shows in
// the island through the hooks like any other.
//
// The Mac's project menu is a native menu; the island is a fixed-height
// webview, so here the projects open in the card itself, in place of the text
// field, the way the chat's model picker opens in the chat.

import { h, svg, clear } from "./dom";
import { dictateButton } from "./dictate";
import { ICONS } from "./icons";
import { Bridge } from "../core/bridge";
import { Launch, projectName, type LaunchAgent, type LaunchError } from "../core/launch";
import { Sound } from "../core/sound";
import { State } from "../core/state";
import { washRGBA } from "../core/layout";
import type { ViewActions, ViewHost } from "./views";
import { t, tl } from "../i18n/i18n";

export function buildLaunch(actions: ViewActions): ViewHost {
  const title = h("div", { class: "launch-title", text: tl("New agent session") });
  const agentLabel = h("span", { class: "launch-agent-name" });
  const agentBtn = h(
    "button",
    { class: "launch-project launch-agent", "aria-haspopup": "listbox", "aria-expanded": "false" },
    agentLabel,
    svg(ICONS.chevronDown, 8, { stroke: 2.4 }),
  ) as HTMLButtonElement;
  const projectLabel = h("span", { class: "launch-project-name" });
  const projectBtn = h(
    "button",
    { class: "launch-project", "aria-haspopup": "listbox", "aria-expanded": "false" },
    svg(ICONS.folder, 10),
    projectLabel,
    svg(ICONS.chevronDown, 8, { stroke: 2.4 }),
  );
  const input = h("input", {
    type: "text",
    class: "chat-input",
    placeholder: t("What should the agent do?"),
    spellcheck: "false",
  }) as HTMLInputElement;
  const send = h("button", { class: "send-btn launch-send", "aria-label": t("Send") }, svg(ICONS.arrowUp, 11)) as HTMLButtonElement;
  const bar = h("div", { class: "chat-bar launch-bar" }, input, dictateButton(input), send);
  const hint = h("div", { class: "launch-hint" });
  const menu = h("div", { class: "launch-menu picker-list", role: "listbox" });
  const body = h(
    "div",
    { class: "stack launch-body" },
    h("div", { class: "launch-head" }, title, agentBtn, projectBtn),
    bar,
    hint,
    menu,
  );
  const card = h("div", { class: "card wash launch-card" }, body);
  card.style.setProperty("--wash", washRGBA("indigo"));
  const el = h("div", { class: "view" }, card);

  let failed: LaunchError | "noAgents" | null = null;
  let menuKind: "projects" | "agents" | null = null;
  let availableAgents: LaunchAgent[] = [];
  let agentsLoaded = false;
  let agentsLoading = false;
  let busy = false;

  function activeAgent(): LaunchAgent | null {
    return availableAgents.includes(Launch.agent) ? Launch.agent : (availableAgents[0] ?? null);
  }

  function setMenu(kind: "projects" | "agents" | null) {
    menuKind = kind;
    body.classList.toggle("choosing", kind !== null);
    projectBtn.setAttribute("aria-expanded", String(kind === "projects"));
    agentBtn.setAttribute("aria-expanded", String(kind === "agents"));
    if (kind) drawMenu();
    else window.setTimeout(() => input.focus(), 0);
    sync();
  }

  function drawMenu() {
    clear(menu);
    if (menuKind === "agents") {
      const selected = activeAgent();
      for (const agent of availableAgents) {
        const row = h(
          "button",
          { class: agent === selected ? "picker-model on" : "picker-model", role: "option", "aria-selected": String(agent === selected) },
          h("span", { class: "picker-model-name", text: agentName(agent) }),
          agent === selected ? svg(ICONS.check, 11, { stroke: 2.2 }) : null,
        );
        row.addEventListener("click", () => {
          Launch.chooseAgent(agent);
          failed = null;
          Sound.play("blip");
          setMenu(null);
        });
        menu.append(row);
      }
      return;
    }
    for (const path of Launch.projects) {
      const on = path === Launch.folder;
      const row = h(
        "button",
        { class: on ? "picker-model on" : "picker-model", style: "--accent:#818CF8", title: path },
        h("span", { class: "picker-model-name", text: projectName(path) }),
        on ? svg(ICONS.check, 11, { stroke: 2.2 }) : null,
      );
      row.addEventListener("click", () => {
        Launch.choose(path);
        failed = null;
        Sound.play("blip");
        setMenu(null);
      });
      menu.append(row);
    }
    if (Launch.projects.length > 0) menu.append(h("div", { class: "picker-rule" }));
    const other = h("button", { class: "picker-model" }, h("span", { class: "picker-model-name", text: t("Choose a folder…") }));
    other.addEventListener("click", () => void chooseFolder());
    menu.append(other);
  }

  /** Another folder, in the system's picker. The island stays open meanwhile. */
  async function chooseFolder() {
    if (menuKind) setMenu(null);
    actions.holdOpen(true);
    const picked = await Bridge.pickFolder(Launch.folder);
    actions.holdOpen(input.value.trim().length > 0);
    if (picked) Launch.choose(picked);
    failed = null;
    sync();
    if (State.view === "launch") {
      actions.keyboard(true);
      window.setTimeout(() => input.focus(), 80);
    }
  }

  async function start() {
    if (busy) return;
    const agent = activeAgent();
    if (!agentsLoaded || !agent) {
      failed = "noAgents";
      sync();
      return;
    }
    const folder = Launch.folder;
    if (!folder) {
      void chooseFolder();
      return;
    }
    busy = true;
    const result = await Bridge.launchSession(folder, input.value, agent);
    busy = false;
    if (!result.ok) {
      failed = result.error ?? "terminalStartFailed";
      Sound.play("error");
      sync();
      return;
    }
    input.value = "";
    failed = null;
    actions.holdOpen(false);
    actions.launched();
  }

  agentBtn.addEventListener("click", () => {
    actions.blip();
    setMenu(menuKind === "agents" ? null : "agents");
  });
  projectBtn.addEventListener("click", () => {
    actions.blip();
    setMenu(menuKind === "projects" ? null : "projects");
  });
  send.addEventListener("click", () => void start());
  input.addEventListener("input", () => actions.holdOpen(input.value.trim().length > 0));
  input.addEventListener("keydown", (e) => {
    const key = (e as KeyboardEvent).key;
    if (key === "Escape" && menuKind) {
      e.preventDefault();
      setMenu(null);
      e.stopPropagation();
      return;
    }
    if (key === "Enter") {
      e.preventDefault();
      void start();
    }
    e.stopPropagation(); // Escape closes the island, not the card
  });

  function sync() {
    const folder = Launch.folder;
    const agent = activeAgent();
    projectLabel.textContent = folder ? projectName(folder) : t("Choose a project");
    projectBtn.title = folder ?? "";
    projectBtn.classList.toggle("open", menuKind === "projects");
    agentLabel.textContent = agent ? agentName(agent) : t("Select an agent");
    agentBtn.disabled = !agentsLoaded || availableAgents.length === 0;
    agentBtn.classList.toggle("open", menuKind === "agents");
    send.disabled = folder == null || !agentsLoaded || agent == null || busy;
    const message = failed === "noAgents" ? t("No supported agent CLI is installed.")
      : failed === "agentUnavailable" ? t("This agent CLI is no longer available.")
      : failed === "synthetic" ? t("Synthetic mode: no agent process will run.")
      : failed ? t("Couldn't open the terminal in this folder.")
      : agentsLoaded && availableAgents.length === 0 ? t("No supported agent CLI is installed.")
      : agentsLoaded ? t("Opens your terminal in the project with the selected agent.") : "";
    hint.textContent = message;
    hint.classList.toggle("is-failed", failed !== null);
  }

  function agentName(agent: LaunchAgent): string {
    return { claude: "Claude Code", codex: "Codex", antigravity: "Antigravity", hermes: "Hermes" }[agent];
  }

  async function refreshAgents() {
    if (agentsLoading) return;
    agentsLoading = true;
    const statuses = await Bridge.launchAgents();
    availableAgents = statuses.filter((status) => status.available).map((status) => status.agent);
    agentsLoaded = true;
    agentsLoading = false;
    failed = availableAgents.length === 0 ? "noAgents" : null;
    sync();
  }

  void refreshAgents();

  return {
    el,
    sync,
    // The island calls it each time the card comes up: a fresh hint, the
    // field and not the menu.
    focus() {
      failed = null;
      if (menuKind) {
        menuKind = null;
        body.classList.remove("choosing");
      }
      void refreshAgents();
      sync();
      input.focus();
    },
  };
}
