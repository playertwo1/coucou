# Windows Terminal tab focus — mini-spec

## Goal

When Coucou opens a running session, select its Windows Terminal tab only when the tab can be identified unambiguously. Keep the current window-focus behavior as the fallback.

## Selection rule

- Use the existing session owner PID and folder basename to find the Windows Terminal window.
- Read only UI Automation `TabItem` names from that window; do not read terminal buffer text or send commands.
- Select a tab only when exactly one tab name contains the session folder name, case-insensitively. Re-read on every click so tab reordering and closing do not leave a stale index.
- When no tab matches, multiple tabs match, UI Automation is unavailable, the session ended, or Terminal is absent, focus the session window as today and do not select an arbitrary tab.
- If a file drop cannot select a unique Terminal tab, leave the paths on the clipboard instead of pasting into whichever tab happens to be active.
- Do not choose a split pane. The current process/window path stays unchanged for editors and classic consoles.

## Synthetic acceptance

- One matching tab among unrelated tabs selects its current index.
- Two tabs with the same matching title are ambiguous and select none.
- A file drop with ambiguous tabs is copied, not pasted into the active tab.
- Similar/partial folder names that match multiple tabs are ambiguous.
- A tab removed or reordered between requests is resolved from the current list, never from a cached index.
- A missing session/window or inaccessible UIA tree preserves the existing fallback without running a shell command.

## Primary references

- [Windows Terminal command-line arguments](https://learn.microsoft.com/windows/terminal/command-line-arguments): `focus-tab` uses a positional tab index; `--window` addresses a Terminal window.
- [Microsoft UI Automation TabItem control type](https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-supporttabitemcontroltype): tab items expose the SelectionItem pattern.
- [UI Automation control patterns](https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-controlpatternsoverview).
