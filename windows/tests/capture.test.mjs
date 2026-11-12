import { test } from "node:test";
import assert from "node:assert/strict";
import { questionContext } from "../src/chat/question.ts";

test("a screen capture shows on the chip and is not sent as a file", () => {
  const file = { name: "capture-1.png", path: "C:\\Temp\\CoucouCaptures\\capture-1.png", capture: true };
  assert.equal(questionContext(true, file, null), null);
  assert.equal(questionContext(false, file, null), null);
});

test("a dropped file and a window still ride along", () => {
  const file = { name: "a.txt", path: "C:\\inbox\\a.txt" };
  assert.deepEqual(questionContext(true, file, null), { kind: "file", name: "a.txt", path: "C:\\inbox\\a.txt" });
  assert.equal(questionContext(false, file, null), null);
  const win = { appName: "Edge", title: "Docs", url: "https://example.com" };
  assert.deepEqual(questionContext(true, file, win), { kind: "window", ...win });
});
