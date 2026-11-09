// The microphone beside a text field of the island: starts Flow's hands-free
// dictation, a second click pastes. Flow pastes into the window in front, so
// the field must keep the keyboard focus (mousedown never takes it).

import { svg, h } from "./dom";
import { FlowBridge } from "../core/flow";
import { tl } from "../i18n/i18n";

const MIC = "M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3zM6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3.5";

/** A mic button for `input`; hidden until Flow is on and its voice model is ready. */
export function dictateButton(input: HTMLInputElement): HTMLButtonElement {
  const btn = h("button", { class: "dictate-btn", title: tl("Dictation") }, svg(MIC, 13, { stroke: 1.8 })) as HTMLButtonElement;
  btn.hidden = true;
  void FlowBridge.status().then((s) => {
    btn.hidden = !(s?.prefs.enabled && s.models.parakeet.state === "ready");
  });
  let active = false;
  let timer = 0;
  const watch = (since: number) => {
    timer = window.setTimeout(async () => {
      const phase = (await FlowBridge.pillState())?.phase ?? "idle";
      const busy = phase === "listening" || phase === "locked" || phase === "thinking";
      // Idle for 1.5 s after the click: Flow refused to start (no mic, no model).
      if (busy || Date.now() - since < 1500) return watch(since);
      active = false;
      btn.classList.remove("on");
    }, 300);
  };
  btn.addEventListener("mousedown", (e) => e.preventDefault());
  btn.addEventListener("click", () => {
    window.clearTimeout(timer);
    if (active) {
      void FlowBridge.pillAction("finish");
    } else {
      active = true;
      btn.classList.add("on");
      void FlowBridge.pillAction("dictate");
      input.focus();
      watch(Date.now());
      return;
    }
    watch(Date.now() - 1500);
  });
  return btn;
}
