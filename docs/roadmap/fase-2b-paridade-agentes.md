> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase 2B — Paridade entre agentes e ambientes

Objetivo: Claude, Codex, Antigravity e Hermes devem compartilhar as funções de agente; herdr e Orca são ambientes de execução. Executar na ordem abaixo e fechar cada checkpoint antes da etapa seguinte.

### Mapa de entrada no código

| Função | Ponto de entrada Windows |
|---|---|
| Relay e normalização | `windows/hook/src/main.rs`, `normalize.rs`, `reply.rs` |
| Instalação de hooks/plugins | `windows/src-tauri/src/agents.rs` |
| Eventos e sessão na ilha | `windows/src/island/hooks.ts` |
| Diffs | `windows/src/core/diff.ts`, `windows/src/island/hooks.ts` |
| Nova sessão | `windows/src-tauri/src/launch.rs`, `windows/src/views/launch.ts` |
| Soltar arquivo | `windows/src-tauri/src/launch.rs`, `windows/src/views/session-drop.ts` |
| Foco em herdr | `windows/src-tauri/src/herdr.rs`, `session_window.rs` |
| CLI local | `windows/src-tauri/src/cli_relay.rs` |
| Uso de plano | `windows/src-tauri/src/codex_plan.rs`, `windows/src/core/plan.ts` |

### Estado conhecido antes da Fase 2B.0

Nesta tabela, `✅` significa implementação identificada no código; só significa “validado” quando houver fixture e evidência da execução real. `?` permanece desconhecido até a Etapa 2B.0.

| Função | Claude | Codex | Antigravity | Hermes |
|---|---:|---:|---:|---:|
| Sessões/etapas/resumo semanal | ✅ | ✅ | ✅ | ✅ |
| Permitir/Negar na ilha | ✅ | ✅ | ✅ com configuração habilitada | Observador; autorização depende da API do Hermes |
| Perguntas com opções | ✅ | ? | ? | ? |
| Diff ao vivo | ✅ | ❌ | ❌ | ❌ |
| Nova sessão | ✅ | ❌ | ❌ | ❌ |
| Soltar arquivo/Abrir terminal | ✅ | ? | ? | ? |
| Uso do plano | ✅ | ✅ | ? | Não se aplica a chave de API |

`?` significa não validado com fixture e teste. Não converter desconhecido em suportado por inferência.

### 2B.0 — Descoberta e fixtures (P; sem código de produto)

Objetivo: substituir cada `?` por uma capacidade observada, impossível com evidência, ou uma pergunta de pesquisa concreta. Não editar código do app nesta etapa.

#### 2B.0.1 — Codex

- [ ] Preparar instalação de teste e backup dos hooks/configs; registrar diff antes de qualquer instalação ou atualização.
- [ ] Capturar início/fim de sessão, prompt, criação/edição de arquivo, comando, pergunta, falha e encerramento; sanitizar prompts, caminhos pessoais e tokens.
- [ ] Anotar nome de cada evento, campos disponíveis, limite/timing e comportamento com Coucou fechado.
- [ ] Confirmar pergunta/resposta, CLI, diretório de trabalho e como enviar prompt sem shell concatenado.
- [ ] Exercitar “Abrir terminal” e drop de arquivo; registrar PASS/FAIL e evidência.
- Checkpoint 2B.0.1: fixture revisável cobre eventos observados, e config original pode ser restaurada pelo backup.

#### 2B.0.2 — Antigravity

- [ ] Repetir a captura de eventos da 2B.0.1 para iniciar/encerrar, edição, comando, pergunta e falha.
- [ ] Identificar se PostToolUse contém diff/texto e se perguntas aceitam resposta externa.
- [ ] Localizar fonte local de quota/reset; registrar caminho/formato sanitizado e comportamento quando ausente/corrompida.
- [ ] Confirmar CLI, recepção segura do prompt, “Abrir terminal” e drop de arquivo.
- Checkpoint 2B.0.2: capacidades de hooks, pergunta, uso e lançamento têm PASS/FAIL/IMPOSSÍVEL sustentado por fixture ou evidência.

#### 2B.0.3 — Hermes

- [ ] Instalar plugin de teste somente com backup e diff; capturar eventos de início/fim, edição, comando, pergunta e falha.
- [ ] Provar se o plugin pode aguardar e devolver Allow/Deny; medir timeout e retorno após erro ou Coucou fechado.
- [ ] Confirmar formato de perguntas/respostas, diff disponível, CLI e transporte seguro do prompt.
- [ ] Testar “Abrir terminal” e drop de arquivo.
- Checkpoint 2B.0.3: round-trip Allow/Deny está comprovado ou marcado IMPOSSÍVEL com evidência; nenhum evento foi inferido.

#### 2B.0.4 — CLI local e transporte de prompt

- [ ] Para Claude, Codex, Antigravity e Hermes, registrar executável, argumentos, detecção de instalação e diretório de trabalho.
- [ ] Enviar prompt de fixture com aspas, `;`, `&` e novas linhas; conferir igualdade byte a byte no agente.
- [ ] Registrar se o canal seguro é stdin, variável de ambiente, arquivo temporário protegido ou API do agente; rejeitar concatenação no shell.
- Checkpoint 2B.0.4: há comando reproduzível e transporte seguro ou bloqueio documentado para cada agente.

#### 2B.0.5 — herdr

- [ ] Confirmar comandos e argumentos para criar/focar painel, iniciar agente e enviar arquivo.
- [ ] Registrar exemplos sanitizados, versão e comportamento de herdr ausente/fechado.
- Checkpoint 2B.0.5: comandos podem ser repetidos sem texto de arquivo ser executado como comando.

#### 2B.0.6 — Orca

- [x] Descoberta inicial feita em 2026-11-09: handle `ORCA_TERMINAL_HANDLE` no formato `term_<uuid>` e CLI `orca.exe` identificados.
- [ ] Instalar Coucou no ambiente de teste e repetir `orca status --json`; confirmar agentes, handle e eventos com app aberto.
- [ ] Confirmar CLI para foco, envio de arquivo sem Enter, sessão existente e worktree nova; registrar saída sanitizada.
- [ ] Verificar que os hooks existentes em `.claude`, `.codex` e `.gemini` sobrevivem à instalação, atualização e remoção.
- Checkpoint 2B.0.6: comportamento visto com app aberto; descoberta inicial sozinha não conta como validação de integração.

#### 2B.0.7 — Matriz de capacidades e encerramento

- [ ] Atualizar as duas tabelas “Estado conhecido” por agente e capacidade, citando fixture/evidência local.
- [ ] Para cada `?`, marcar suportado, IMPOSSÍVEL (com evidência) ou escrever a pergunta e o responsável pela investigação.
- [ ] Testar “Abrir terminal” e drop em cada ambiente suportado; registrar PASS/FAIL e fallback observado.
- [ ] Sanitizar fixtures e garantir que não contêm prompt real, caminho pessoal, token ou resposta privada.
- Checkpoint 2B.0: nenhuma célula `?` sem próxima ação definida; fixtures e evidências são reproduzíveis e seguras.

### 2B.1 — Soltar arquivo e abrir terminal (P; só se 2B.0 reproduzir falha)

- [ ] Para cada falha, escrever um teste que falha em `launch.rs`, `session_window.rs` ou `tests/launch.test.mjs`.
- [ ] Corrigir o caminho comum por `session_id`; adicionar ramificação por agente só se o protocolo realmente diferir.
- [ ] Manter fallback atual: se a janela não existir, copiar os caminhos para a área de transferência e anunciar “copied”.
- [ ] Rodar `npm test`, `cargo test --lib` e `cargo test` em `windows/hook`.
- [ ] Repetir o cenário manual no agente/ambiente que falhou.
- Se todos os cenários passarem na 2B.0, marcar N/A com a evidência e não alterar código.
- Checkpoint 2B.1: todos os ambientes testados passam ou cada exceção está registrada como impossível.

### 2B.2 — Diff ao vivo (M)

#### 2B.2A — Contrato do evento e fixtures

- [ ] Confirmar com fixtures que PostToolUse contém patch/texto e que os limites atuais de payload valem para cada agente suportado.
- [ ] Acrescentar um teste por ferramenta de edição descoberta; cobrir dois arquivos, arquivo novo, apagado e renomeado.
- Checkpoint 2B.2A: cada fixture define evento, agente, arquivos afetados e conteúdo disponível sem depender de inferência.

#### 2B.2B — Montagem e registro por arquivo

- [ ] Expandir `buildFileDiff` em `windows/src/core/diff.ts` para devolver `FileDiff[]`; adaptar `recordDiff` para gravar cada arquivo separadamente.
- [ ] Preservar limites de tamanho e lidar com payload ausente/incompleto sem apresentar diff inventado.
- Checkpoint 2B.2B: novo, editado, apagado e renomeado são representados corretamente, com teste unitário por caso.

#### 2B.2C — Integração por agente

- [ ] Testar que evento Codex/Antigravity/Hermes atualiza somente a pílula e a sessão corretas e calcula +N/−M.
- [ ] Rodar testes do hook e `npm test`; fazer uma edição real por agente suportado.
- Checkpoint 2B.2C: diff de cada agente suportado aparece na sessão correta e a validação manual fica registrada.

Checkpoint 2B.2: 2B.2A–2B.2C concluídas; nenhuma alteração de arquivo pode vazar para outra sessão.

### 2B.3 — Perguntas com opções (P; condicional)

- [ ] Usar apenas agentes cuja Etapa 2B.0 provou uma ferramenta/formato de pergunta.
- [ ] Testar payload→card e resposta no formato que o agente espera, em `hooks.test.mjs` e `hook/src/reply.rs`.
- [ ] Confirmar que responder no terminal remove o card pendente da ilha.
- Se nenhum agente expuser a API, marcar N/A com a documentação e fixture consultadas.
- Checkpoint 2B.3: opções e resposta correspondem; pergunta nunca é respondida automaticamente.

### 2B.4 — Permitir/Negar no Hermes (M; condicional à 2B.0)

- [ ] Só prosseguir se o teste confirmar transporte de resposta do plugin.
- [ ] Testar espera máxima de 110 s: clique Permitir/Negar devolve decisão; sem clique/timeout devolve “perguntar no Hermes”.
- [ ] Atualizar `HERMES_PLUGIN` e `hook/src/reply.rs`; instalação antiga observadora deve pedir reinstalação antes de habilitar aprovação.
- [ ] Testar erro do relay e Hermes fechado: a ferramenta nunca fica travada nem recebe allow implícito.
- Se a API não suportar round-trip, marcar IMPOSSÍVEL com evidência e não criar aprovação visual enganosa.
- Checkpoint 2B.4: só clique explícito decide; timeout/erro sempre volta ao terminal como pergunta.

### 2B.5 — Uso do plano Antigravity (M; condicional à 2B.0)

- [ ] Só prosseguir com fonte local de quota confirmada; sem fonte, registrar IMPOSSÍVEL.
- [ ] Criar `windows/src-tauri/src/antigravity_plan.rs` no padrão de `codex_plan.rs`.
- [ ] Testar porcentagens, horário de reset, resposta vazia e fonte corrompida.
- [ ] Consultar no máximo uma vez por minuto, somente quando a pílula estiver visível ou for aberta; não fazer polling em pausa.
- [ ] Atualizar configuração “Plan usage” sem habilitar por padrão.
- Checkpoint 2B.5: valor mostrado reproduz a fonte local; ausência da fonte não vira 0%.

### 2B.6 — Nova sessão com escolha do agente (M; pré-requisito para Fase 2.3 e 2.7)

#### 2B.6A — Backend e transporte seguro

- [ ] Implementar `LaunchAgent { Claude, Codex, Antigravity, Hermes }` e passar o agente em `launch_session(folder, prompt, agent)`.
- [ ] Reutilizar o localizador de executáveis em `cli_relay.rs`; agente ausente retorna erro tipado sem abrir terminal inválido.
- [ ] Definir por agente o canal de prompt seguro descoberto na 2B.0.4; nunca concatenar prompt no shell.
- [ ] Adicionar testes para argumentos, diretório de trabalho, prompt com aspas, `;`, `&` e novas linhas; verificar que cancelamento/erro não inicia processo.
- Checkpoint 2B.6A: comandos construídos sem shell injection e prompt recebido intacto em fixtures para todo agente suportado.

#### 2B.6B — Ponte e seletor em Nova sessão

- [ ] Atualizar a ponte TypeScript/Tauri e o seletor de agente na Nova sessão.
- [ ] Listar somente agentes instalados ou declarados disponíveis; CLI ausente mostra erro localizado e opção de voltar.
- [ ] Lembrar a última escolha sem alterar configurações do agente; cancelar fecha o seletor e não inicia processo.
- [ ] Adicionar todas as frases novas em `windows/src/i18n/extra.json`, nas 13 línguas; preservar IDs de pílula e layout existente.
- Checkpoint 2B.6B: seleção, ausência de agente e cancelamento têm comportamento explícito; interface compilada nas 13 línguas.

#### 2B.6C — Integração e validação manual

- [ ] Exercitar Nova sessão com Claude, Codex, Antigravity e Hermes, sempre na pasta escolhida e com prompt de fixture.
- [ ] Confirmar que erro de agente ausente/falha de CLI é visível e não deixa processo ou terminal órfão.
- [ ] Rodar `npm test`, `npx tsc --noEmit` e `cargo test --lib`; executar um lançamento manual por agente suportado.
- Checkpoint 2B.6C: cada agente disponível abre na pasta e recebe prompt idêntico; registrar agente/versão/resultado.

Checkpoint 2B.6: 2B.6A, 2B.6B e 2B.6C concluídas; libera Fase 2.3 e 2.7.

### 2B.7A — herdr como ambiente (M)

#### 2B.7A.1 — Criar painel e iniciar agente

- [ ] Usar somente o comando comprovado na 2B.0.5 para criar painel na pasta e iniciar o agente selecionado na 2B.6.
- [ ] Adicionar testes de argumentos ao módulo `herdr.rs`; caminhos e prompt permanecem argumentos separados, inclusive com espaços e metacaracteres.
- Checkpoint 2B.7A.1: painel abre na pasta pedida e inicia apenas o agente escolhido.

#### 2B.7A.2 — Foco, drop e fallback

- [ ] Ligar foco a “Abrir terminal” e ao drop de arquivo; sessão desconhecida mantém fallback “copied”.
- [ ] Testar manualmente criação, foco, drop, herdr ausente e painel fechado.
- Checkpoint 2B.7A.2: foco chega ao painel correto; drop transmite caminhos como dados e falha usa fallback.

Checkpoint 2B.7A: 2B.7A.1 e 2B.7A.2 concluídas com evidência manual.

### 2B.7B — Orca como ambiente (M)

#### 2B.7B.1 — Executável e validação do handle

- [ ] Confirmar `orca status --json`, os IDs de agente e `ORCA_TERMINAL_HANDLE`; validar `term_` + UUID antes de usar.
- [ ] Criar `windows/src-tauri/src/orca.rs`; localizar `orca.exe` no PATH ou `%LOCALAPPDATA%\\Programs\\orca\\resources\\bin\\orca.exe`, nunca executar `orca.cmd`.
- [ ] Testar Orca ausente/fechado, JSON inválido, handle ausente/inválido e código de saída diferente de zero.
- Checkpoint 2B.7B.1: executável e handle são validados; erro não seleciona um terminal arbitrário.

#### 2B.7B.2 — Focar terminal

- [ ] Testar `orca.exe terminal switch --terminal <handle> --json` com handle válido e integrar ao comando “Abrir terminal”.
- [ ] Confirmar resultado com terminal em primeiro plano e handle errado; falha deve informar erro sem mudar sessão.
- Checkpoint 2B.7B.2: “Abrir terminal” foca o terminal associado à sessão correta.

#### 2B.7B.3 — Soltar arquivo

- [ ] Enviar caminhos por `orca.exe terminal send --terminal <handle> --text <caminhos>` sem `--enter`.
- [ ] Testar espaços, múltiplos arquivos e caracteres especiais; erro retorna ao fallback “copied”.
- Checkpoint 2B.7B.3: terminal recebe caminhos como texto, nunca os executa automaticamente.

#### 2B.7B.4 — Nova sessão e worktree

- [ ] Testar Nova sessão no terminal existente e em worktree nova com `orca.exe agent launch`/`orca.exe worktree create`.
- [ ] Passar prompt como argumento/canal seguro comprovado na 2B.0.4, sem shell intermediário; cobrir cancelamento e falha parcial.
- [ ] Não ler `%APPDATA%\\orca\\agent-hooks\\last-status.json`, que contém prompt e resposta do usuário.
- Checkpoint 2B.7B.4: sessão abre no destino pedido, prompt fica intacto e dados privados do arquivo de estado não são lidos.

#### 2B.7B.5 — Compatibilidade dos hooks e fechamento

- [ ] Confirmar que instalação, atualização e remoção mantêm hooks existentes do Orca em `.claude`, `.codex` e `.gemini`; cobrir merge/restauração em teste.
- [ ] Testar Hermes não suportado e cada comando Orca falhando; manter fallback seguro sem permitir aprovação implícita.
- Checkpoint 2B.7B.5: hooks de terceiros permanecem intactos e falhas não enviam arquivo/prompt a sessão errada.

Checkpoint 2B.7B: etapas 2B.7B.1–2B.7B.5 concluídas com testes e evidência manual.

### 2B.8 — Documentação, suíte e release (P)

#### 2B.8A — Estado e documentação

- [ ] Atualizar `windows/README.md` com matriz Supported agents e comportamento validado de Nova sessão, diff e Open terminal.
- [ ] Atualizar as tabelas “Estado conhecido” com resultado e referência da evidência; `?` só permanece com pergunta de pesquisa e responsável.
- [ ] Manter `IMPOSSÍVEL` apenas quando houver evidência reproduzível.
- Checkpoint 2B.8A: README, tabelas e evidências concordam para cada agente/capacidade.

#### 2B.8B — Suíte e gate de release

- [ ] Rodar `npm test`, `npx tsc --noEmit`, `npm run build`, `cargo test --lib` em `windows/src-tauri` e `cargo test` em `windows/hook`.
- [ ] Se e somente se o proprietário pedir release, aplicar o checklist “Release” no fim do documento; sem pedido, parar após registrar validação.
- Checkpoint 2B.8B: comandos passam e a release só é preparada/publicada quando houver solicitação explícita.

Checkpoint 2B.8: 2B.8A e 2B.8B concluídas; documentação bate com testes e execução manual.

Ordem: 2B.0.1–2B.0.7 → 2B.1–2B.5 (condicionais/independentes) → 2B.6A–2B.6C → 2B.7A.1–2B.7A.2 e 2B.7B.1–2B.7B.5 → 2B.8A–2B.8B.
