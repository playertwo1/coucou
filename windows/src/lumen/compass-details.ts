import { h } from "../views/dom";
import type { ViewActions, ViewHost } from "../views/views";
import { drawCompass } from "./compass";

export function buildWardrobe(_actions: ViewActions): ViewHost {
  const canvas = h("canvas", { width: 160, height: 160, "aria-label": "Bússola de papel do Lumen" });
  canvas.style.width = "80px";
  canvas.style.height = "80px";
  const el = h(
    "div",
    { class: "view" },
    h(
      "div",
      { class: "card" },
      h("div", { class: "stack", style: "align-items:center;text-align:center" },
        canvas,
        h("strong", { text: "Bússola de papel" }),
        h("span", { text: "Índigo, areia e terracota orientam as sessões do Lumen." }),
      ),
    ),
  );
  const ctx = canvas.getContext("2d");
  return {
    el,
    sync() {
      if (ctx) drawCompass(ctx, 160, 160);
    },
  };
}
