# Agent usage — mini-spec

## Goal

Show reproducible local token totals by Codex session, project, and UTC day in the Windows Statistics page, while keeping unknown costs and unsupported agent sources explicitly unavailable.

## Data sources and units

- Read Codex's local `sessions/**/*.jsonl` rollouts under `%CODEX_HOME%` or `%USERPROFILE%\\.codex`.
- Read only session metadata (`id`/`session_id`, `cwd`) and `event_msg` records whose nested type is `token_count`; ignore all other JSON fields and never log rollout lines.
- Use `payload.info.total_token_usage` as Codex's cumulative session counters. Merge duplicate rollout files by session ID and deduplicate identical timestamp/counter events.
- Derive daily token increments from consecutive cumulative counters, using the timestamp date in UTC. Show project basename only; a missing project is “Unknown project”.
- Cost is unavailable. Token counts do not provide a trustworthy billed price, so a known model still has no dollar estimate.
- Claude's `/usage` is current-session output without a documented durable local history format; Antigravity exposes active-context tokens; Hermes stores history in SQLite and its documented insights command has no stable JSON output. These sources remain “Unavailable” until a supported local format is documented.

## Safety and limits

- Read-only local access. No CLI invocation, network request, telemetry, config edit, or raw prompt display.
- Invalid/truncated JSONL marks the snapshot partial; valid rows remain visible with an explicit partial notice. Never present an absent source or price as zero.
- The synthetic desktop uses only invented fixtures and never invokes this production command.

## Acceptance

- Synthetic fixtures cover missing source/project, truncated JSONL, duplicate session files/events, daily deltas, session/project sums, and a known model with unavailable cost.
- The Statistics page shows Codex session/project/day token counts, leaves cost unavailable, and explicitly labels Claude, Antigravity, and Hermes unavailable.
- TypeScript, Rust, normal build, and isolated synthetic build pass.

## Primary references

- [Codex token usage type](https://github.com/openai/codex/blob/main/codex-rs/tui/src/token_usage.rs) and [rollout fixtures](https://github.com/openai/codex/blob/main/codex-rs/app-server/tests/common/rollout.rs).
- [Claude CLI usage](https://code.claude.com/docs/en/cli-usage).
- [Antigravity context command](https://antigravity.google/docs/cli/commands/context/) and [status line usage values](https://antigravity.google/docs/cli/statusline/).
- [Hermes CLI reference](https://hermes-agent.nousresearch.com/docs/reference/cli-commands).
