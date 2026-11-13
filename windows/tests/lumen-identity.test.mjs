import test from "node:test";
import assert from "node:assert/strict";
import { compassFaces } from "../src/lumen/compass.ts";
import { compassTone } from "../src/core/sound.ts";
import { brandText } from "../src/i18n/i18n.ts";

test("the paper compass is made from eight original colored faces", () => {
  const faces = compassFaces(100);
  assert.equal(faces.length, 8);
  assert.deepEqual(new Set(faces.map(({ color }) => color)), new Set(["#BE5C41", "#26224B", "#D2BF96", "#F4E8C9"]));
  assert.ok(faces.every(({ points }) => points.length === 4 && points.every(([x, y]) => x >= 0 && x <= 100 && y >= 0 && y <= 100)));
});

test("the Windows brand text preserves compatibility names while relabeling the interface", () => {
  assert.equal(brandText("Coucou e Mochi", true), "Lumen e Bússola");
  assert.equal(brandText("Coucoudoro", true), "Foco");
  assert.equal(brandText("Coucou for Android", true), "Segunda Mente");
  assert.equal(brandText('coucou-hook.exe, fr.louisraille.coucou, "coucou"', true), 'coucou-hook.exe, fr.louisraille.coucou, "coucou"');
  assert.equal(brandText("Coucou e Mochi", false), "Coucou e Mochi");
});

test("the Lumen sound palette separates taps, approvals, and refusals", () => {
  assert.deepEqual(compassTone("hover").notes, [740]);
  assert.deepEqual(compassTone("approve").notes, [523.25, 659.25, 783.99]);
  assert.deepEqual(compassTone("deny").notes, [493.88, 369.99]);
  assert.equal(compassTone("deny").type, "triangle");
});
