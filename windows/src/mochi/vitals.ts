import { t } from "../i18n/i18n";
import type { VitalsReading } from "../core/bridge";
import type { IslandMode } from "../core/layout";
import type { MochiMood } from "./mood";

export const shouldReadVitals = (enabled: boolean, mode: IslandMode, mochiOnDesktop: boolean) =>
  enabled && (mode !== "hidden" || mochiOnDesktop);

export const isVitalsHover = (mode: IslandMode, inIsland: boolean, overBot: boolean) =>
  (mode === "compact" && inIsland) || overBot;

export const pluggedInWhileLow = (
  previous: VitalsReading["battery"], current: VitalsReading["battery"],
) => Boolean(previous && !previous.onPower && previous.percent < 20 && current?.onPower);

/** Maps one PC reading and the previous high-CPU count to Mochi's mood. */
export function moodFromVitals(reading: VitalsReading, previousBusySamples: number) {
  const busySamples = reading.cpu != null && reading.cpu >= 0.8 ? previousBusySamples + 1 : 0;
  const battery = reading.battery;
  return {
    busySamples,
    mood: {
      busy: busySamples >= 2 && reading.cpu != null ? Math.min(1, (reading.cpu - 0.6) / 0.3) : 0,
      hot: reading.temperature == null ? 0 : reading.temperature >= 95 ? 1 : reading.temperature >= 90 ? 0.8 : reading.temperature >= 80 ? 0.4 : 0,
      full: reading.memoryLoad == null ? 0 : reading.memoryLoad >= 97 ? 1 : reading.memoryLoad >= 90 ? 0.6 : 0,
      tired: battery && !battery.onPower && battery.percent < 20 ? 1 : 0,
      asleep: Boolean(battery && !battery.onPower && battery.percent < 10),
    } satisfies MochiMood,
  };
}

/** The two most useful facts, in the same order as the Mac's VitalsHoverLine. */
export function describeVitals(reading: VitalsReading, mood: MochiMood): string | null {
  const parts: string[] = [];
  if (mood.busy > 0 && reading.cpu != null) {
    const names = reading.top.slice(0, 2).join(", ");
    const cpu = t("CPU {0} %", { 0: Math.round(reading.cpu * 100) });
    parts.push(names ? `${cpu} · ${names}` : cpu);
  }
  if (mood.hot >= 0.8) parts.push(t("Your PC is hot"));
  else if (mood.hot > 0) parts.push(t("Your PC is warm"));
  if (mood.full >= 1) parts.push(t("Memory is full"));
  else if (mood.full > 0) parts.push(t("Memory is short"));
  if (reading.battery && !reading.battery.onPower && reading.battery.percent < 20) {
    parts.push(t("Battery {0} %", { 0: reading.battery.percent }));
  }
  return parts.length ? parts.slice(0, 2).join(" · ") : null;
}
