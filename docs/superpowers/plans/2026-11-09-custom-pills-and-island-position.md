# Pílulas configuráveis e posição livre da ilha — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** deixar o usuário escolher as pílulas visíveis e arrastar a ilha horizontalmente no topo, mantendo Claude Code como principal e as posições atuais.

**Architecture:** reutilizar `mainPill` e `activeIntegrations` para seleção, acrescentar Grok Bot ao catálogo e ao instalador de hooks existente, e guardar a posição superior personalizada como um valor normalizado. O frontend detecta o gesto e o código Tauri move e limita a janela; a posição final é salva pelo fluxo atual de configurações.

**Tech Stack:** TypeScript, Rust, Tauri 2, Node.js `node:test`, testes Rust.

**Spec:** `docs/superpowers/specs/2026-11-09-custom-pills-and-island-position-design.md`

## Global Constraints

- Claude Code continua como pílula principal; as quatro vagas secundárias padrão são `agent_codex`, `agent_antigravity`, `agent_grok` e `integration_github`.
- Resend, n8n e Vercel continuam selecionáveis; ficam desativados no padrão. Desativar pílulas não apaga chaves ou credenciais.
- O limite continua em quatro pílulas secundárias. IDs já publicados permanecem estáveis.
- A mudança cobre o aplicativo Windows do fork; não altera macOS nem Android.
- O Grok Bot usa o ID Coucou `agent_grok`, com eventos encaminhados pelo hook de agente. Confirmar o contrato real do hook do Orca antes de codificar a integração; não anunciar conexão sem uma rota funcional.
- A posição personalizada usa `islandCorner = "topCustom"` e `islandTopX` normalizado entre 0 e 1. Só X muda; o topo, o recuo e os quatro cantos existentes são preservados.
- Arrastar começa fora dos controles interativos e apenas depois de ultrapassar o limiar de movimento. Cliques continuam clicando.
- A migração troca a lista somente se ela for exatamente o padrão antigo `integration_resend`, `integration_n8n`, `integration_vercel`, `integration_github`. Qualquer lista diferente é preservada.
- Não remover código dos serviços nem criar integração de chat/API xAI.

## Review Focus

- O hook do Grok usa eventos compatíveis e não perde os dados da sessão — fixture sanitizada e teste do relay/instalador na Tarefa 1.
- O padrão antigo migra, enquanto configurações personalizadas ficam intactas — testes Rust de parsing na Tarefa 2.
- Um clique em botão, campo, link ou Mochi não vira arraste da ilha — teste do limiar e verificação manual na Tarefa 3.
- Valores X fora de 0–1, monitores com origem negativa e telas de larguras diferentes mantêm a ilha dentro do monitor e no topo — testes Rust na Tarefa 3.
- Os cinco locais existentes e o modo expandido/recolhido continuam funcionais depois de salvar e reabrir — testes de geometria e verificação manual na Tarefa 4.

---

### Tarefa 1: Confirmar e ligar o hook do Grok Bot

**Arquivos:**
- Ler: `docs/ROADMAP-FORK.md`, `docs/AGENTS.md`, `windows/src-tauri/src/agents.rs`, `windows/hook/src/main.rs`, `windows/hook/src/normalize.rs`
- Criar: `windows/tests/fixtures/agents/grok-session.json` (payload sanitizado)
- Modificar: `windows/src-tauri/src/agents.rs`, `windows/src/island/agents.ts`
- Testar: `windows/tests/agents.test.mjs`, testes unitários em `windows/src-tauri/src/agents.rs` e `windows/hook/src/main.rs` ou `windows/hook/src/normalize.rs`, conforme o formato encontrado

**Interfaces:**
- Consome: eventos de sessão do Grok Bot encaminhados pelo hook do Orca.
- Produz: agente instalável com ID `grok`, que o relay publica como pílula `agent_grok`; sem suporte a decisões de aprovação nesta tarefa.

- [ ] **Etapa 1: Inspecionar o hook Grok do Orca**. Registrar caminho de configuração, nomes de eventos e campos usados para sessão; remover prompt, caminhos pessoais e tokens antes de guardar qualquer payload.
- [ ] **Etapa 2: Escrever testes de instalação e remoção**. Em `agents.rs`, o teste `grok_install_preserves_orca_entries_and_uninstall_removes_only_coucou` verifica `Agent::from_id("grok").is_some()` e que a entrada preexistente do Orca continua igual após instalar e remover Coucou. Em `agents.test.mjs`, `grok_has_a_stable_display_name` verifica `agentName("grok") === "Grok Bot"`.
- [ ] **Etapa 3: Rodar os testes de hooks e nomes de agentes**.

  Run: `node --import ./tests/setup.mjs --test tests/agents.test.mjs` em `windows`; `cargo test` em `windows/src-tauri` e `windows/hook`.
  Expected: os testes novos falham antes da implementação porque Grok ainda não consta em `Agent::ALL`.

- [ ] **Etapa 4: Adicionar `Agent::Grok`** em `windows/src-tauri/src/agents.rs`, usando o caminho e os eventos apurados, `--agent grok` e o fluxo existente de preview, fingerprint, backup e gravação segura. Só alterar `windows/hook/src/normalize.rs` se os eventos reais não forem canônicos; fixar a tradução com o fixture.
- [ ] **Etapa 5: Expor o nome “Grok Bot”** em `windows/src/island/agents.ts` e manter a cor compatível com o catálogo. Não incluir Grok na lista de agentes com cartões de aprovação.
- [ ] **Etapa 6: Reexecutar `node --import ./tests/setup.mjs --test tests/agents.test.mjs`** em `windows` e `cargo test` em `windows/src-tauri` e `windows/hook`; verificar manualmente no Orca que `SessionStart`, atividade e encerramento chegam como `agent_grok`.
- [ ] **Etapa 7: Commit**.

  ```bash
  git add windows/src-tauri/src/agents.rs windows/src/island/agents.ts windows/hook/src/main.rs windows/hook/src/normalize.rs windows/tests/agents.test.mjs windows/tests/fixtures/agents/grok-session.json
  git commit -m "feat: add Grok Bot hook support"
  ```

**Bloqueio:** se o Orca não fornecer eventos de sessão do Grok nem existir configuração segura para adicionar o hook do Coucou, parar aqui e ajustar o desenho antes de exibir a pílula como agente conectado.

### Tarefa 2: Configurar pílulas visíveis e atualizar os padrões

**Arquivos:**
- Modificar: `windows/src/core/pills.ts`, `windows/src/core/state.ts`, `windows/src-tauri/src/settings.rs`
- Testar: `windows/tests/pills.test.mjs` e testes de parsing/defaults em `windows/src-tauri/src/settings.rs`

**Interfaces:**
- Consome: `Agent::Grok` e o nome de agente adicionados na Tarefa 1.
- Produz: catálogo de pílulas que aceita `agent_grok`; novos perfis e perfis com o padrão antigo usam as quatro pílulas aprovadas.

- [ ] **Etapa 1: Escrever testes que falham**. Atualizar `the catalog holds the Mac's pills with the Claude Code label for Windows and Linux` com `agent_grok` (`Grok Bot`, categoria `workspace`, origem `agent`, conexão por hooks). Em `the new Windows defaults show the requested pills`, afirmar `mainPill === "integration_claude"` e `activeIntegrations === ["agent_codex", "agent_antigravity", "agent_grok", "integration_github"]`. Em `a declared Grok pill stays idle between sessions`, declarar Grok, guardar a task retornada por `State.tasks.find(t => t.id === "agent_grok")`, chamar `State.removeTask("agent_grok")` e afirmar `grok.state === "idle"`. Manter um teste explícito de limite em quatro.
- [ ] **Etapa 2: Escrever testes Rust de migração**. Em `the previous shipped pill defaults migrate once`, afirmar que a lista antiga exata vira `[agent_codex, agent_antigravity, agent_grok, integration_github]`; em `custom pill selections are preserved`, afirmar que uma lista diferente permanece idêntica.
- [ ] **Etapa 3: Executar os testes focados**.

  Run: `node --import ./tests/setup.mjs --test tests/pills.test.mjs` em `windows`; `cargo test` em `windows/src-tauri`.
  Expected: falham por falta do catálogo Grok e da migração.

- [ ] **Etapa 4: Adicionar `agent_grok` ao catálogo** em `windows/src/core/pills.ts`; reconhecer “Grok Bot” como nome de sessão. Reutilizar os controles atuais de Active pills/Integrations, sem criar uma segunda lista.
- [ ] **Etapa 5: Atualizar os padrões** em `windows/src/core/state.ts` e `Settings::default` em `windows/src-tauri/src/settings.rs`. Acrescentar `migrate_legacy_pills(settings: &mut Settings)` e chamá-la ao ler as configurações; ela substitui somente a lista antiga exata e preserva qualquer seleção customizada.
- [ ] **Etapa 6: Executar novamente os testes focados**, depois `npm test` em `windows` e `cargo test` em `windows/src-tauri`.
- [ ] **Etapa 7: Commit**.

  ```bash
  git add windows/src/core/pills.ts windows/src/core/state.ts windows/src-tauri/src/settings.rs windows/tests/pills.test.mjs
  git commit -m "feat: configure visible agent pills"
  ```

### Tarefa 3: Arrastar e salvar a posição horizontal no topo

**Arquivos:**
- Criar: `windows/src/core/island-position.ts`, `windows/tests/island-position.test.mjs`
- Modificar: `windows/src/core/state.ts`, `windows/src/core/bridge.ts`, `windows/src/island/island.ts`, `windows/src/settings/main.ts`, `windows/src/i18n/extra.json`, `windows/src/i18n/strings.json`, `windows/src-tauri/src/settings.rs`, `windows/src-tauri/src/island.rs`, `windows/src-tauri/src/lib.rs`
- Testar: `windows/tests/island-position.test.mjs` e testes de geometria em `windows/src-tauri/src/island.rs`

**Interfaces:**
- Consome: `islandCorner`/`islandTopX` e o fluxo `Bridge.saveSettings` atual.
- Produz: `Bridge.islandDragBegin() -> Promise<[number, number] | null>`, `Bridge.islandDragMove(x: number) -> Promise<void>` e `Bridge.islandDragEnd() -> Promise<number | null>`; `x` recebido/devolvido pela ponte é físico durante o movimento e normalizado de 0 a 1 ao terminar.
- Produz também os helpers puros `shouldStartIslandDrag(distance: number, targetIsInteractive: boolean): boolean` e `draggedIslandX(originX: number, startPointerX: number, currentPointerX: number, scale: number): number` em `windows/src/core/island-position.ts`.

- [ ] **Etapa 1: Escrever testes de gesto, persistência e geometria**. Em `windows/tests/island-position.test.mjs`, o teste `island drag needs a threshold and ignores controls` afirma `shouldStartIslandDrag(5, false) === false`, `shouldStartIslandDrag(6, false) === true` e `shouldStartIslandDrag(6, true) === false`; `horizontal drag scales pointer movement` afirma `draggedIslandX(100, 200, 230, 1.5) === 145`. Em `settings.rs`, `custom top position survives settings round trip` afirma que `islandTopX` continua igual após save/load. Em `island.rs`, `custom top position clamps and keeps the top inset` verifica que, para monitor `(-1920, 0, 1920)`, janela `(720, 400)` e recuo `30`, X normalizado `0`, `0.5` e `1` resulta respectivamente em `-1920`, `-1320` e `-720`; valores acima de 1 ficam em `-720`, `NaN` volta ao centro `-1320`, e Y continua `30`.
- [ ] **Etapa 2: Rodar os testes focados**.

  Run: `node --import ./tests/setup.mjs --test tests/island-position.test.mjs` em `windows`; `cargo test` em `windows/src-tauri`.
  Expected: falham porque não há modo `topCustom`, campo X ou gesto de arraste.

- [ ] **Etapa 3: Adicionar `islandTopX`** ao tipo e default TypeScript em `windows/src/core/state.ts` e ao `Settings` Rust em `windows/src-tauri/src/settings.rs`, com default `0.5`. Ao escolher “centro superior”, redefinir X para `0.5`; incluir a opção localizada “topo personalizado” em `windows/src/settings/main.ts` e `windows/src/i18n/extra.json`, depois regenerar `strings.json` com `node scripts/gen-strings.mjs` em `windows`.
- [ ] **Etapa 4: Estender `corner_origin`** em `windows/src-tauri/src/island.rs` para `topCustom`: interpolar entre a borda esquerda e direita menos a largura atual da janela, limitar X a `[0, 1]` e manter o recuo superior. Deixar `top`, `topLeft`, `topRight`, `bottomLeft` e `bottomRight` iguais.
- [ ] **Etapa 5: Adicionar os comandos de arraste** em `windows/src-tauri/src/island.rs` e registrá-los em `windows/src-tauri/src/lib.rs`. `begin` devolve a origem nativa; `move` altera só X e limita a janela ao monitor; `end` devolve X normalizado. Quando `islandTopX` ou `islandCorner` mudar, `save_settings` reaplica a geometria.
- [ ] **Etapa 6: Implementar os helpers e ligar o gesto em `windows/src/island/island.ts`**. Só iniciar em `top` ou `topCustom` e fora do modo oculto, em área de fundo fora de botões, links, campos e Mochi; usar `shouldStartIslandDrag` e `draggedIslandX`, limitar o gesto ao eixo X e adiar o `fsm.click()` no modo recolhido até `mouseup`. Sob o limiar, executar o clique como hoje; acima dele, mover e suprimir o clique. Chamar `Bridge.saveSettings` ao soltar para persistir `topCustom` e o X devolvido.
- [ ] **Etapa 7: Executar os testes focados** e `npm run build` em `windows`; executar `cargo test` em `windows/src-tauri`.
- [ ] **Etapa 8: Commit**.

  ```bash
  git add windows/src/core/island-position.ts windows/tests/island-position.test.mjs windows/src/core/state.ts windows/src/core/bridge.ts windows/src/island/island.ts windows/src/settings/main.ts windows/src/i18n/extra.json windows/src/i18n/strings.json windows/src-tauri/src/settings.rs windows/src-tauri/src/island.rs windows/src-tauri/src/lib.rs
  git commit -m "feat: drag island horizontally along top"
  ```

### Tarefa 4: Verificação integrada e documentação

**Arquivos:**
- Modificar: `windows/README.md`, `CHANGELOG.md`, `windows/src/whats-new/whats-new.json`
- Verificar: `windows/tests/*.test.mjs`, `windows/src-tauri`, `windows/hook`, telas reais do aplicativo Windows

**Interfaces:**
- Consome: as funcionalidades e testes das Tarefas 1–3.
- Produz: instruções de uso, changelog e What's New traduzidos, com a suíte completa e a verificação manual aprovadas.

- [ ] **Etapa 1: Verificar manualmente** uma instalação nova e um `settings.json` com o padrão antigo; confirmar Claude Code principal, Codex/Antigravity/Grok Bot/GitHub selecionados, serviços antigos desmarcados, preservação de chaves e listas personalizadas, e Grok alternando entre atividade e idle.

- [ ] **Etapa 2: Verificar o arraste no Windows** em modo recolhido e expandido, nas duas bordas e no centro, com escala de tela diferente de 100%; clicar em cada botão/campo, arrastar o Mochi e testar os quatro cantos antigos. Fechar e reabrir o app e confirmar a posição salva.

- [ ] **Etapa 3: Documentar** a seleção de pílulas e a posição livre no README, changelog e What's New; manter todas as 14 traduções do What's New válidas.

- [ ] **Etapa 4: Rodar a suíte completa**.

  Run: `npm test` e `npm run build` em `windows`; `cargo test` em `windows/src-tauri` e `windows/hook`; `python3 scripts/test-whats-new.py` na raiz.
  Expected: todos passam.

- [ ] **Etapa 5: Commit**.

  ```bash
  git add windows/README.md CHANGELOG.md windows/src/whats-new/whats-new.json
  git commit -m "docs: document configurable pills and island position"
  ```

**Ordem:** Tarefa 1 → Tarefa 2 → Tarefa 3 → Tarefa 4. As Tarefas 2 e 3 compartilham os tipos de configuração; mantê-las sequenciais evita conflitos. Não alterar a configuração do Orca sem preservar as entradas que já existem.
