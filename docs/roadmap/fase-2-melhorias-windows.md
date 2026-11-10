> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase 2 — Melhorias próprias do Windows

Cada item segue a sequência: descoberta do código atual → mini-spec/aceite → testes da lógica → implementação → teste manual → checkpoint. As referências a arquivos abaixo são pontos de entrada; registrar no mini-spec os arquivos exatos depois da descoberta.

### 2.1 — Notificações nativas com Permitir/Negar (M)

- [ ] Mapear o fluxo atual de pedidos de permissão em `windows/src/island/hooks.ts`, os comandos de aprovação em `windows/src-tauri/` e a API nativa do Windows disponível no app.
- [ ] Definir no mini-spec quando usar toast (ilha escondida/tela cheia), conteúdo permitido e prazo de expiração.
- [ ] Escrever testes de roteamento: clique Permitir, clique Negar, fechar/ignorar e timeout.
- [ ] Implementar ações de toast ligadas ao mesmo pedido pendente da ilha.
- [ ] Confirmar que nenhum caminho aprova sem clique; em timeout a pergunta continua no terminal.
- [ ] Testar com ilha visível, escondida, tela cheia, duas solicitações e notificação expirada.
- Checkpoint: clique explícito decide o pedido correspondente; nenhum toast atrasado decide pedido de outra sessão.

### 2.2 — Modo jogo/tela cheia (P)

- [ ] Mapear detecção de monitor/janela em `windows/src-tauri/src/platform/windows.rs` e a geometria/visibilidade da ilha.
- [ ] Definir em mini-spec o que conta como tela cheia (jogo exclusivo, janela sem borda e vídeo) e quais avisos podem trazer Mochi de volta.
- [ ] Escrever testes de transição normal → tela cheia → normal e pedido de permissão durante tela cheia.
- [ ] Implementar ocultação/reaparecimento sem alterar as configurações salvas de posição.
- [ ] Testar jogo ou vídeo real, Alt+Tab, trocar monitor e encerrar processo em tela cheia.
- Checkpoint: ilha some apenas no estado definido; pedido de permissão continua visível e exige clique.

### 2.3 — Custo e tokens por sessão (M; depende da paridade de agentes)

- [ ] Depois da Etapa 2B.6, inventariar a fonte local de uso para Claude, Codex, Antigravity e Hermes; marcar explicitamente fonte inexistente.
- [ ] Definir no mini-spec quais unidades/custos são confiáveis, período dia/semana e agrupamento por projeto; não estimar preço/modelo ausente.
- [ ] Criar fixtures locais sanitizadas e testes para JSONL truncado, modelo sem preço, sessão duplicada e projeto ausente.
- [ ] Ler apenas dados locais de cada agente; não fazer upload nem adicionar telemetria.
- [ ] Testar soma por sessão/projeto/dia e estado “indisponível” quando faltar fonte confiável.
- Checkpoint: totais reproduzíveis a partir das fixtures; dado desconhecido nunca aparece como zero confirmado.

### 2.4 — Pílula do Git (P)

- [ ] Localizar como a sessão ativa fornece a pasta do projeto e confirmar que não existe ID de pílula Git já publicado.
- [ ] Definir no mini-spec branch, arquivos alterados, ahead/behind, clique no diff e estados sem repositório/sem upstream.
- [ ] Fixar um ID novo e estável antes de publicar; não reutilizar nem renomear ID existente.
- [ ] Criar testes com repositório limpo, arquivos modificados/criados, detached HEAD, sem upstream e duas sessões em projetos distintos.
- [ ] Implementar leitura somente local; não executar fetch, pull, checkout, commit ou push.
- [ ] Clicar na pílula e conferir que abre o diff do projeto correto; testar repositório removido durante a sessão.
- Checkpoint: status corresponde ao projeto da sessão ativa e nenhuma operação modifica o repositório.

### 2.5 — Focar a aba exata do Windows Terminal (M)

- [ ] Descobrir identificadores de janela/tab/pane disponíveis para a sessão e APIs suportadas pela versão instalada do Windows Terminal.
- [ ] Definir fallback: se não houver identificação inequívoca, focar a janela do Terminal como hoje e não uma aba arbitrária.
- [ ] Testar duas abas com o mesmo título, painel dividido, sessão encerrada e Terminal ausente.
- [ ] Implementar foco pela identidade da sessão; nunca executar texto/comando como efeito de foco.
- Checkpoint: cada sessão focada corresponde à aba correta; ambiguidade usa o fallback registrado.

### 2.6 — Histórico e busca de sessões (M)

- [ ] Inventariar arquivos locais de sessão, retenção e campos seguros para indexar; não ler prompt completo para log.
- [ ] Definir no mini-spec quais eventos/resumos ficam visíveis e como excluir/limpar histórico.
- [ ] Criar testes para sessões ausentes, JSONL incompleto, sessão duplicada e consulta sem resultado.
- [ ] Implementar busca local por projeto, agente, data e termos aprovados no mini-spec.
- [ ] Conferir que buscar não altera arquivos de sessão e que os resultados abrem a sessão correta.
- Checkpoint: índice local reproduzível, sem telemetria e sem conteúdo sensível em logs.

### 2.7 — Lançador rápido (P; depende da Etapa 2B.6)

- [ ] Reutilizar Nova sessão e o seletor de agente/projeto da Etapa 2B.6; não manter um lançador paralelo só para Claude.
- [ ] Definir no mini-spec o atalho, o primeiro campo focado, seleção de projeto/agente, ditado e ação explícita de iniciar.
- [ ] Testar prompt com aspas, `;`, `&`, Unicode e quebras de linha; o texto nunca é interpolado no comando do shell.
- [ ] Testar CLI ausente, projeto removido, cancelar e voltar sem iniciar sessão.
- [ ] Implementar para Claude, Codex, Antigravity e Hermes; o agente selecionado deve permanecer visível na confirmação.
- Checkpoint: só inicia após ação explícita; prompt chega intacto pelo canal seguro; permissão continua independente.

### 2.8 — Vigia de testes/builds (M)

#### 2.8a — Comandos locais

- [ ] Definir quais comandos/processos observar: `npm test` e `cargo build`, diretório de trabalho e significado de sucesso/falha/cancelamento.
- [ ] Testar processos simultâneos, comando iniciado fora do projeto, encerramento abrupto e saída não zero.
- [ ] Implementar leitura do exit code sem relançar nem alterar o comando observado.
- [ ] Mostrar resultado associado ao projeto correto e não repetir alerta para o mesmo processo.
- Checkpoint: verde só para exit code zero; vermelho para erro; cancelado não é sucesso.

#### 2.8b — CI remoto

- [ ] Decidir provedor/identidade de repositório e autorização de leitura; não embutir token no app.
- [ ] Criar mini-spec separado para polling, limites e estado offline.
- [ ] Só implementar depois da decisão; falha de rede não altera status local como se o CI tivesse passado.
- Checkpoint: resultado mostra commit/workflow corretos e não envia código/logs do projeto.

### 2.9 — Sugestões de regras de permissão (M)

- [ ] Usar a proposta do roadmap: após 12 aprovações explícitas do mesmo comando, apresentar sugestão; alterar o limiar exige decisão registrada.
- [ ] Testar normalização de espaços/argumentos, comando diferente, contador reiniciado e comandos perigosos.
- [ ] Mostrar regra proposta e diff do arquivo de configuração; gerar backup datado.
- [ ] Gravar somente após o usuário clicar em confirmar; fechar/ignorar mantém o arquivo byte a byte.
- [ ] Testar parse inválido e configuração de outra ferramenta: preservar sem sobrescrever.
- Checkpoint: nunca conceder regra por contagem sozinha; a gravação depende de clique após visualizar o diff.

### 2.10 — Vários monitores (P)

- [x] O código e Settings já permitem escolher monitor/seguir o cursor; a UI foi observada em 0.6.2.
- [ ] Com hardware de dois monitores, testar mover cursor e ilha entre displays com escalas/origens diferentes.
- [ ] Confirmar que posições e configurações continuam corretas ao desconectar/reconectar um monitor.
- Se o equipamento de validação continuar com um monitor, registrar HARDWARE INDISPONÍVEL; manter essa caixa pendente.
- Checkpoint: relatório lista quantidade de monitores, resolução/escala e resultados; não afirmar validação multi-monitor sem dois displays.

### 2.11 — Login das assinaturas e modo de autenticação do Gemini (P)

Spec: `docs/superpowers/specs/2026-11-09-subscription-sign-in-design.md`; plano: `docs/superpowers/plans/2026-11-09-subscription-sign-in.md`.

- [x] Estado de login somente leitura e botão Connect por CLI em Settings → Your AI subscriptions.
- [x] Troca OAuth ↔ chave de API do Gemini via `config_file` (diff, backup datado, clique); JSON inválido é recusado sem gravar.
- [x] Testes: `cargo test --lib` (613), `npx tsc --noEmit`, `npm test` (582) passam em 2026-11-09.
- [x] Manual, troca do Gemini (build dev de `998be57`, 2026-11-09): API key → OAuth gravou só `selectedType`, com backup idêntico aos bytes anteriores; a prévia OAuth → API key mostrou o diff e o caminho do backup sem gravar; Cancelar não gravou nem criou backup; confirmar voltou a `gemini-api-key`, com o arquivo final idêntico byte a byte ao inicial.
- [x] Manual, estado: Claude "Conectado · e-mail", Codex "Conectado · ChatGPT (OAuth)" e Gemini em chave de API "Não conectado" bateram com os arquivos.
- [x] Corrigido — Connect com a CLI já conectada: o clique em ChatGPT abriu `codex login`, que removeu `~/.codex/auth.json` antes de concluir o novo login. Agora Connect só aparece quando a CLI está desconectada.
- [x] Corrigido — Gemini em `oauth-personal` aparecia "Conectado · Google (OAuth)" sem conta ativa. Agora "Conectado" exige conta ativa em `google_accounts.json` ou `~/.gemini/oauth_creds.json` (teste `gemini_is_connected_only_with_a_google_sign_in_not_just_the_mode`). Limite: o login próprio do Antigravity (cofre de credenciais do Windows) não é lido.
- [x] Manual após as correções (build dev, 2026-11-09): Claude e ChatGPT conectados sem botão Connect; Gemini em `oauth-personal` sem conta mostra "Não conectado", com Connect e "Usar chave de API". `cargo test --lib` (614) e `npm test` (582) passam.
- [ ] Manual pendente: Connect em uma CLI desconectada conclui o login e o estado vira "Conectado" ao reabrir Settings.
- Checkpoint 2.11: nenhum arquivo de agente gravado sem diff + clique; nenhum token exibido ou registrado.
