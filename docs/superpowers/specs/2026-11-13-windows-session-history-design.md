# Windows session history — mini-spec

## Scope

- Read the local Codex rollout metadata format already supported by Coucou. Claude, Antigravity and Hermes stay unavailable until they provide a supported durable local format.
- Show and search only agent, UTC date and project-folder name. Search never includes prompts, responses, tool inputs, full paths or file contents beyond the metadata fields needed to locate a session.
- Read on demand with the existing file-count and byte limits; do not persist a separate index, change rollout files, or send data over the network.
- A result opens only after an explicit click. Resolve the session's saved working directory from local `session_meta` and invoke `codex resume <session-id>` as separate process arguments, without a shell or prompt text. Missing/invalid metadata, directory or CLI fails closed.
- There is no second copy of history to clear. Removing a rollout in Codex removes it from Coucou's next read; Coucou does not delete Codex files.

## Synthetic acceptance

- Invented JSONL fixtures cover absent source, truncated rows, duplicate session IDs and dates, matching and no-result searches, and prompt-only input.
- Results contain no prompt, response, full path or token; duplicate rollouts produce one result.
- Opening passes only the validated session ID as an argument and uses the fixture's matching project directory. The synthetic UI records the click without starting a process.
- Reads never write or delete the source fixture. Other agents stay unavailable.

## Checkpoint

Synthetic checkpoint: PASS when all fixtures and the isolated UI pass. The owner's real local Codex history and resume flow remain pending evaluation after updating.

## References

- [Codex CLI projects and conversations](https://developers.openai.com/fr-FR/docs/projects): the CLI supports resuming saved conversations with `codex resume`.
- The installed Codex CLI's `codex resume --help` identifies a session UUID argument and `-C/--cd` working-directory option; implementation uses the UUID argument and the process current directory.
