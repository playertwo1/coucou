import { test } from "node:test";
import assert from "node:assert/strict";
import { installFakeDom } from "./fakedom.mjs";

installFakeDom();
Object.defineProperty(globalThis, "navigator", { configurable: true, value: { userAgent: "Windows NT" } });
const createElement = document.createElement;
document.createElement = (tag) => {
  const el = createElement(tag);
  if (tag === "canvas") el.getContext = () => null;
  return el;
};

const [{ UploadCanvas }, { State }, { Bridge }, { Sound }, { Island }, { UploadSeq }] = await Promise.all([
  import("../src/upload/canvas.ts"),
  import("../src/core/state.ts"),
  import("../src/core/bridge.ts"),
  import("../src/core/sound.ts"),
  import("../src/island/island.ts"),
  import("../src/upload/sequence.ts"),
]);

test("a file dragged onto the closed island keeps its drop sequence through the opening", () => {
  const oldMode = State.mode;
  const oldView = State.view;
  try {
    State.mode = "hidden";
    const island = Object.create(Island.prototype);
    // As the constructor wires it: the closed island going home opens on openingView().
    island.fsm = { pinned: false, forceHome: () => island.expand(island.openingView()) };
    island.setMode = (mode) => { State.mode = mode; };
    island.animateGeometry = () => {};

    UploadSeq.enterZone(0, 0);
    island.alert("upload");

    assert.equal(State.view, "upload");
    assert.equal(UploadSeq.isActive, true, "the opening must not end the drop sequence");
  } finally {
    UploadSeq.deactivate();
    State.mode = oldMode;
    State.view = oldView;
  }
});

test("Windows upload canvas gates file actions until copy completes and opens one draft", async () => {
  let asks = 0;
  let cancels = 0;
  let drafts = 0;
  let resolveDraft;
  State.droppedFileReady = false;
  const canvas = new UploadCanvas({
    ask: () => { asks++; },
    cancel: () => { cancels++; },
    draft: () => {
      drafts++;
      return new Promise((resolve) => { resolveDraft = resolve; });
    },
  });
  const [ask, cancel, email] = canvas.el.find(".upload-hit");

  assert.deepEqual([ask.style.left, cancel.style.left, email.style.left], ["114px", "290px", "418px"]);
  canvas.draw({ chooseAlpha: 1 }, 0);
  assert.equal(ask.disabled, true);
  assert.equal(email.disabled, true);
  ask.fire("click");
  assert.equal(asks, 0);

  State.droppedFileReady = true;
  canvas.draw({ chooseAlpha: 1 }, 0);
  assert.equal(ask.disabled, false);
  assert.equal(email.disabled, false);
  ask.fire("click");
  assert.equal(asks, 1);

  email.fire("click");
  assert.equal(drafts, 1);
  assert.equal(ask.disabled, true);
  assert.equal(cancel.disabled, true);
  email.fire("click");
  cancel.fire("click");
  assert.equal(drafts, 1);
  assert.equal(cancels, 0);

  resolveDraft();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(email.disabled, false);
  State.droppedFileReady = false;
});

test("an Outlook failure keeps the copied file as the current context", async () => {
  const oldMailDraft = Bridge.mailDraft;
  const oldPlay = Sound.play;
  const oldSetTimeout = globalThis.setTimeout;
  const file = { name: "sintetico.txt", path: "C:/Coucou/inbox/sintetico.txt" };
  const context = { kind: "file", ...file };
  const views = [];
  try {
    Bridge.mailDraft = async () => { throw new Error("Outlook is not open"); };
    Sound.play = () => {};
    globalThis.setTimeout = () => 0;
    State.droppedFile = file;
    State.droppedFileReady = true;
    State.promptContext = context;
    const island = Object.create(Island.prototype);
    island.setView = (view) => { views.push(view); };

    await island.draftDroppedFile();

    assert.deepEqual(State.droppedFile, file);
    assert.equal(State.droppedFileReady, true);
    assert.deepEqual(State.promptContext, context);
    assert.equal(State.noteMessage, "Outlook is not open");
    assert.deepEqual(views, ["note"]);
  } finally {
    Bridge.mailDraft = oldMailDraft;
    Sound.play = oldPlay;
    globalThis.setTimeout = oldSetTimeout;
    State.droppedFile = null;
    State.droppedFileReady = false;
    State.promptContext = null;
    State.noteMessage = null;
  }
});
