# L1.4d-1 — base Canvas e Codex

## Decisão e limite de aceite

Em 2026-11-13, o proprietário escolheu Canvas com base na revisão técnica da L1.4b. A decisão autoriza a L1.4d. Ela não aprova este código, não encerra a avaliação real da L1.4 e não torna medidas não executadas em evidência. Sem autorização escrita para usar o Mochi, todo desenho é original do Lumen; a Bússola permanece somente no ícone do app.

## Escopo

- Manter a API de execução consumida como `BotEngine` e a exportação compatível `CompassEngine`, sem importar a arte de desenho de `windows/src/mochi/engine.ts`.
- Substituir o desenho da Bússola no alias Windows por uma família Canvas própria. Implementar as primitivas comuns (contorno índigo, sombra discreta, olhos, boca) e o Codex conforme `windows/design/personagens/codex-estados.png`: corpo arredondado, aba pequena e poses nos 11 `BotStateName`.
- Resolver a identidade a partir do `State.focusTask.id` na ilha e de `AgentTask.id` nas mini pílulas. Nesta subetapa só Codex tem silhueta própria; qualquer agente ainda não implementado usa o genérico aprovado até d2.
- Conservar propriedades e métodos públicos que os callers acessam (estado, emotes, roupa, humor, morph, badges, dança e gestos). Não introduzir timer, CSS animation ou `requestAnimationFrame` próprio. O desenho e os passos temporais ficam no update chamado pelo loop atual.
- Com movimento reduzido, desenhar só a pose estática do estado e não manter `busy` por movimento contínuo. Repouso também não mantém o loop da ilha ativo quando oculta.
- Acrescentar página de desenvolvimento fora das entradas de build/release. Mostrar a matriz completa de sete agentes × 11 estados, a 22 e 96 px e DPR 1, 1,5 e 2. Codex usa Canvas; os outros seis mostram o Canvas pendente de d2 e os PNGs aprovados para os oito estados disponíveis, com indicação explícita dos estados adicionais sem prancha.

## Fora de escopo

- As silhuetas Canvas dos outros seis agentes (d2), animações P1 (d3), P2 (d4), release ou aceite real do proprietário.
- Métricas de CPU/memória/instalador ainda não medidas pela comparação estática L1.4b.
- Animações P3: registradas somente nas fases L3–L7.

## Arquivos e callers

- `windows/src/lumen/compass-engine.ts`: engine Canvas e export compatível.
- `windows/src/island/island.ts`: identidade do foco atual; preservar o comportamento Mochi fora do alias Windows.
- `windows/src/mochi/minibots.ts`: identidade de cada mini pílula; preservar o comportamento Mochi fora do alias Windows.
- `windows/design/personagens/prototipo/l14d1-conferencia.html`: página de desenvolvimento, fora do build de release.
- `windows/tests/lumen-character-engine.test.mjs`: estados, emotes, mapa/fallback, idle e movimento reduzido.
- `docs/roadmap/fase-l-lumen.md`, `docs/STATE-FORK.md`, `docs/ROADMAP-FORK.md`, `docs/roadmap/parqueado.md`, README/comparação das referências e `LICENSE-ASSETS.md`.

## Verificação e aceite d1

- Canvas não lança exceção ao desenhar Codex nos 11 estados e em todos os sete emotes; o mapa reconhece `agent_codex`/`codex` e usa genérico para desconhecido.
- Em estado `idle`, `busy` é falso; com `prefers-reduced-motion: reduce`, o nível de dança não avança e o loop não é mantido por animação contínua.
- A página expõe os sete agentes × 11 estados, 22/96 px e DPR 1/1,5/2; deixa explícito onde exibe PNG de referência em vez de Canvas implementado.
- `npx tsc --noEmit`, `npm test`, `npm run build` e `cargo test --lib` passam. Esses resultados são sintéticos; não fecham avaliação real nem medição de CPU Tauri.
- Apresentar a página ao proprietário e parar. d2 depende da revisão da subetapa.

## Reversão

Reverter o commit único da L1.4d-1. Preservar as pranchas aprovadas, a decisão explícita do Canvas e os registros históricos da L1.4a/L1.4b. Nenhuma migração de dados ou config de usuário é feita.
