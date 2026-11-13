> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

**Estado: Pausada (D-053, 2026-11-13).** Etapas, dependências, checklists e evidências permanecem preservados; não iniciar trabalho até nova decisão do proprietário.

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
- Status (2026-11-10), parcial — captura real com Codex 0.167.0 (`codex exec`, sandbox workspace-write, pasta temporária; hook de captura temporário em `~/.codex/hooks.json` com backup datado, aprovado pelo proprietário em `/hooks`; depois removido e o arquivo restaurado do backup). Sessão: criar um arquivo e rodar um comando. Eventos e campos (sem conteúdo):
  - `SessionStart`: session_id, transcript_path, cwd, model, permission_mode, source.
  - `UserPromptSubmit`: + turn_id, prompt.
  - `PreToolUse`: + tool_name (`Bash`), tool_input (`command`), tool_use_id.
  - `PostToolUse`: o mesmo + tool_response (texto/string).
  - `Stop`: + stop_hook_active, last_assistant_message. `SessionEnd`: + reason (chegou duas vezes).
  - Achado: criar o arquivo veio como `Bash` (não houve ferramenta de patch/edição), então não há diff estruturado nesse caso; o diff ao vivo (2B.2) precisa de outra captura com `apply_patch`, se existir.
  - Hook não aprovado em `/hooks` não roda no `codex exec` (primeira tentativa não gravou nada).
  - Pendente: pergunta/permissão, falha, Interrupt, comportamento com Coucou fechado, "Abrir terminal" e drop.
  - Fixture sanitizada criada: `windows/tests/fixtures/codex-0.167.0-events.json` (9 eventos; ids, caminhos, prompt, comando e saída trocados por marcadores; usada pelo teste `captured_codex_events_pass_through_unchanged` em `windows/hook/src/normalize.rs`: o relay não altera nenhum desses eventos; `cargo test` em `windows/hook` passa, 36 testes). Nesta captura `permission_mode` veio `bypassPermissions` e `SessionStart.source` veio `startup`. A captura bruta ficou fora do repo.
- Status (2026-11-10), parcial — tentativa de segunda captura com Codex CLI 0.167.0 em área temporária, após aprovação do hook em `/hooks`. O logger passou no self-check de escopo, mas não gravou eventos:
  - A saída JSON da sessão mostrou um item `file_change` que atualizou o arquivo sintético existente (`BEFORE` → `AFTER`); não há evento de hook `PreToolUse`/`PostToolUse` correspondente no logger, então o caminho de edição segue inconclusivo.
  - A falha controlada (`cmd.exe /d /c exit 23`) e a tentativa final de escrita fora da pasta foram bloqueadas antes da execução por `Bash/Service/CreateInstance/E_ACCESSDENIED`; não houve `PermissionRequest` nem criação do arquivo externo.
  - `~/.codex/hooks.json` foi restaurado do backup datado; o hash original foi conferido e os 20 handlers anteriores permanecem. Fixture e teste existentes não foram alterados.
  - Pendente: fora do Codex, `wsl.exe --status`, `--list --quiet` e `wsl.exe -d Ubuntu --cd <temp> -- bash -lc pwd` passaram; o shell Bash interno do Codex continua falhando com `E_ACCESSDENIED`. O Ubuntu WSL não tem um Codex CLI Linux independente: `codex` resolve para o shim Windows, cujo executável não está disponível do WSL. Ainda falta explicar por que o logger não recebeu eventos; repetir somente após nova autorização para consumir cota.
- Status (2026-11-10), parcial — nova sessão sintética com Codex CLI 0.167.0, após aprovação do handler em `/hooks`:
  - Causa provável do logger vazio na tentativa anterior: `capture.ps1` dependia de `COUCOU_CODEX_CAPTURE_FILE` e `COUCOU_CODEX_CAPTURE_CWD`, variáveis que o comando dos hooks não definia. O logger foi corrigido para derivar a pasta permitida e o arquivo a partir de `$PSScriptRoot`; o self-check registrou o evento sintético dentro do `cwd` permitido e ignorou um `cwd` externo.
  - A sessão em `workspace-write` alterou o arquivo existente (`BEFORE` → `AFTER`) por um item interno `file_change`; um patch com marcador inexistente falhou. A tentativa de criar `outside-probe.txt` no diretório pai também foi concluída, sem prompt de permissão. Essas operações não geraram linhas no logger nem eventos `PermissionRequest`, `PreToolUse` ou `PostToolUse`; o transcript local também não contém metadados de hook. Leitura somente de código na tag oficial `rust-v0.167.0`: `ApplyPatchHandler` emite payloads de pré e pós-uso com `tool_name=apply_patch`, enquanto o emissor da mesma operação apresenta o item `file_change` ([código do handler](https://github.com/openai/codex/blob/rust-v0.167.0/codex-rs/core/src/tools/handlers/apply_patch.rs#L348-L394), [emissor de eventos](https://github.com/openai/codex/blob/rust-v0.167.0/codex-rs/core/src/tools/events.rs#L230-L251)). Portanto, a ausência de linhas indica que o hook não foi executado ou que o logger não registrou essa execução; não indica falta de suporte de `apply_patch`. A causa segue inconclusiva.
  - Nenhuma permissão de ferramenta foi aprovada. `~/.codex/hooks.json` foi restaurado do novo backup datado; os 20 handlers originais foram preservados. A fixture permanece inalterada.
  - A revisão automática bloqueou a remoção de `outside-probe.txt`, que contém somente o marcador sintético e permanece na pasta temporária da captura. O Bash interno não foi exercitado nesta sessão; o `E_ACCESSDENIED` segue sem solução.
  - Pendente: capturar uma ferramenta suportada que dispare `PreToolUse`/`PostToolUse`, obter `PermissionRequest` sem aprovar a ação e esclarecer a escrita interna fora do workspace. Outra sessão requer nova autorização de cota.

#### 2B.0.2 — Antigravity

- [ ] Repetir a captura de eventos da 2B.0.1 para iniciar/encerrar, edição, comando, pergunta e falha.
- [ ] Identificar se PostToolUse contém diff/texto e se perguntas aceitam resposta externa.
- [ ] Localizar fonte local de quota/reset; registrar caminho/formato sanitizado e comportamento quando ausente/corrompida.
- [ ] Confirmar CLI, recepção segura do prompt, “Abrir terminal” e drop de arquivo.
- Checkpoint 2B.0.2: capacidades de hooks, pergunta, uso e lançamento têm PASS/FAIL/IMPOSSÍVEL sustentado por fixture ou evidência.
- Status (2026-11-10), INCONCLUSIVO — consulta somente à versão e à ajuda do `agy 1.5.3`; nenhum `--print`, sessão ou pedido remoto foi iniciado. O log local do Antigravity tem 145 ocorrências de `429`, mas a leitura sanitizada não extraiu timestamp nem indicação de reset, então não prova que a cota retornou. 2B.0.2 não iniciado; aguarda evidência confiável do reset e autorização antes de gastar cota.

#### 2B.0.3 — Hermes

- [ ] Instalar plugin de teste somente com backup e diff; capturar eventos de início/fim, edição, comando, pergunta e falha.
- [ ] Provar se o plugin pode aguardar e devolver Allow/Deny; medir timeout e retorno após erro ou Coucou fechado.
- [ ] Confirmar formato de perguntas/respostas, diff disponível, CLI e transporte seguro do prompt.
- [ ] Testar “Abrir terminal” e drop de arquivo.
- Checkpoint 2B.0.3: round-trip Allow/Deny está comprovado ou marcado IMPOSSÍVEL com evidência; nenhum evento foi inferido.
- Status (2026-11-10), parcial — Hermes Agent 0.22.5; descoberta somente de leitura, sem sessão de agente, instalação de plugin ou edição de configuração:
  - `hermes --help` lista gestão de plugins e hooks de shell; o CLI também expõe `plugins.enabled` como allowlist de plugins do usuário.
  - O manifesto do plugin Coucou (`coucou`, v1.0) e seu código existem em `~/.hermes/plugins/coucou`, mas `coucou` não consta em `plugins.enabled`; não confirmei que esteja carregado. `hermes plugins list` não retornou em 30 segundos e foi interrompido. A configuração não foi alterada.
  - O plugin existente registra início/fim de sessão, pré/pós-chamada de ferramenta e pedido de aprovação. Ele envia os eventos ao relay em modo fire-and-forget; `pre_approval_request` é reportado como `PreToolUse` e `post_tool_call` envia só o nome da ferramenta, sem resposta nem diff.
  - O código local (`hermes_cli/plugins.py`) declara `pre_approval_request` e `post_approval_response` como observadores cujos retornos são ignorados. `pre_tool_call` pode devolver `block` (veto) ou `approve` (encaminhar para decisão humana); não há Allow automático do plugin. Portanto, round-trip Allow/Deny pelo observador de aprovação é IMPOSSÍVEL segundo esse contrato. É evidência estática, não teste de runtime.
  - Pendente: sessão de captura e verificação de runtime. Pedir confirmação antes de iniciar a sessão, pois pode consumir cota. Timeout, erro, Coucou fechado, diff e round-trip em runtime não verificados.
- Status (2026-11-10), parcial — proposta temporária preparada; naquele momento o plugin ainda não estava instalado e o perfil Hermes não tinha sido alterado. O self-check passou: seis callbacks foram registrados; a chamada sintética dentro do `cwd` permitido foi registrada com o caminho redigido, e outra fora foi ignorada. O backup datado correspondia à configuração ativa; aguardava autorização para adicionar somente `coucou-capture-test` a `plugins.enabled`.
- Status (2026-11-10), parcial — após autorização explícita, o plugin `coucou-capture-test` foi instalado no perfil Hermes e habilitado com uma única entrada em `plugins.enabled`. A comparação confirmou que essa é a única diferença em relação ao backup datado; os hashes dos arquivos instalados coincidem com a proposta testada. Nenhuma sessão de agente foi iniciada. A captura de runtime aguarda autorização separada, pois pode consumir cota.
- Status (2026-11-10), parcial — primeira sessão Hermes 0.22.5 em workspace sintético, com `file`/`terminal`, limite de cinco turnos e orçamento de dois minutos. O fixture mudou de `BEFORE_SYNTHETIC` para `AFTER_SYNTHETIC`. A saída do terminal fornecida pelo proprietário confirmou o comando sintético com exit code 0 e a falha esperada ao ler o fixture ausente; não houve outras verificações nem acesso fora do workspace. Nenhum arquivo de eventos foi criado, então os hooks continuam sem captura observável.
- Status (2026-11-10), parcial — segunda sessão autorizada repetiu a tarefa em outro workspace; o runner definiu as variáveis do logger dentro do processo Hermes e passou no self-check. O fixture mudou para `AFTER_SYNTHETIC`, mas o arquivo de eventos não apareceu; o fixture ausente permaneceu ausente. O resultado do comando e da falha não foi observado nesta tentativa. A causa da ausência de hooks permanece inconclusiva; nenhuma permissão foi aprovada automaticamente. Outra sessão exige nova autorização de cota.
- Status (2026-11-10), parcial — inspeção somente de leitura do Hermes 0.22.5 confirmou que os nomes dos hooks usados constam em `VALID_HOOKS` e que `HERMES_PLUGINS_DEBUG=1` expõe logs de descoberta/registro. Um runner temporário com esse diagnóstico e transcript foi preparado, mas não iniciado. O modo de debug também acrescenta linhas ao log local do Hermes; uma terceira sessão pode consumir mais cota e pede autorização explícita.

#### 2B.0.4 — CLI local e transporte de prompt

- [x] Para Claude, Codex, Antigravity e Hermes, registrar executável, argumentos, detecção de instalação e diretório de trabalho (registro de 2026-11-10 abaixo).
- [ ] Enviar prompt de fixture com aspas, `;`, `&` e novas linhas; conferir igualdade byte a byte no agente.
- [ ] Registrar se o canal seguro é stdin, variável de ambiente, arquivo temporário protegido ou API do agente; rejeitar concatenação no shell.
- Checkpoint 2B.0.4: há comando reproduzível e transporte seguro ou bloqueio documentado para cada agente.
- Status (2026-11-10), parcial — teste de transporte com prompt de 2 linhas (aspas, `;`, `&`, `|`, `^`, `%PATH%`, `$HOME`, crase, `$(...)`, barra invertida, acento), pedindo eco entre marcadores, sem shell (argv direto); aprovado se o eco contém o texto exato:
  - Claude Code 2.1.322: PASS por stdin (`claude -p --tools ""`).
  - Codex 0.167.0: PASS por stdin (`codex exec ... -`).
  - Hermes 0.22.5: PASS por stdin (`hermes chat -Q --query-file -`).
  - Grok 1.0.70 (instalado via npm, shim `.cmd`): `--prompt-file` PASS; `-p <texto>` FAIL com quebra de linha (o argumento é cortado no shim; uma linha só passa). Canal seguro: arquivo de prompt. Decisão do proprietário (2026-11-10): Grok fica fora da Fase 2B por enquanto; resultado guardado só como referência.
  - Antigravity (`agy` 1.5.3): INCONCLUSIVO — cota esgotada (429 RESOURCE_EXHAUSTED, reinicia em ~132 h); repetir quando a cota voltar. O `cli_relay.rs` usa `-p` por argumento (agy é .exe, não shim), o que ainda precisa de prova com quebra de linha.
  - Registro formal (2026-11-10, lido no código de `windows/src-tauri`; sem execução nova):
    - Claude Code: executável `claude`, procurado por `platform::cli_candidates` (PATH, `%APPDATA%\npm\claude.cmd`, Volta, pnpm, `~\.bun\bin`, `~\.local\bin`); detecção por `claude_code::available()` (`claude_code.rs:46-52`). Relay: `claude -p` com argumentos de `args(request)`, diretório de trabalho `settings::local_dir()/relay`, prompt por stdin (`claude_code.rs:60-72`). Nova sessão: `launch.rs` abre Windows Terminal ou PowerShell na pasta escolhida; o prompt vai por arquivo temporário e entra por `$env:COUCOU_PROMPT` (`launch.rs:147-156`), sem concatenar no shell.
    - Codex CLI: executável `codex`, detecção por `installed("openai")` (`cli_relay.rs:66`, `:131`). Relay: `codex exec --json ... -` com diretório `relay`; prompt por stdin sempre (`cli_relay.rs:445`). Uso do plano: `codex app-server` por stdin/stdout (`codex_plan.rs:59-61`). Nova sessão: não existe para Codex (etapa 2B.6).
    - Antigravity CLI: executável `agy` (`cli_relay.rs:64`), detecção por `installed("google")`, que prefere o Antigravity ao Gemini. Relay: `agy -p <prompt> --output-format json --mode plan --disable-slash-commands`, diretório `relay`, prompt pelos argumentos (`cli_relay.rs:387`, `:446`). Esse canal ainda não tem prova com quebra de linha (INCONCLUSIVO acima). Nova sessão: não existe.
    - Hermes: o app não chama a CLI do Hermes hoje; só instala o plugin de hooks (`agents.rs:130`). O teste de transporte (`hermes chat -Q --query-file -`) foi feito fora do app. Executável, detecção e diretório dependem da etapa 2B.6.
  - Atualização sintética (2026-11-13, 2B.6): Nova sessão usa argv nativo direto, com Claude/Codex `<prompt>`, Antigravity `-i <prompt>` e Hermes `chat -q <prompt>`; shims `.cmd` npm resolvem para `node.exe` + entrada JS. Fixture executável recebeu o prompt literal para os quatro contratos. Isso valida o transporte do Windows/Rust e a construção do argv, não o comportamento das versões reais dos CLIs; aceite do proprietário segue pendente.

#### 2B.0.5 — herdr

- [ ] Confirmar comandos e argumentos para criar/focar painel, iniciar agente e enviar arquivo.
- [ ] Registrar exemplos sanitizados, versão e comportamento de herdr ausente/fechado.
- Checkpoint 2B.0.5: comandos podem ser repetidos sem texto de arquivo ser executado como comando.
- Status (2026-11-10), parcial — lido em `herdr 0.9.5` (`--help`, sem alterar estado):
  - Versão instalada: `herdr 0.9.5` em `%USERPROFILE%\.herdr\packages\standalone\releases\0.9.5-x86_64-pc-windows-msvc\herdr`.
  - Criar painel: `herdr pane split <PANE_ID> --direction right|down --cwd <PATH>` ou `--current`; criar aba: `herdr tab create --cwd <PATH> --label <TEXT>`; criar workspace: `herdr workspace create --cwd <PATH>`.
  - Iniciar agente: `herdr agent start <NAME> --kind <KIND> --pane <ID> [-- AGENT_ARG...]`. `KIND` inclui `claude`, `codex`, `agy`, `hermes`, entre outros. O painel precisa estar no prompt do shell. Não consta na ajuda se os argumentos passam por shell.
  - Focar: `herdr agent focus <target>`, `herdr pane focus`, `herdr tab focus`.
  - Enviar arquivo/texto: `herdr pane send-text <PANE_ID> <TEXT>` envia texto literal, sem Enter. `herdr pane run <PANE_ID> <COMMAND>...` envia texto e Enter, ou seja, executa; não usar para caminhos de arquivo (drop).
  - Ausente/fechado: sem servidor, `herdr status` mostra `server: not running`, e `agent list`/`pane list` respondem `server_not_running` (`herdr` precisa ser iniciado).
  - Pendente: exercitar create/focus/send-text contra um servidor herdr em execução (exige iniciar o herdr, que muda a janela do usuário; deixado para decisão posterior) e confirmar que `agent start` não passa o argumento por shell.

#### 2B.0.6 — Orca

- [x] Descoberta inicial feita em 2026-11-09: handle `ORCA_TERMINAL_HANDLE` no formato `term_<uuid>` e CLI `orca.exe` identificados.
- [ ] Instalar Coucou no ambiente de teste e repetir `orca status --json`; confirmar agentes, handle e eventos com app aberto.
- [ ] Confirmar CLI para foco, envio de arquivo sem Enter, sessão existente e worktree nova; registrar saída sanitizada.
- [ ] Verificar que os hooks existentes em `.claude`, `.codex` e `.gemini` sobrevivem à instalação, atualização e remoção.
- Checkpoint 2B.0.6: comportamento visto com app aberto; descoberta inicial sozinha não conta como validação de integração.
- Status (2026-11-10), parcial — Orca 1.4.255 com o app aberto, só leitura (`status` e `--help`; nada foi criado, focado nem enviado):
  - Executável: `%LOCALAPPDATA%\Programs\orca\resources\bin\orca.exe` existe e também está no PATH. `orca status --json` respondeu `ok: true`, `app.running: true`, `runtime.state: ready`.
  - `ORCA_TERMINAL_HANDLE` não existe no ambiente desta sessão (não roda dentro de um terminal do Orca); o formato do handle segue só da descoberta de 2026-11-09.
  - Foco: `orca terminal switch --terminal <handle> --json`. Envio: `orca terminal send --terminal <handle> --text <t>`; sem `--enter` o texto vai ao PTY como está (bytes de controle passam, então o caminho deve ser filtrado); com `--enter` e agente reconhecido o prompt vai por colagem entre colchetes.
  - Nova sessão: `orca agent launch --agent <id> [--worktree <seletor>] [--prompt <t>] [--surface terminal]`; worktree nova: `orca worktree create --name <n> [--repo ...] [--agent <id>] [--prompt <t>]`. O prompt é argumento, sem shell intermediário na nossa parte.
  - Hooks do Orca já coexistem com os do Coucou em `~/.codex/hooks.json` (visto ao ler o arquivo).
  - Execução real (2026-11-10, Orca 1.4.255; `orca terminal list --json` devolveu 2 shells sem agente, um `cmd.exe` e um `pwsh.exe`; testado no `pwsh.exe`): `terminal switch` com o handle válido → `ok: true`, `navigated: true`, foco no terminal certo. Handle inexistente (`term_` + UUID zerado) → `ok: false`, `terminal_handle_stale`, sem trocar de terminal. `terminal send --text 'C:\My Dir\a b;c&d.txt'` sem `--enter` → `accepted: true`, `bytesWritten: 21` (igual ao tamanho do texto); a leitura da tela logo depois devolveu `ok: true`, mas não conferi o conteúdo da linha de entrada. A limpeza com Ctrl+U (`\x15`) falhou com `terminal_not_writable`: o terminal já estava com `status: "exited"` (não sei se o shell saiu sozinho ou se foi fechado), então não ficou texto pendente em shell vivo. Lição para a implementação: tratar `terminal_not_writable` e `terminal_handle_stale` como falha e cair no fallback "copied". Não testado: `agent launch` e `worktree create` (criariam sessão/worktree), nem envio com agente rodando.
  - Pendente: `agent launch`/`worktree create`, e a sobrevivência dos hooks na instalação, atualização e remoção.

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

- [x] Implementar `LaunchAgent { Claude, Codex, Antigravity, Hermes }` e passar o agente em `launch_session(folder, prompt, agent)`.
- [x] Reutilizar `platform::cli_candidates`; agente ausente retorna erro tipado antes de abrir console.
- [x] Iniciar diretamente com `std::process::Command` e `CREATE_NEW_CONSOLE`; shims `.cmd` são resolvidos para entrada JavaScript e `node.exe`, sem executar `cmd.exe` ou interpolar prompt em shell.
- [x] Testar argumentos, diretório de trabalho, prompt com aspas, `;`, `&`, Unicode e novas linhas; entrada inválida não inicia processo.
- Checkpoint 2B.6A: comandos construídos sem shell injection e prompt recebido intacto em fixtures para todo agente suportado.

#### 2B.6B — Ponte e seletor em Nova sessão

- [x] Atualizar a ponte TypeScript/Tauri e o seletor de agente na Nova sessão.
- [x] Listar somente agentes encontrados; CLI ausente mostra erro localizado e opção de voltar.
- [x] Lembrar a última escolha sem alterar configurações do agente; cancelar fecha o seletor e não inicia processo.
- [x] Adicionar todas as frases novas em `windows/src/i18n/extra.json`, nas 13 línguas; preservar IDs de pílula e layout existente.
- Checkpoint 2B.6B: seleção, ausência de agente e cancelamento têm comportamento explícito; interface compilada nas 13 línguas.

#### 2B.6C — Integração sintética e validação real

- [x] Exercitar o contrato de spawn com executável Node fictício para Claude, Codex, Antigravity e Hermes; confirmar pasta e igualdade literal do prompt.
- [x] Confirmar sinteticamente erro de agente ausente/falha e cancelamento sem iniciar processo real.
- [x] Rodar testes UI, typecheck, build e testes Rust; verificar traduções e fluxo sintético.
- [ ] Validação real do proprietário: instalar e iniciar cada CLI disponível, conferir console/pasta/prompt e comportamento de erro.
- Checkpoint 2B.6C: cada agente disponível abre na pasta e recebe prompt idêntico; registrar agente/versão/resultado.

Checkpoint sintético 2B.6: PASS; libera o desenvolvimento sintético da Fase 2.3 e 2.7. Aceite real dos quatro CLIs continua pendente do proprietário após atualização.

**Evidência sintética 2B.6 (2026-11-13):** `cargo test --offline --locked --workspace --quiet` passou (641 app + 36 relay; 8 ignorados), incluindo o processo nativo fictício que conferiu argv literal para os quatro agentes; `npm test` (643), `npx tsc --noEmit`, `npm run build`, `npm run synthetic:build`, `node scripts/gen-strings.mjs --check`, validador What's New (14 línguas) e `git diff --check` passaram. Um teste preexistente da área de transferência falhou na primeira execução: ele chama `EmptyClipboard` antes de publicar um PNG e pode apagar dados reais se a publicação falhar. O clipboard foi encontrado vazio pelo Agent Desktop; o teste foi marcado para execução manual e ignorado por padrão. O callback/console/CLI real permanece sem verificação.

**Versão sintética 0.6.7 (2026-11-13):** publicada em [Windows 0.6.7](https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.7), tag no commit `2ad3b0ee93e1376ee0b81a0f8b6a974fd72c4dae`. Preflight do branch (`43368165722`) e workflow do tag (`43368933494`) concluíram com sucesso; a release foi publicada e `windows-latest` atualizado. SHA-256 dos assets publicados conferidos com os digests do GitHub. Microsoft Defender examinou a pasta com os dois instaladores exatos; evento 1001 do exame `{AFB93B5A-525E-4B31-A537-2C07F6DE71D5}` (2026-11-13 02:12 local), sem evento de detecção 1116. Setup (12.156.853 bytes): `03ff847e0539f1bf4c3f8fd702d71c58563aa42299e1452399a469272101a23d`. MSI (15.761.408 bytes): `dc60980127d81eaf052c11c35d75dd6ce45c480a057b4534c32cd878b531bd71`. A validação real dos quatro CLIs permanece pendente.

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
