/** What a chat turn may send. A screen capture stays on the chip and never goes out as bytes. */
export function questionContext(
  first: boolean,
  file: { name: string; path: string; capture?: boolean } | null,
  win: { appName: string; title: string; url?: string | null } | null,
): { kind: "file"; name: string; path: string } | { kind: "window"; appName: string; title: string; url?: string } | null {
  if (win) return { kind: "window", appName: win.appName, title: win.title, url: win.url ?? undefined };
  if (first && file && !file.capture) return { kind: "file", name: file.name, path: file.path };
  return null;
}
