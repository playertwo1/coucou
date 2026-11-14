# L2.2 — Chat usando o login OAuth do ChatGPT no Lumen

## Objetivo

Permitir que a pessoa converse no chat do Lumen usando a conta ChatGPT conectada na L2.1 (plano ChatGPT), com listagem de modelos, renovação automática de tokens com rotação serializada e streaming na ilha, sem exigir chave paga da API OpenAI e mantendo o provedor `openai` por chave de API intacto e separado.

## Contrato

- **Provedor próprio:** adicionar o provedor `chatgpt` (`ChatGPT`, acento `#10A37F`), separado do provedor `openai` (que continua usando `openai-api-key` e `/v1/chat/completions`).
- **Visibilidade e seleção:**
  - `chatgpt` aparece no seletor de modelos da ilha quando existe conta conectada com `planEnabled` verdadeiro (ou enquanto `chatProvider === "chatgpt"`).
  - Em **Configurações → Chat → Usar seu plano ChatGPT**, atualizar o texto de status e oferecer um botão **Usar no chat / Em uso** na conta ativa para alternar `chatProvider` para `"chatgpt"`.
  - Se `chatProvider === "chatgpt"` sem conta conectada apta, o seletor e o envio informam claramente em pt-BR para conectar/autorizar uma conta em Configurações (com atalho para Configurações), sem enviar requisição de rede.
- **Renovação automática e serializada de tokens (`chatgpt.rs`):**
  - Antes de consultar modelos ou enviar turnos, obter o `access_token` da conta ativa (`index.active`).
  - Se faltar menos de 60 s para `expires_at` (ou quando a API responder HTTP `401`), adquirir `REFRESH_LOCK` (`tokio::sync::Mutex`), rechecar `generation`/`expires_at` sob `STORAGE_LOCK` e, só se ainda precisar, chamar `POST https://auth.openai.com/api/accounts/oauth/token` com `grant_type=refresh_token`, `client_id`, `refresh_token` e `resource=https://api.openai.com/v1`.
  - Persistir atomically a nova geração de tokens (`access`, novo `refresh` rotacionado, `id_token` mantido ou atualizado com verificação de `sub`) e limpar a geração antiga.
  - Em `400`/`401` na renovação, preservar os metadados do perfil para permitir reautorização e retornar erro claro em pt-BR sem expor tokens ou credenciais.
- **Descoberta de modelos (`GET https://api.openai.com/v1/models`):**
  - Autenticação com `Authorization: Bearer <access_token>`.
  - Seguir o contrato oficial SIWC: filtrar `models` mantendo entradas com `visibility == "list"` na ordem devolvida pelo servidor, mapeando `slug` -> `id` e `display_name` (ou `slug`) -> `label` (com fallback para `data` caso um mock envie lista `data`).
- **Inferência via Responses API (`POST https://api.openai.com/v1/responses`):**
  - Enviar `model` (`slug` selecionado; se vazio, descobrir os modelos habilitados e usar o primeiro da lista), `store: false`, `stream: true`, `instructions` (prompt de sistema via `chat::system_prompt(false)`) e `input` com o histórico convertido (`user` com `input_text`/`input_image` e `assistant` com `output_text`). Reutilizar a leitura segura de arquivos/imagens/PDF de `openai_compat::read_attachment`.
  - Consumir o stream SSE (`response.output_text.delta`, `response.completed`, `response.failed`, `error`), emitindo `chat-delta` para `WINDOW_LABEL` com o mesmo throttle do chat local e commitando o turno completo em `Chat` apenas após resposta não vazia.
  - Se receber HTTP `401` antes de emitir texto, renovar o token uma única vez e repetir a chamada; em `404`/`429` ou erro de plano, traduzir para mensagens claras em pt-BR sem citar tokens nem chaves.
- **Segurança e escopo:**
  - Tokens de acesso/atualização permanecem exclusivamente no Rust/cofre do sistema; nenhum token atravessa o IPC nem aparece em logs.
  - Idioma pt-BR nas novas frases da UI; nenhuma alteração no fluxo `openai` com chave de API.

## Fora de escopo

- Alterar o escopo ou fluxo de pareamento/lista do `phone_link` (L6) ou adicionar ferramentas/ações autônomas (fases M).
- Importar sessões do Codex CLI ou alterar telas alheias ao chat e à seção ChatGPT em Configurações.

## Aceite sintético

- Renovação de token expirado ou próximo de vencer rotaciona `generation`, evita corrida sob chamadas concorrentes (`REFRESH_LOCK`) e propaga novo `access_token` sem expor segredos.
- `GET /v1/models` filtra `visibility == "list"` preservando ordem, `slug` e `display_name`, e re-tenta uma vez em `401` após refresh.
- `POST /v1/responses` envia `store: false` e `stream: true`, monta `instructions` e `input` multi-turno (com texto e anexo de imagem/PDF via helper compartilhado), agrega deltas SSE `response.output_text.delta` em ordem e registra o histórico só quando o turno termina com texto.
- UI (`providers.ts`, `chat.ts`, `settings/main.ts`) exibe `ChatGPT` quando conectado ou ativo, seleciona modelo do catálogo sem exigir `openai-api-key` e mantém `anthropic`/`google`/`openai`/`openrouter` inalterados.

## Aceite real

- Com a conta real conectada na `0.6.14+`, abrir o seletor no chat, confirmar a lista de modelos do plano ChatGPT, enviar pergunta simples e multi-turno (incluindo resposta em streaming e recuperação após expiração do access token), e testar no app real.

## Referências oficiais

- [Modelos e inferência (SIWC)](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference)
- [Contas, sessões e proteção de credenciais (SIWC)](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions)
- [Diretrizes de interface (SIWC)](https://developers.openai.com/siwc/ui-ux-guidelines)
