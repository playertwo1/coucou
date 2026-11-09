# Plano — Login das assinaturas e modo de autenticação do Gemini

Spec: `docs/superpowers/specs/2026-11-09-subscription-sign-in-design.md`.

1. [x] `cli_relay.rs`: `auth_info` (leitura), `launch_sign_in` (terminal com `cli.sign_in()`), `gemini_auth_edits` + `gemini_auth_preview`/`gemini_auth_apply` via `config_file`; `agents::object_at`/`unexpected` passam a `pub(crate)`.
2. [x] `lib.rs`: comandos `subscription_sign_in`, `gemini_auth_preview`, `gemini_auth_apply`.
3. [x] `bridge.ts` e `settings/main.ts`: linha de estado + Connect; troca de modo com diff, backup e Cancel/"Back up and write".
4. [x] `extra.json`: "Use API key" e "Use Google OAuth" nas 13 línguas (as outras frases já existiam).
5. [x] Teste Rust `gemini_auth_switch_keeps_the_rest_and_refuses_what_it_cannot_read`; `cargo test --lib`, `npx tsc --noEmit` e `npm test` passam.
6. [ ] Validação manual (cenários do aceite da spec) e registro no roadmap.
