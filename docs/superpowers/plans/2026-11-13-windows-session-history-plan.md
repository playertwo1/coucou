# Windows session history — implementation plan

## Files and interfaces

- `windows/src-tauri/src/agent_usage.rs`: parse bounded local Codex metadata and expose deduplicated `HistorySession` rows; resolve a matching existing session cwd only when opening.
- `windows/src-tauri/src/launch.rs`, `lib.rs`: register `open_codex_session`; after an explicit click, launch `codex resume <id>` with literal arguments and the verified cwd.
- `windows/src/core/agent-usage.ts`, `bridge.ts`, `hub/pages/insights.ts`: search only Codex/date/project and render the local history card.
- `windows/synthetic/fixtures.ts`, `main.ts`: whitelist invented IDs and record synthetic opens without launching a CLI.
- `windows/tests/agent-usage.test.mjs`, `synthetic.test.mjs`: parser/search/privacy/open boundaries.

## Checks and acceptance

- Rust fixtures cover absent/incomplete records, duplicate IDs, missing project, invalid IDs and matching cwd.
- JavaScript fixtures cover project/date/agent search, empty result, prompt-only query and synthetic open allowlist.
- Run `npm test`, workspace Rust tests, normal and synthetic builds, translation/What's New checks, then inspect the synthetic search and open action with Agent Desktop.
- Pass only if reads never modify rollout files, the UI/logs reveal no prompt or full path, and a synthetic click cannot start a real CLI.

## Rollback

No migration or second index is introduced. Revert the history fields, command and UI together; existing usage totals remain readable because the new serialized field defaults to an empty vector.
