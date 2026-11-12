// Installed before app modules. The native host has no IPC handler as a second boundary.
export function installIsolation() {
  let clipboard = "synthetic clipboard";
  Object.defineProperty(navigator, "clipboard", { configurable: false, value: {
    readText: async () => clipboard,
    writeText: async (text: string) => { clipboard = String(text); },
    read: async () => [], write: async () => {},
  } });
  for (const event of ["dragenter", "dragover", "drop"]) {
    window.addEventListener(event, (e) => { e.preventDefault(); e.stopImmediatePropagation(); }, true);
  }
  window.open = () => null;
}
