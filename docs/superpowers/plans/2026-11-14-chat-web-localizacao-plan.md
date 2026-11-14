# Plano — Chat com internet e localização

Spec: [../specs/2026-11-14-chat-web-localizacao-design.md](../specs/2026-11-14-chat-web-localizacao-design.md). Branch: `feat/chat-web-localizacao`.

## Tarefa 1 — Rust: ajuste e prompt (`windows/src-tauri/src/`)

- `settings.rs`: campo `pub chat_location: String` em `Settings` (vazio no `Default`); acrescentar `"chatLocation"` ao JSON de exemplo e à lista de chaves dos testes existentes.
- `chat.rs`:
  - `fn location_line(raw: &str) -> Option<String>`: troca quebras de linha por espaço, apara, corta em 120 caracteres; vazio → `None`.
  - `system_prompt(web_search)` acrescenta `Today's date: AAAA-MM-DD` (de `crate::platform::local_time()`) e, havendo `location_line(&crate::settings::load().chat_location)`, `The user's location: …`. A parte pura fica numa função testável que recebe data e localização; `system_prompt_for` e os testes atuais não mudam.
- Testes: `location_line` (vazio, quebra de linha, corte); prompt com e sem localização; settings sem `chatLocation` carrega vazio.

## Tarefa 2 — Rust: `web_search` no Plano ChatGPT (`chatgpt.rs`)

- `build_responses_body` ganha `web: bool`; com `true`, inclui `"tools": [{ "type": "web_search" }]`.
- `send_with_endpoints`: monta o corpo com web e `system_prompt(true)`. No laço de envio, se o status for 400 e o corpo atual tiver `tools`, troca o corpo pelo sem web (`system_prompt(false)`) e repete uma vez. O 401 continua como está. O laço passa a permitir as duas repetições independentes (401 e 400), cada uma no máximo uma vez.
- Testes (padrão do servidor loopback já usado no arquivo): corpo com `tools`; 400 com `tools` → segunda requisição sem `tools` e resposta entregue; `parse_sse_line` devolve `None` para `response.web_search_call.completed`.

## Tarefa 3 — TypeScript: seção nos Ajustes (`windows/src/`)

- `core/state.ts`: `chatLocation: string` no tipo e `""` no padrão.
- `settings/main.ts`: `chatLocationSection()` no estilo de `chatGptAccountSection` (frases pt-BR diretas), com campo de texto (`maxLength` 120), **Salvar** e **Apagar**, e o aviso da spec; entra na aba `chat` só com `LUMEN_WINDOWS`, depois da seção do ChatGPT.
- Teste em `windows/tests/` se já houver teste dos padrões de `state.ts`; senão, o typecheck cobre.

## Validação

Em `windows/`: `npx tsc --noEmit`, `npm test`, `npm run build`. Em `windows/src-tauri/`: `cargo test --lib`.

## Fechamento

- Atualizar `docs/STATE-FORK.md` (etapa implementada, sintético aprovado, real NOT_RUN).
- Um commit na branch, push só para `origin`. Sem release até o dono pedir.

## Rollback

Reverter o commit. `chatLocation` sobrando em `settings.json` é ignorado por versões antigas (`serde(default)`).
