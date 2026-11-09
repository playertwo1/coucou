# Roadmap do fork (playertwo1/coucou) — Windows

Ponto de partida: `main` com a 0.6 do upstream (merge #1075). Muito do que era "só Mac"
**já existe no Windows** nessa versão: ditado Flow (segurar tecla + Parakeet), Notetaker
(WASAPI loopback), « OK Coucou », Spotify, uso do plano Claude/Codex, "Abrir terminal",
Outlook clássico, resumo semanal, sons próprios. Esses itens só precisam ser **testados**.

Esforço: P = dias · M = 1–2 semanas · G = mais que isso.

## Fase 0 — Validar o que já veio na 0.6
- [ ] Ditado Flow: baixar o Parakeet, segurar a tecla, colar em VS Code, navegador, Windows Terminal
- [ ] Notetaker: gravar uma chamada (Meet/Teams/Discord) e conferir transcrição + resumo
- [ ] « OK Coucou » com a chave da Anthropic
- [ ] Hook do Claude Code: aprovar/negar pela ilha, "Abrir terminal" no Windows Terminal
- [ ] Spotify, uso do plano, resumo semanal
- [ ] Reiniciar o Windows e ver se abre sozinho (autostart)

## Fase 1 — Trazer o que ainda falta do Mac
| Item | Onde está no Mac | Esforço |
|---|---|---|
| Coucoudoro (pomodoro do Mochi) | `NotchBuddy/Sources/App/CoucoudoroController.swift` — no Windows só existem as strings | M |
| Ilha num canto da tela (em vez do topo central) | Settings → Display → Position | M |
| Arrastar o Mochi sobre uma janela para anexá-la como contexto do chat | "drag onto any window" | M |
| Botão de ditado no chat e na "Nova sessão" (o Flow já existe, falta o botão) | mic do chat | P |
| Atalho global para "Nova sessão do Claude Code" — **feito** (Ctrl+Alt+L, `newSession`) | Shortcuts | P |
| Enviar arquivo solto na ilha por e-mail via Outlook clássico (`mail/` já fala com Outlook) | Mail.app | M |
| Portfólio de cripto (carteiras + exchanges, só leitura) | Portfolio pill | G |
| Cal.com em calendário em vez de lista | Cal.com card | P |

Fora: Apple Music (não existe no Windows).

**Escolhidos para começar (decisão do dono):**
- [x] Coucoudoro (item 1 da tabela) — código e testes prontos, falta ver no app
- [x] Botão de ditado no chat e na "Nova sessão" (item 6) — `views/dictate.ts`, falta ver no app
- [x] Ilha num canto da tela (item 8) — Settings → Display → Position, 4 cantos; falta ver no app
- [ ] Assinatura e atualização próprias do fork (item 9): decidir entre certificado pago (remove o aviso do SmartScreen) ou manter a verificação por SHA-256 e o atualizador do `playertwo1/coucou`
- [x] Trocar Spotify por **YouTube Music** (pílula `integration_youtubemusic`, só Windows, falta ver no app) (integração nova, no lugar do Spotify, que fica fora). Reaproveitar a leitura de sessão de mídia do Windows; muda a detecção do app e o comando de abrir.

Nota: o Spotify da Fase 0 continua sendo testado, porque é o que existe hoje.

**Ideias novas aprovadas (Fase 1B):**
- [x] Notetaker em modo "anotar ideia": atalho global grava a sua voz sem chamada, transcreve com o Parakeet e salva a nota com data e hora (P) — feito: Ctrl+Alt+I
- [x] Modo reunião da ilha: o Mochi mostra que está gravando e as notificações menores se calam enquanto o Notetaker grava (P) — feito (Mochi "pensando", só aprovações e perguntas fazem som)
- [ ] Histórico pesquisável de transcrições, por palavra ou por pessoa (M)
- [x] Coucoudoro ligado às sessões do Claude Code: tempo de foco por projeto e total do dia (M, depende do Coucoudoro) — feito: total do dia e por projeto no cartão
- [x] Ditar uma linha ao fim de cada ciclo do Coucoudoro e guardá-la no histórico do dia (P, depende do Coucoudoro) — feito
- [x] Playlist de foco no Coucoudoro com YouTube Music: abre ou pausa a música junto com o ciclo (P, depende do YouTube Music) — feito (só com a pílula do YouTube Music ligada)

## Fase 2 — Ideias novas (força do Windows)
1. **Notificações nativas do Windows com Permitir/Negar** — quando a ilha está escondida ou há app em tela cheia; o clique continua explícito. (M)
2. **Modo jogo / tela cheia** — o Mochi some quando um jogo ou vídeo está em tela cheia e só reaparece para pedidos de permissão. (P)
3. **Custo e tokens por sessão** — ler os `.jsonl` locais do Claude Code (`~/.claude/projects`) e mostrar gasto do dia/semana por projeto, sem rede. (M)
4. **Pílula do Git** — branch, mudanças não commitadas e ahead/behind do projeto da sessão ativa; clique abre o diff. (P)
5. **Focar a aba exata do Windows Terminal** — hoje vai para a janela; ir para a aba/painel da sessão. (M)
6. **Histórico e busca de sessões** — linha do tempo das sessões passadas com o que cada uma fez, buscável. (M)
7. **Lançador rápido** — atalho global → digita (ou dita) o pedido → escolhe projeto → abre o Claude Code. Junta itens da Fase 1. (P)
8. **Vigia de testes/builds** — o Mochi reage quando `npm test`, `cargo build` ou o CI terminam (verde/vermelho). (M)
9. **Sugestões de regras de permissão** — "você aprovou `npm test` 12 vezes: quer adicionar em `settings.json`?" (mostra o diff, grava só com confirmação). (M)
10. **Vários monitores** — escolher o monitor da ilha ou seguir o mouse, como no Mac. (P, verificar se já existe)

## Fase 2B — Paridade com o Claude Code (Codex, Antigravity, Hermes, Orca, herdr)

> **Para a IA que for executar:** leia esta seção inteira antes de começar. Execute uma etapa por vez,
> na ordem; cada subetapa termina com uma verificação e um commit. Use superpowers:executing-plans
> (ou subagent-driven-development) e TDD. Antes de cada etapa: `git fetch upstream && git merge upstream/main`.
> Ao terminar uma etapa, marque os `- [ ]` dela aqui e atualize as tabelas "Hoje".

**Objetivo:** tudo o que o Coucou faz com o Claude Code no Windows/Linux funciona também com Codex,
Antigravity e Hermes Agent, e com sessões que rodam dentro do Orca e do herdr.

**Ideia central:** Codex, Antigravity e Hermes são *agentes* (mandam eventos pelo `coucou-hook`).
Orca e herdr são *lugares* onde um agente roda (painel, terminal, worktree): para eles a paridade é
abrir, focar e colar dentro deles. O herdr já tem `herdr.rs`; o Orca segue o mesmo molde.

**Onde está cada função hoje (tudo em `windows/`):**
| Função | Arquivos |
|---|---|
| Relay e tradução de eventos de cada agente | `hook/src/main.rs`, `hook/src/normalize.rs`, `hook/src/reply.rs` |
| Instalação dos hooks/plugins de cada agente | `src-tauri/src/agents.rs` (`enum Agent`, `HERMES_PLUGIN`) |
| Sessões, passos, permissões, perguntas | `src/island/hooks.ts` (`askedQuestions`, `recordDiff`, `handleHook`) |
| Diff ao vivo | `src/core/diff.ts` (`buildFileDiff`: só `Edit`, `MultiEdit`, `Write`) |
| Nova sessão | `src-tauri/src/launch.rs` (`launch_session`, `shell_command`, `powershell_script` — sempre `claude`), `src/views/launch.ts` |
| Soltar arquivo numa sessão | `src-tauri/src/launch.rs` (`drop_into_session`), `src/views/session-drop.ts` |
| Abrir terminal / foco no herdr | `src-tauri/src/session_window.rs`, `src-tauri/src/herdr.rs` (`focus`) |
| Achar o executável de cada CLI | `src-tauri/src/cli_relay.rs` (`Cli::Codex` → `codex`, `Cli::Antigravity` → `agy`) |
| Uso do plano | `src-tauri/src/codex_plan.rs`, `src/core/plan.ts` |
| Testes | `tests/*.test.mjs` (`npm test`), `cargo test` em `src-tauri/` e em `hook/` |

**Hoje — agentes:**
| Função | Claude Code | Codex | Antigravity | Hermes |
|---|---|---|---|---|
| Sessões ao vivo, passos, resumo semanal | ✅ | ✅ | ✅ | ✅ |
| Permitir / Negar na ilha | ✅ | ✅ | ✅ (com "Approve commands from the notch") | ❌ só observa (`HERMES_PLUGIN`) |
| Perguntas com opções | ✅ (`AskUserQuestion`) | ? | ? | ? |
| Diff ao vivo (+N −M) | ✅ | ❌ | ❌ | ❌ |
| Nova sessão | ✅ | ❌ | ❌ | ❌ |
| Soltar arquivo na sessão | ✅ | ? (código é genérico) | ? | ? |
| Abrir terminal | ✅ | ? (código é genérico) | ? | ? |
| Uso do plano | ✅ | ✅ | ❌ | não se aplica (usa chaves de API) |
| Chat pela assinatura | ✅ | ✅ | ✅ | não se aplica |

**Hoje — lugares:**
| Função | herdr | Orca |
|---|---|---|
| Abrir terminal foca o painel/terminal da sessão | ✅ (`herdr agent focus`) | ❌ |
| Soltar arquivo cola no painel certo | ✅ (foca antes de colar) | ❌ |
| Nova sessão abre lá dentro, com o agente escolhido | ❌ | ❌ |

`?` = ninguém testou; a Etapa 0 responde.

**Regras que valem para todas as etapas (do `CLAUDE.md`):**
- Nunca bloquear o agente: se o Coucou não responder, o relay sai na hora (300 ms).
- Nunca aprovar nada sem clique explícito; sem clique, o agente pergunta no próprio terminal.
- Nunca sobrescrever config de agente: backup datado, merge, mostrar o diff, gravar só após confirmar.
- IDs de pílula (`agent_codex`, `agent_antigravity`, `agent_hermes`…) não mudam.
- Não mudar o visual do que já existe; o que for novo segue o estilo atual.
- Toda frase nova da interface vai em `src/i18n/extra.json` em todas as línguas.
- O prompt do usuário nunca entra numa linha de comando (hoje vai por `COUCOU_PROMPT` ou arquivo temporário): manter isso para todo agente.

**Casos que costumam quebrar (cada etapa tem que cobrir os seus):**
1. O CLI do agente não está instalado ou não está no PATH → a Nova sessão avisa, não abre terminal quebrado.
2. Prompt com aspas, `;`, `&`, quebras de linha → chega igual ao agente, sem virar comando.
3. Patch do Codex com vários arquivos, arquivo criado, apagado ou renomeado → um diff por arquivo, contagens certas.
4. Sessão sem janela encontrada → arquivo solto vai para a área de transferência ("copied"), como hoje.
5. Coucou fechado → todos os agentes continuam funcionando e perguntando no próprio terminal.

### Etapa 0 — Descobrir o que cada agente expõe (P) — sem código de produto
Resultado: as `?` das tabelas acima viram ✅, ❌ ou "impossível", e as perguntas abaixo ficam respondidas aqui.
- [ ] 0.1 Instalar os hooks de Codex, Antigravity e Hermes (Settings → Agents) e rodar em cada um: editar um arquivo, criar um, rodar um comando, fazer o agente perguntar algo. Copiar do `%LOCALAPPDATA%\Coucou\coucou.log` um payload de cada evento para `windows/tests/fixtures/agents/<agente>-<evento>.json` (tirar caminhos pessoais).
- [ ] 0.2 Anotar para cada agente: nome da ferramenta de edição e campos dela (ex.: Codex `apply_patch` com o patch em texto); se existe ferramenta de pergunta com opções e se o hook a vê; se o PostToolUse traz o conteúdo editado.
- [ ] 0.3 Hermes: ler a documentação de plugins e responder se um hook pode **esperar** e **devolver** uma decisão (allow/deny). Se não puder, marcar Permitir/Negar do Hermes como "impossível" e pular a Etapa 4.
- [ ] 0.4 Antigravity: existe fonte local de cota/limites (como o `codex app-server` → `account/rateLimits/read`)? Se não, marcar Uso do plano como "impossível" e pular a Etapa 5.
- [ ] 0.5 Comandos para iniciar com prompt: `codex "<prompt>"`, `agy …`, `hermes …` — anotar a forma exata e se aceitam o prompt por argumento, stdin ou variável.
- [ ] 0.6 herdr (0.9.5 instalado): comando para criar um painel novo numa pasta rodando um comando.
- [x] 0.6 Orca — levantado em 2026-11-09 no notebook (ver "Orca: o que já sabemos" abaixo). Falta só testar com o Coucou instalado.
- [ ] 0.7 Testar à mão, com cada agente, "Abrir terminal" e soltar um arquivo numa sessão. Anotar o que funciona.
- [ ] 0.8 Commit: `docs: roadmap Fase 2B — resultados da Etapa 0` (fixtures + tabelas atualizadas).

### Etapa 1 — Soltar arquivo e Abrir terminal para todos os agentes (P)
Só se a 0.7 achou falhas; o código já é por `session_id`, não por agente.
- [ ] 1.1 Para cada falha da 0.7: escrever o teste que reproduz (Rust em `launch.rs`/`session_window.rs` ou `tests/launch.test.mjs`), ver falhar.
- [ ] 1.2 Corrigir na parte comum (`session_window.rs` ou `drop_into_session`), nunca com um `if agente`, salvo quando o agente realmente difere.
- [ ] 1.3 `npm test` e `cargo test` passam; teste à mão com o agente. Commit.

### Etapa 2 — Diff ao vivo para Codex, Antigravity e Hermes (M)
- [ ] 2.1 No relay (`hook/src/main.rs`), confirmar que o corte de 256 KB/512 KB e o encaminhamento do texto no PostToolUse valem para todo agente, não só Claude Code. Teste em `hook/` com as fixtures da 0.1.
- [ ] 2.2 Em `tests/diff.test.mjs`: um teste por ferramenta de edição achada na 0.2, usando as fixtures. Codex `apply_patch`: patch com 2 arquivos → 2 diffs; arquivo novo → só `+N`; arquivo apagado → só `−M`; renomeado → caminho novo. Ver falhar.
- [ ] 2.3 Em `src/core/diff.ts`: `buildFileDiff` passa a devolver **lista** de diffs (`FileDiff[]`), porque um patch do Codex mexe em vários arquivos; novos `case` para as ferramentas da 0.2. Ajustar `recordDiff` em `src/island/hooks.ts` para gravar cada um.
- [ ] 2.4 `tests/livediff.test.mjs`: um evento PostToolUse do Codex vira passos `+N −M` na pílula `agent_codex`. `npm test` passa. Commit.

### Etapa 3 — Perguntas com opções (P, só para agentes onde a 0.2 achou uma ferramenta de pergunta)
- [ ] 3.1 Teste em `tests/hooks.test.mjs`: o payload da pergunta do agente vira o card de opções.
- [ ] 3.2 Em `askedQuestions` (`src/island/hooks.ts`), aceitar o nome e o formato da ferramenta do agente; em `hook/src/reply.rs`, devolver a resposta no formato que o agente espera (teste em `hook/`).
- [ ] 3.3 Teste: pergunta respondida no terminal some da ilha (mesmo caminho do `AskUserQuestion`). Commit.

### Etapa 4 — Permitir / Negar no Hermes (M, só se a 0.3 disse que dá)
- [ ] 4.1 Teste em `src-tauri/src/agents.rs`: o `HERMES_PLUGIN` gerado espera a resposta do relay e devolve a decisão; sem resposta em até 110 s, devolve "perguntar no Hermes".
- [ ] 4.2 Mudar `HERMES_PLUGIN` e o tratamento do Hermes em `hook/src/reply.rs`. Sem clique = nenhuma decisão.
- [ ] 4.3 Hooks antigos (só observadores) aparecem em Settings como "instalar de novo", como o Antigravity faz com o timeout de 10 s. Commit.

### Etapa 5 — Uso do plano do Antigravity (M, só se a 0.4 achou fonte local)
- [ ] 5.1 Criar `src-tauri/src/antigravity_plan.rs` no molde de `codex_plan.rs` (só busca quando a pílula aparece ou é clicada, no máximo uma vez por minuto, nunca em pausa).
- [ ] 5.2 `tests/plan.test.mjs`: resposta de exemplo → porcentagens e horários de reset. Pílula no header igual à do Codex, desligada por padrão em Settings → Plan usage. Commit.

### Etapa 6 — Nova sessão com escolha do agente (M)
- [ ] 6.1 Testes Rust em `launch.rs`: `shell_command(shell, agent, has_prompt)` e `powershell_script(agent, prompt_file)` geram o comando de cada agente com o prompt vindo de `COUCOU_PROMPT`/arquivo (forma exata da 0.5), nunca dentro do comando. Incluir prompt com aspas, `;` e `&`.
- [ ] 6.2 Implementar: `enum LaunchAgent { Claude, Codex, Antigravity, Hermes }` em `launch.rs`; `launch_session(folder, prompt, agent)`. Antes de abrir, procurar o executável (reusar o localizador de `cli_relay.rs`); se não existir, devolver erro e a ilha diz qual CLI falta.
- [ ] 6.3 `src/core/bridge.ts` (`launchSession` ganha `agent`) e `src/views/launch.ts`: escolha do agente no estilo atual da tela, lembrando o último escolhido; só mostra agentes declarados nas pílulas ou instalados. `tests/launch.test.mjs`. Strings novas em `extra.json`.
- [ ] 6.4 Teste à mão: cada agente abre no Windows Terminal com o pedido. Commit.

### Etapa 7 — herdr e Orca como lugar (M)
- [ ] 7.1 herdr: Nova sessão ganha "Abrir no herdr" quando o `herdr` existe — novo painel na pasta, rodando o agente da Etapa 6 (comando da 0.6). Função nova em `herdr.rs` com teste dos argumentos (molde de `command_args`).
- [ ] 7.2 Relay (`hook/src/main.rs`): repassar `ORCA_TERMINAL_HANDLE` no payload, como já faz com `HERDR_PANE_ID`. Validar o formato (`term_` + uuid) antes de usar. Teste em `hook/`.
- [ ] 7.3 Criar `src-tauri/src/orca.rs` no molde de `herdr.rs`: `from_payload(payload) -> Option<Terminal>`, `observe(payload, event)` (lembra/esquece por sessão), `focus(session) -> bool` = `orca.exe terminal switch --terminal <handle> --json` e trazer a janela do Orca para frente. Executável: `orca.exe` no PATH ou `%LOCALAPPDATA%\Programs\orca\resources\bin\orca.exe` — sempre o `.exe`, nunca o `orca.cmd` (o cmd relê os argumentos). Testes iguais aos do `herdr.rs` (handle inválido → não roda nada).
- [ ] 7.4 Ligar `orca::focus` em "Abrir terminal" e em `drop_into_session`, ao lado de `herdr::focus`. No drop, numa sessão do Orca, mandar o texto direto: `orca.exe terminal send --terminal <handle> --text "<caminhos>"` **sem** `--enter` (o usuário ainda revisa o prompt), em vez de colar com o teclado. Se o comando falhar → "copied", como hoje.
- [ ] 7.5 Nova sessão "Abrir no Orca", quando o `orca.exe` existe e `orca status --json` diz `runtimeReachable: true`: pasta existente → `orca.exe agent launch --agent <claude|codex|antigravity|hermes> --worktree path:<pasta> --prompt <pedido> --surface terminal --focus --json`; opção "em worktree nova" → `orca.exe worktree create --name <nome> --repo path:<pasta> --agent <id> --prompt <pedido> --activate --json`. O prompt vai como um argumento só, com `Command::arg`, sem shell no meio. Conferir na Etapa 0 os ids de agente que o Orca aceita (o Hermes pode não estar). Teste dos argumentos. Commit.

**Orca: o que já sabemos (levantado em 2026-11-09 no notebook):**
- Orca 1.4.251, app desktop MIT (github.com/stablyai/orca, docs em onorca.dev/docs). Instalado em `%LOCALAPPDATA%\Programs\orca`; CLI `resources\bin\orca.exe` (e `orca.cmd`) no PATH; dados em `%APPDATA%\orca` e `%USERPROFILE%\.orca`. Quase tudo no CLI precisa do app aberto (`orca status`, `orca open`).
- Cada tarefa roda numa worktree git própria; o agente abre como **terminal** ou **chat** (escolha Chat | CLI de cada agente). Coucou só cobre o modo terminal: no modo chat os hooks do Coucou podem nem rodar — verificar na Etapa 0.
- Todo terminal do Orca recebe: `ORCA_TERMINAL_HANDLE` (`term_<uuid>`, o que os comandos `terminal` usam), `ORCA_PANE_KEY`, `ORCA_TAB_ID`, `ORCA_WORKTREE_ID` (`<repo-id>::<pasta>`), `ORCA_WORKSPACE_ID`, `ORCA_APP_VERSION`.
- Comandos úteis: `orca terminal switch|send|list|read`, `orca agent launch`, `orca worktree create|current|list`, `orca status`. Todos aceitam `--json`.
- **O Orca instala hooks próprios** nos mesmos agentes que o Coucou: `orca-agent-hook.exe claude` no `~\.claude\settings.json` (16 entradas), `codex-hook.cmd` no `~\.codex\hooks.json`, `antigravity-*.cmd` no `~\.gemini\config\hooks.json`, e um para o Grok. Eles convivem: o instalador do Coucou só acrescenta e remove as entradas dele, nunca as do Orca — ter um teste disso em `agents.rs` com um arquivo que já tem as entradas do Orca.
- O Orca guarda o último estado de cada agente em `%APPDATA%\orca\agent-hooks\last-status.json` (com o prompt e a última resposta). O Coucou **não** lê esse arquivo: os hooks dele já trazem o mesmo, e o arquivo tem texto do usuário.
- No notebook hoje: `codex`, `agy`, `hermes` (`%LOCALAPPDATA%\hermes\bin`) e `herdr` 0.9.5 estão instalados; os hooks do Coucou ainda **não** estão instalados em nenhum agente, e o plugin do Hermes também não (Fase 0).

### Etapa 8 — Documentar e lançar (P)
- [ ] 8.1 `windows/README.md`: tabela "Supported agents" e textos de Nova sessão, diff ao vivo e "Open terminal" atualizados.
- [ ] 8.2 `CHANGELOG.md`, linha na tabela de versões do README, e What's new em `windows/src/whats-new/whats-new.json` (1 a 4 itens, 14 línguas); `python3 scripts/test-whats-new.py` passa.
- [ ] 8.3 Tabelas "Hoje" desta seção sem nenhum ❌ que não seja "impossível". Commit.

**Ordem e dependências:** 0 → (1, 2, 3, 4, 5 em qualquer ordem) → 6 → 7 → 8. A 7 depende da 6 (agente escolhido). Itens da Fase 2 que tocam nisto: 3 (custo e tokens) e 7 (lançador rápido) devem nascer já com os quatro agentes.

## Fase 3 — Identidade própria (só se for distribuir)
- Novo nome, personagem e sons (o código é MIT; nome Coucou, Mochi e sons são © Louis Raillé)
- Novo `identifier` no `tauri.conf.json` (hoje `fr.louisraille.coucou`) para não colidir com o Coucou oficial
- Releases próprias no GitHub (`windows-vX.Y.Z`) para o atualizador do fork funcionar
- Assinatura de código (certificado) para não aparecer o aviso do SmartScreen

## Parqueado — para revisitar depois
- **Segunda Mente no Windows (Flutter desktop, opção 2).** Projeto grande: os plugins de celular (ML Kit, workmanager, health, pedometer, quick_actions, share_handler, agent_background_android) precisam de substituto ou saem no Windows. Exige revisar o D-042 em `segundamente/docs/DECISIONS.md`. Escopo ainda não escolhido: captura e relatório (recomendado), paridade total ou só leitura.
- **Ponte Notetaker → Segunda Mente via Google Drive.** O Notetaker salva a transcrição em `C:\Users\notefael\Google Drive` no formato `[HH:MM:SS] Nome: fala` (já aceito pelo importador do Segunda Mente) e o celular importa pelo "Importar transcrição". Em aberto: salvar sempre ao fim da gravação ou perguntar a cada vez. O texto vai para um serviço de terceiros, então precisa de aviso e opt-in.

## Como manter o fork em dia
`git fetch upstream && git merge upstream/main` — fazer antes de começar cada item.
