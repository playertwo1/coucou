// The Coucoudoro card and pill — DOM ports of CoucoudoroCardView / CoucoudoroPill
// (CoucoudoroViews.swift). The card shows the clock, the phase and start / pause / stop; the pill
// capsule wears the clock, or the sentence of a phase that just began. Both are kept and updated in
// place, twice a second, only while a session runs and they are on screen.

import { h, clear, dot } from "./dom";
import {
  COUCOUDORO_COLOR, Coucoudoro, FocusLog, clock, coucoudoroConfig, daySummary, remaining,
} from "../core/coucoudoro";
import { dictateButton } from "./dictate";
import { State } from "../core/state";
import { begin, banner, end, pause, pendingNote, pillLabel, resume, saveNote } from "../island/coucoudoro";
import { t } from "../i18n/i18n";

/** Runs `paint` twice a second while a session runs and `el` is on the overview. */
function liveClock(el: HTMLElement, paint: () => void) {
  let timer: number | null = null;
  const shown = () =>
    Coucoudoro.snap.phase !== "idle" && !Coucoudoro.snap.paused && el.isConnected &&
    State.mode === "expanded" && State.view === "overview";
  return () => {
    if (shown() && timer == null) {
      timer = window.setInterval(() => {
        if (shown()) return paint();
        if (timer != null) window.clearInterval(timer);
        timer = null;
      }, 500);
    } else if (!shown() && timer != null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
}

export interface CoucoudoroCardHost {
  el: HTMLElement;
  sync(): void;
}

/** The focused Coucoudoro pill: the clock, the last event, and start / pause / stop. */
export function buildCoucoudoroCard(host: { keyboard(on: boolean): void }): CoucoudoroCardHost {
  const subtitle = h("span");
  const time = h("span", { class: "cd-clock" });
  const controls = h("div", { class: "cd-controls" });
  const note = h("div", { class: "cd-banner", style: `color:${COUCOUDORO_COLOR}` });
  // After a work phase: one line about it, typed or dictated, kept in the day's history.
  const line = h("input", { type: "text", class: "chat-input", placeholder: t("What did you finish?"), spellcheck: "false" }) as HTMLInputElement;
  line.addEventListener("focus", () => host.keyboard(true));
  line.addEventListener("blur", () => host.keyboard(false));
  line.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    saveNote(line.value);
    line.value = "";
    line.blur();
  });
  const lineBar = h("div", { class: "chat-bar cd-line" }, line, dictateButton(line));
  const today = h("div", { class: "cd-today" });
  const el = h("div", { class: "int-card cd-card" },
    h("div", { class: "int-head" }, dot(COUCOUDORO_COLOR, 7), h("b", { text: "Coucoudoro" }), subtitle),
    h("div", { class: "cd-row" }, time, controls),
    note,
    lineBar,
    today,
  );

  const button = (title: string, filled: boolean, action: () => void) => {
    const b = h("button", { class: filled ? "cd-btn filled" : "cd-btn", text: title, onclick: action });
    if (filled) b.style.background = COUCOUDORO_COLOR;
    return b;
  };

  let controlsKey = "";
  const paint = () => {
    const now = Date.now();
    const s = Coucoudoro.snap;
    time.textContent = clock(remaining(s, now) ?? coucoudoroConfig().work);
    subtitle.textContent = s.paused ? t("Paused") : s.phase === "work" ? t("Work") : s.phase === "rest" ? t("Rest") : t("Ready");
    const text = s.paused ? null : banner(now);
    note.textContent = text ?? "";
    note.style.display = text ? "" : "none";
    // The line is asked during rest, until it is saved or the next work phase begins.
    const asking = s.phase === "rest" && pendingNote() != null;
    lineBar.style.display = asking ? "" : "none";
    const day = daySummary(FocusLog.entries, now);
    const shownDay = [
      day.cycles ? `${t("Today")} · ${t("{minutes} min", { minutes: Math.round(day.seconds / 60) })}` : "",
      ...day.projects.slice(0, 3).map(([name, secs]) => `${name} · ${t("{minutes} min", { minutes: Math.round(secs / 60) })}`),
    ].filter(Boolean).join("\n");
    if (today.textContent !== shownDay) today.textContent = shownDay;
    today.style.display = shownDay ? "" : "none";
    // The buttons depend on the phase only: rebuilt when it changes, not twice a second.
    const key = s.phase === "idle" ? "idle" : s.paused ? "paused" : "running";
    if (key !== controlsKey) {
      controlsKey = key;
      clear(controls);
      if (key === "idle") controls.append(button(t("Start"), true, () => begin()));
      else if (key === "paused") controls.append(button(t("Resume"), true, () => resume()), button(t("Stop"), false, end));
      else controls.append(button(t("Pause"), false, () => pause()), button(t("Stop"), false, end));
    }
  };
  const live = liveClock(el, paint);

  return {
    el,
    sync() {
      paint();
      live();
    },
  };
}

/** The generic pill, its label following the clock. */
export function bindCoucoudoroPill(pill: HTMLElement): { sync(): void } {
  const label = pill.querySelector(".lbl") as HTMLElement | null;
  const paint = () => {
    if (!label) return;
    const text = pillLabel(clock);
    if (label.textContent !== text) label.textContent = text;
    label.style.fontVariantNumeric = "tabular-nums";
  };
  const live = liveClock(pill, paint);
  return {
    sync() {
      paint();
      live();
    },
  };
}
