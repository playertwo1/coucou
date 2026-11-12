# Git pill — mini-spec

## Goal

Show the Git state of the most recently focused workspace session on Windows and let the owner inspect that project's local diff.

## Contract

- Stable pill ID: `integration_git`.
- Keep the selected project path in memory only. Focusing a service, including Git, does not replace the last workspace session path. Focusing another workspace session changes the project shown.
- If no workspace path is available, the folder is gone, or it is outside a Git repository, show an explicit empty state.
- Show repository root, branch (or detached HEAD), changed paths and cached ahead/behind counts when an upstream is configured. A branch without an upstream says so; the app does not fetch to calculate counts.
- The diff action displays `git diff HEAD` for tracked staged and unstaged changes in the same repository. Untracked paths appear in the changed-path list; Git does not include their contents in `git diff`.
- Refresh is explicit and local. No timers or network access.
- The app runs the fixed `git` executable with argument arrays and the selected working directory; it does not invoke a shell, run user config diff/textconv programs, or call fetch, pull, checkout, commit, push, or another write command. Status sets `GIT_OPTIONAL_LOCKS=0` and disables fsmonitor and untracked-cache writes.
- Diff text is rendered as text in the card and never interpreted as HTML; output is capped at 256 KiB while being read from Git.
- Synthetic mode returns invented repository state and diff only; it never reads a real path or starts Git.

## Acceptance

- Stable ID is unique and offered only on Windows.
- Clean, modified, untracked, detached, no-upstream, ahead/behind, missing-folder and non-repository states render distinctly.
- With two workspace sessions, focusing each session and then Git shows that session's repository; focusing service pills preserves the selected workspace.
- The compact card opens its expanded details; clicking View diff returns content for the selected root, and a later session switch cannot replace the prior card with another project's result.
- Tests prove status and diff leave the fixture repository's refs, index and working tree unchanged.
- Synthetic desktop visually shows only the invented repository, exposes Details and a working diff action, and never invokes a production/native backend.

## Limits

Ahead/behind uses locally cached tracking refs and can be stale while offline. Untracked file contents are not included in the diff view. Git must be installed and available on the app's PATH.
