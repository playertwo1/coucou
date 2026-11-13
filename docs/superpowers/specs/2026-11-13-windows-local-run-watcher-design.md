# Windows Local Build/Test Watcher — Mini-spec

Status: implementação concluída; checkpoint sintético PASS; versão 0.6.12 preparada para avaliação do proprietário. Validação com agentes reais continua pendente.

## Scope

Observe agent hook calls for the exact commands `npm test` and `cargo build`. Use the call's working directory and stable provider call ID to associate a completion with the right project and avoid duplicate results. Do not relaunch, rewrite, or poll the observed command.

Recognized shell tools are `Bash`, `PowerShell`, `shell`, and `run_command`.

The watcher stores only the supported command label, agent/session/call identity, working directory, and a bounded completion marker in memory. It never forwards, saves, or displays stdout, stderr, prompts, or full tool responses. Commands without a working directory or stable call ID are ignored. Compound commands and commands with extra flags are outside this checkpoint.

## Outcome rules

- `passed`: a provider explicitly proves successful completion or reports exit code 0.
- `failed`: a provider reports an error, a nonzero exit code, or `PostToolUseFailure`.
- `cancelled`: `PostToolUseFailure` explicitly says the call was interrupted.
- `unknown`: a completion arrived but the provider did not expose a reliable outcome. Never display this as green.
- No completion event: show no result; do not infer success or failure from a later agent turn.

Claude `PostToolUse` is treated as successful because the official hook contract says it fires only after successful execution. Antigravity uses its `error` field. Codex uses only a structured exit code when present because Codex documents that `PostToolUse` also fires after nonzero shell exits. Other result shapes remain unknown.

## Presentation and lifecycle

Append one localized result step to the agent's existing project pill, naming the project from the invocation's captured `cwd`. Do not reveal the island, play a sound, or change permission behavior. Match completion by agent, session, and provider call ID. Keep pending and deduplication state bounded and in memory; expire stale pending calls. Duplicate completion events must not append another step.

## Synthetic acceptance

- Interleave two runs from different projects and complete them in reverse order; each result stays with its originating project.
- Cover exit 0, nonzero, failure, explicit cancellation, and unknown status; only exit 0/success is green.
- Cover duplicate completion, missing ID/cwd, unsupported/compound command, stale pending entry, and command from a different project.
- Verify stdout/stderr/tool response contents are absent from the event forwarded to the UI and from displayed steps.
- Verify no original command is run or modified by the watcher.

## Limits

This checkpoint observes commands the supported agent hooks report; it is not a system-wide process tracker for arbitrary terminals. Real-agent event shapes and the owner's installation remain runtime validation.
