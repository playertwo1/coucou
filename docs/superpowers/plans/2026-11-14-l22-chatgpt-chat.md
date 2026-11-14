# Plano — L2.2 Chat usando o login OAuth do ChatGPT

## Arquivos e interfaces

- `windows/src-tauri/src/openai_compat.rs`: expor `pub(crate) enum Attachment` e `pub(crate) fn read_attachment(path: &str) -> Option<Attachment>` para reaproveitar leitura segura de imagem, PDF e texto sem duplicar código.
- `windows/src-tauri/src/chatgpt.rs`:
  - Adicionar `REFRESH_LOCK: AsyncMutex<()>` e `refresh_active_token(...)` com double-checked lock sob `STORAGE_LOCK` + rotação segura de geração no cofre.
  - Expor `pub fn active_ready() -> bool`, `pub async fn models() -> Result<Vec<ModelInfo>, String>`, `pub async fn send(app: &AppHandle, chat: &Chat, model: &str, query: String, context: Option<ChatContext>) -> Result<ChatReply, String>` e `send_with(...)` (com `on_delta`, teste unitário contra servidor HTTP sintético local).
  - Parser de modelos SIWC (`models` com `visibility == "list"` e `slug`/`display_name`) e parser SSE de `/v1/responses` (`response.output_text.delta`, `response.completed`, `response.failed`, `error`).
- `windows/src-tauri/src/chat.rs`: rotear `provider == "chatgpt"` em `models(...)`, `send(...)` e `send_for_phone(...)`.
- `windows/src/core/state.ts` e `windows/src/core/providers.ts`: adicionar `"chatgpt"` em `ProviderId` e `PROVIDERS`, e ajustar `visibleProviders(settings, subscribed, chatGptConnected)` para exibir `chatgpt` quando conectado ou ativo.
- `windows/src/views/chat.ts`: consultar `Bridge.chatGptStatus()` ao abrir o seletor (e no arranque quando `chatProvider === "chatgpt"`), informar em pt-BR quando faltar conta conectada e indicar uso do plano ChatGPT de forma discreta.
- `windows/src/settings/main.ts`: atualizar o texto de status de `chatGptAccountSection` e incluir botão **Usar no chat / Em uso** na conta ativa com `planEnabled`.
- Testes: `windows/src-tauri/src/chatgpt.rs` (refresh/rotação/concorrência, parse de `/v1/models`, build de `/v1/responses` e streaming SSE sintético) e `windows/tests/providers.test.mjs` + `windows/tests/chat.test.mjs`.

## Passos

1. Refatorar leitura de anexos em `openai_compat.rs` em `read_attachment` sem alterar o comportamento dos provedores OpenAI-compatíveis existentes.
2. Implementar em `chatgpt.rs`:
   - `parse_models_response` (filtro `visibility == "list"`, ordenação preservada, fallback `data`).
   - `refresh_session_tokens` serializado por `REFRESH_LOCK` com `save_refreshed`.
   - `build_responses_body` (`store: false`, `stream: true`, `instructions`, `input`) e `parse_sse_event`.
   - `models()`, `send()` e `send_with()` com retry único em `401` após refresh e emissão de `chat-delta`.
   - Testes Rust sintéticos (servidor loopback mock HTTP + `MemoryStore`) cobrindo refresh/rotação, parse de catálogo, streaming SSE, retry `401`, `store: false`, `stream: true` e falhas sem apagar histórico nem expor tokens.
3. Ligar `"chatgpt"` em `chat.rs`, `state.ts`, `providers.ts`, `chat.ts` e `settings/main.ts`, atualizando os testes TypeScript/Node em `windows/tests/providers.test.mjs` e `windows/tests/chat.test.mjs`.
4. Rodar validação completa:
   - `npx tsc --noEmit`
   - `npm test`
   - `npm run build`
   - `cargo test --lib`
5. Atualizar `docs/roadmap/fase-l-lumen.md`, `docs/STATE-FORK.md` e `docs/ROADMAP-FORK.md` com o resultado sintético de L2.2 (mantendo o aceite real da L2 aberto até teste em conta real), commitar na branch `feat/l22-chatgpt-chat` e integrar na `main` (só `origin`).

## Rollback

- O provedor `"chatgpt"` e suas chaves `siwc-profile-*` continuam totalmente isolados de `openai-api-key` e dos demais provedores; se houver falha de rede, refresh ou sessão, os metadados da conta são preservados para reautorização e `chat.commit` não grava o turno com falha.
