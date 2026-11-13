# Plano — L2.1 Entrar com ChatGPT no Lumen

## Limites

Uma subfase por vez. Implementar somente a conexão OAuth, armazenamento seguro, resumo das contas e controles de conta em Configurações → Chat. Inferência e integração do provedor no chat ficam para L2.2. Não importar nem copiar tokens ou código privado de outro app.

## Arquivos e interfaces

- `windows/src-tauri/src/chatgpt.rs` (novo): listener loopback, PKCE, troca/renovação/revogação, validação OIDC e resumo de contas.
- `windows/src-tauri/src/secrets.rs`: acesso Rust-only ao conjunto de credenciais por perfil, com chaves internas derivadas do hash do `client_id`; nenhuma chave arbitrária recebida da webview.
- `windows/src-tauri/src/lib.rs`: comandos Tauri e registro do módulo. O host ID e o índice/metadata de contas ficam em entradas internas do cofre, fora de `Settings` e inacessíveis à webview.
- `windows/src/core/bridge.ts` e `windows/src/settings/main.ts`: chamadas para estado, conectar, reautorizar, ativar e sair; nenhum token ou código passa pelo bridge.
- `windows/src/i18n/extra.json`: novas frases somente em pt-BR, conforme as regras da Fase L.
- `windows/src-tauri/Cargo.toml` / `Cargo.lock`: usar Base64URL para PKCE e `jsonwebtoken` com `RS256` e JWK do emissor oficial. Versão `jsonwebtoken` 9.3.1 tem licença MIT e MSRV 1.73; conferir o lock e o backend criptográfico antes de adicionar.
- `windows/src-tauri/src/chatgpt.rs` e testes já existentes: testes com servidor/chaves/tokens sintéticos e repositório de credenciais em memória; nenhum login real ou segredo em fixture.
- `docs/roadmap/fase-l-lumen.md`, `docs/STATE-FORK.md`, `docs/ROADMAP-FORK.md`: registrar a decisão do proprietário sobre personagens, andamento L2.1 e avaliação real pendente de L1.3.

## Passos

1. Conferir árvore limpa; buscar `upstream` e integrar `upstream/main` na branch própria. Feito nesta subfase: branch `codex/l2-chatgpt-oauth`; `git fetch upstream`; `git merge upstream/main` sem mudanças necessárias.
2. Confirmar as APIs/versões das dependências escolhidas e o padrão de armazenamento do keyring. Não codificar verificação JWT própria.
3. Implementar modelos de estado e armazenamento por perfil; preservar tokens antigos até autenticar e validar integralmente uma substituição.
4. Implementar callback em `127.0.0.1` com caminho fixo, state/nonce/PKCE e timeout; abrir só o navegador padrão. A troca recebe apenas o URI exato da tentativa.
5. Validar JWT e escopos, guardar tokens no cofre e emitir à webview apenas estado/resumos. Implementar refresh serializado e revogação.
6. Adicionar a seção pt-BR para conectar, mostrar/trocar contas e sair. Preservar o provedor `openai` com chave de API e seu segredo já guardado.
7. Testar rejeições e isolamento sinteticamente. Revisar os logs e o contrato Rust ↔ webview para confirmar que código e tokens não atravessam a fronteira.
8. Executar `cargo test --lib` em `windows/src-tauri`; `npx tsc --noEmit`, `npm test` e `npm run build` em `windows/`.
9. Após PASS, preparar versão/release de avaliação, What's New, changelog e README conforme o checklist. Publicar somente em `origin`; registrar que login em conta real permanece NOT_RUN até o dono testar.

## Rollback

- O OAuth usa entradas e IDs próprios; não apaga nem altera a chave `openai-api-key` existente.
- Falha no fluxo ou na gravação mantém as credenciais anteriores do perfil intactas.
- Saída apaga os tokens daquele perfil apenas depois da tentativa de revogação; se a rede falhar, apaga localmente e informa que a revogação remota não foi confirmada.
- O host ID e o registro não secreto da conta permanecem na configuração/cofre para permitir reautenticação; não alterar diretórios de settings, hook, AUMID ou identidade MSI/NSIS.

## Checkpoint

Sintético PASS não comprova login real. Após a release, o dono confirma navegador, consentimento, persistência, renovação, duas contas, troca e saída. Até esse teste, a avaliação real fica **NOT_RUN**; a L1.3 também continua em avaliação real.
