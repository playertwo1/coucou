# Roadmap do fork Windows Coucou — playertwo1/coucou

Atualizado em 2026-11-09. Fonte canônica de estado: `docs/ROADMAP-FORK.md`.

## Estado e regras de leitura

- O fork está na `main`, com a versão `windows-v0.6.2` publicada; o atualizador consulta as releases de `playertwo1/coucou`.
- O aplicativo e várias features já têm código e testes, mas ainda falta validação manual em runtime. Não marque uma feature como concluída só porque compila.
- Esforço: P = pequeno, M = médio, G = grande. Estimativa serve para comparar itens; uma feature M/G deve ser subdividida antes da implementação.
- [ ] Pendente.
- [x] Feito, com a evidência exigida pelo checkpoint.
- Item implementado, mas com validação manual pendente: marcar o código/teste como feito e manter a caixa de runtime vazia.
- Uma etapa condicional só pode ser marcada como N/A depois de registrar a evidência que a tornou desnecessária ou impossível.

### Como executar uma etapa

1. Trabalhar em uma subfase por vez. Não começar a etapa dependente enquanto o checkpoint anterior não estiver fechado.
2. Antes de uma etapa de código: `git status` limpo; `git fetch upstream && git merge upstream/main`. Se houver conflito ou alteração local, parar e resolver isso antes de prosseguir.
3. Antes de código com UX ou comportamento novo, escrever uma spec curta em `docs/superpowers/specs/` e um plano em `docs/superpowers/plans/`. Incluir arquivos, interfaces, testes, aceite e rollback de migração quando houver.
4. Implementar a menor mudança que cumpre o aceite. Para Fase 2B, seguir TDD. Nas demais, acrescentar os testes proporcionais à lógica alterada.
5. Fechar o checkpoint registrando versão do app, ambiente, resultado de cada cenário e falhas sem segredos, prompts ou caminhos pessoais. Fazer um commit por subfase concluída.
6. Não criar tag nem publicar release sem pedido explícito do proprietário.

### Restrições do projeto para todas as etapas

- Não redesenhar nem alterar o visual de telas e pílulas existentes sem pedido explícito.
- Não renomear IDs de pílula publicados.
- Frases novas da interface vão em `windows/src/i18n/extra.json`, nas 13 línguas; executar a verificação de i18n existente.
- Nunca aprovar permissão sem clique explícito. Se não houver clique ou a resposta falhar, o agente continua perguntando no próprio terminal.
- Nunca sobrescrever configuração de agente sem backup datado, diff visível e confirmação explícita. Preservar hooks de outras ferramentas.
- Nunca enviar e-mail automaticamente, fazer transação, armazenar chave em texto puro ou adicionar telemetria.
- Usar dados locais quando o item disser local/offline. Não fazer fetch, push, gravação ou alteração de arquivos como efeito colateral de uma pílula somente de leitura.

### Comandos de validação por tipo de mudança

- TypeScript e testes Windows: em `windows`, `npx tsc --noEmit` e `npm test`.
- UI/recursos de build: em `windows`, também `npm run build`.
- Rust do app Windows: em `windows/src-tauri`, `cargo test --lib`.
- Relay/hook: em `windows/hook`, `cargo test`.
- What's New de release: na raiz, `python3 scripts/test-whats-new.py`.
- Teste manual: usar a lista de cenários do checkpoint; não substituir por typecheck ou teste unitário.

## Snapshot de validação — 2026-11-09

- [x] `npm run tauri dev` abriu a versão de desenvolvimento 0.6.2.
- [x] Settings → General mostrou a posição da ilha e a opção de monitor.
- [x] A tela de Atalhos mostrou Ctrl+Alt+L e Ctrl+Alt+I habilitados.
- [ ] A máquina tinha um monitor: troca real entre dois monitores não foi exercitada.
- [ ] A ação dos atalhos não foi confirmada de forma isolada: havia duas instâncias Coucou e os logs/estado eram compartilhados.
- [ ] Ditado, gravação do Notetaker, modo reunião, busca com notas reais e reprodução do YouTube Music não foram validados nesta sessão.
- O instalador existente no PC reportou 0.5.9; a build de desenvolvimento reportou 0.6.2. Não comparar comportamento dessas duas versões como se fossem a mesma build.

## Fase 0 — Validar o que já existe

Objetivo: confirmar os recursos do upstream 0.6 e as mudanças do fork no aplicativo Windows. Nenhuma feature nova começa antes de registrar o resultado da validação aplicável.

### 0.1 — Ditado Flow (Parakeet)

- [x] Abrir a build dev 0.6.2 (`windows/target/debug/coucou.exe`); os quatro arquivos Parakeet e os dois do diarizador estão presentes com os tamanhos esperados em `%LOCALAPPDATA%\Coucou\Models`, então não foi necessário baixar nada.
- [ ] Ditar uma frase de teste no VS Code; conferir que o texto aparece uma vez no campo focado.
- [ ] Repetir no navegador e no Windows Terminal, um alvo de cada vez.
- [ ] Se o Windows pedir acesso ao microfone, conceder apenas pelo diálogo clicado pelo usuário.
- [ ] Passar se o modelo carrega e a frase chega sem duplicação aos três alvos; registrar separadamente qualquer falha.
- Checkpoint: registrar versão, idioma, três resultados e erro/log sanitizado, sem guardar áudio privado.
- Status (2026-11-09): PENDENTE A PEDIDO DO PROPRIETÁRIO — só a abertura da build e a presença dos modelos foram verificadas; os testes de ditado nos três alvos não foram executados.

### 0.2 — Notetaker em chamada

- [ ] Escolher uma chamada de teste no Meet, Teams ou Discord; anotar qual aplicativo e se é navegador ou desktop.
- [ ] Clicar para conceder permissões de áudio que o Windows solicitar.
- [ ] Gravar um trecho de teste, parar a gravação e conferir transcrição e resumo na lista de notas.
- [ ] Confirmar que parar a gravação encerra a captura e que a nota continua disponível após reabrir a lista.
- Checkpoint: registrar aplicativo, fonte de áudio, presença de transcrição/resumo e falhas; não guardar áudio ou fala real como fixture.
- Status (2026-11-09): BLOQUEADO — aguarda uma chamada de teste escolhida pelo proprietário; nenhuma gravação foi iniciada.

### 0.3 — « OK Coucou » com Anthropic

- [ ] Usar somente uma chave já configurada pelo usuário; se não houver, marcar BLOQUEADO e não pedir para colar o segredo no chat/log.
- [ ] Enviar uma pergunta curta sem dados pessoais e conferir a resposta na ilha.
- [ ] Conferir que indisponibilidade de rede/chave é apresentada como erro e não grava o segredo em logs.
- Checkpoint: resultado PASS/FAIL/BLOQUEADO e mensagem sanitizada.
- Status (2026-11-09): BLOQUEADO — Settings → Chat indicou que não há chave Anthropic configurada; nenhuma pergunta foi enviada.

### 0.4 — Hook do Claude Code e Windows Terminal

- [ ] Conferir se o hook está instalado; antes de instalar/atualizar, criar backup datado, mostrar o diff e obter confirmação explícita.
- [ ] Executar uma ação que gere pedido de permissão; confirmar que a ilha mostra Permitir/Negar.
- [ ] Clicar Negar e confirmar que o agente recebe a recusa; repetir e clicar Permitir.
- [ ] Repetir sem clicar: o Coucou não pode aprovar sozinho; o pedido deve continuar no terminal.
- [ ] Usar “Abrir terminal” e confirmar que a janela da sessão correta vem à frente.
- Checkpoint: confirmar cada uma das três decisões (permitir, negar, sem clique) e o terminal-alvo. Não marcar aprovado se só a tela do cartão foi vista.
- Status (2026-11-09): AGUARDANDO CONFIRMAÇÃO — Claude Code foi detectado, mas os hooks não estão instalados. A prévia propõe adicionar os handlers Coucou para os 12 eventos e criar backup datado, preservando entradas existentes; nenhuma gravação foi feita.

### 0.5 — Spotify, uso do plano e resumo semanal

#### 0.5a — Spotify

- [ ] Iniciar ou pausar uma reprodução real de teste no Spotify.
- [ ] Conferir título/artista/estado na pílula e que os controles não agem sobre outro player.
- Checkpoint: registrar cliente Spotify usado e resultado.

#### 0.5b — Uso do plano

- [ ] Abrir a tela/pílula de uso para cada provedor já configurado (Claude e Codex, quando disponíveis).
- [ ] Comparar cota/percentual e próximo reset com a fonte do próprio provedor.
- [ ] Conferir estado indisponível/sem autenticação sem exibir dados inventados.
- Checkpoint: registrar provedor, fonte comparada, horário e discrepância observada; remover identificadores de conta.

#### 0.5c — Resumo semanal

- [ ] Abrir o resumo semanal com dados de sessões existentes.
- [ ] Conferir intervalo de datas, agrupamento por projeto e que sessões não são contadas duas vezes.
- Checkpoint: registrar a faixa temporal e um exemplo sanitizado de contagem.

### 0.6 — Inicialização com o Windows

- [ ] Verificar o estado atual da opção de iniciar com o Windows; não alterá-la sem autorização.
- [ ] Se estiver habilitada, combinar um reinício de teste, salvar o trabalho aberto e reiniciar.
- [ ] Após entrar no Windows, confirmar que uma única instância abre e a ilha fica utilizável.
- [ ] Se a opção estiver desligada e o proprietário autorizar habilitá-la, repetir o reinício; caso contrário, registrar BLOQUEADO.
- Checkpoint: estado anterior/posterior da opção, número de instâncias e resultado após login.

### 0.7 — Coucoudoro: timer e foco

- [x] Código e testes do Coucoudoro existem na versão do fork.
- [ ] Iniciar um ciclo de foco e confirmar que o contador diminui; iniciar descanso e confirmar a fase correspondente.
- [ ] Associar uma sessão a um projeto e conferir tempo do dia, por projeto e total.
- [ ] Encerrar e reabrir a tela; conferir que o histórico do dia continua igual.
- Checkpoint: registrar duração, projeto de teste e valores antes/depois.

### 0.8 — Coucoudoro: linha ditada por fase

- [x] Código e testes da nota de fim de ciclo existem.
- [ ] Terminar um ciclo e ditar uma frase de teste quando solicitado.
- [ ] Conferir que a frase fica no histórico do dia e associada à fase/projeto corretos.
- [ ] Reabrir o histórico e confirmar persistência; cancelar ditado e confirmar que nenhuma frase vazia é salva.
- Checkpoint: resultado do ciclo completo, cancelamento e persistência.

### 0.9 — Playlist do YouTube Music ligada ao Coucoudoro

- [x] Integração do YouTube Music existe para Windows.
- [ ] Com a pílula ligada e uma sessão de mídia ativa, iniciar foco e conferir que a música abre/continua conforme a configuração.
- [ ] Pausar/terminar o ciclo e conferir o comportamento de pausa definido pelo recurso.
- [ ] Desligar a pílula e repetir: o Coucoudoro não deve comandar o YouTube Music.
- Checkpoint: cliente (app ou web), estado da pílula, estado antes/depois. Não considerar Spotify equivalente a YouTube Music.

### 0.10 — Botões de ditado no chat e Nova sessão

- [x] Botões de ditado implementados em Chat e Nova sessão.
- [ ] Clicar no microfone do Chat, ditar e conferir inserção no campo correto; confirmar que ditar não envia a mensagem.
- [ ] Repetir em Nova sessão; confirmar que ditar não inicia sessão automaticamente.
- [ ] Testar cancelamento, campo vazio e negação da permissão de microfone.
- Checkpoint: quatro resultados (Chat, Nova sessão, cancelar, negar permissão).

### 0.11 — Posição nos cantos e escolha de monitor

- [x] Settings mostra centro/cantos e seleção do monitor.
- [ ] Testar centro, quatro cantos, principal e “sob o cursor”; restaurar a configuração inicial ao terminar.
- [ ] Com dois monitores físicos, mover o cursor entre eles e confirmar que a ilha permanece no monitor esperado.
- [ ] Com um monitor apenas, registrar HARDWARE INDISPONÍVEL; não marcar troca física como aprovada.
- Checkpoint: posições testadas, monitor selecionado, quantidade de monitores e configuração restaurada.

### 0.12 — Ctrl+Alt+L: Nova sessão

- [x] Atalho aparece habilitado nas configurações.
- [ ] Com uma única instância Coucou, pressionar Ctrl+Alt+L e confirmar que abre Nova sessão.
- [ ] Escolher uma pasta de teste e conferir que a sessão abre no projeto escolhido.
- [ ] Cancelar antes de iniciar e confirmar que nenhum CLI/sessão foi aberto.
- Checkpoint: ação observada, pasta, estado de cancelamento e colisões de atalhos.

### 0.13 — Ctrl+Alt+I: anotar uma ideia por voz

- [x] Atalho e fluxo de gravação/transcrição implementados.
- [ ] Pressionar Ctrl+Alt+I, clicar para conceder microfone se solicitado e ditar uma frase de teste.
- [ ] Parar a gravação; conferir transcrição, data/hora e nota salva.
- [ ] Cancelar/recusar o microfone e confirmar que nenhuma nota falsa é criada.
- Checkpoint: nota salva, cancelamento e permissão, sem incluir transcrição pessoal neste arquivo.

### 0.14 — Modo reunião

- [x] Estado visual/silêncio durante gravação implementado.
- [ ] Começar a gravar no Notetaker e confirmar o estado de reunião da ilha.
- [ ] Confirmar que avisos menores ficam silenciosos durante a gravação.
- [ ] Gerar um pedido de aprovação/pergunta de teste e confirmar que esse alerta continua visível/sonoro conforme o comportamento previsto.
- [ ] Parar a gravação e confirmar a saída do modo reunião.
- Checkpoint: estados antes/durante/depois e avisos verificados.

### 0.15 — Busca nas notas

- [x] Campo de busca por palavra/pessoa implementado.
- [ ] Preparar duas notas de teste com palavras e nomes distintos.
- [ ] Buscar cada palavra e cada nome; confirmar nota correspondente e ausência de resultado falso.
- [ ] Limpar a busca e confirmar que a lista completa volta.
- Checkpoint: quatro consultas, resultado esperado e limpeza.

### 0.16 — Fechamento da Fase 0

- [ ] Atualizar cada caixa anterior com PASS, FAIL ou BLOQUEADO; caixa sem evidência fica pendente.
- [ ] Para cada FAIL, abrir subfase de correção com reprodução, causa, teste e aceite; não misturar várias falhas.
- [ ] Para cada BLOQUEADO, registrar o recurso/decisão física que falta e quem precisa fornecê-lo.
- Checkpoint da Fase 0: build e ambiente identificados; nenhum item apresentado como testado sem observação no app.

## Fase 1 — Recursos do Mac ainda não escolhidos

Regra: cada item abaixo começa por descoberta e aprovação de um mini-spec. A implementação não começa enquanto a interação exata estiver indefinida.

### 1.1 — Arrastar Mochi sobre uma janela para anexar contexto (M)

- [ ] Ler `NotchBuddy/Sources/App/FileDropNSView.swift` e localizar o fluxo Windows atual de drag/drop e anexos do chat.
- [ ] Definir em spec: janela-alvo, tipos de arquivo aceitos, destino (Chat atual ou novo), feedback e comportamento quando a janela/app não puder ser identificada.
- [ ] Aprovar a spec; manter o visual existente e os limites de acesso aos arquivos.
- [ ] Adicionar testes para caminho com espaços/Unicode, arquivo inexistente e destino ausente.
- [ ] Implementar o menor fluxo Windows que anexa o arquivo ao contexto sem movê-lo nem sobrescrevê-lo.
- [ ] Testar manualmente com um arquivo de texto e outro formato já aceito pelo Chat.
- Checkpoint: o anexo correto aparece no contexto; casos inválidos não abrem arquivo diferente nem mudam dados existentes.

### 1.2 — Arquivo solto → rascunho no Outlook clássico (M)

- [ ] Ler `windows/src-tauri/src/mail/` e o comportamento de envio por Mail no Mac.
- [ ] Fixar o comportamento de destino/assunto/corpo no mini-spec. Padrão proposto: abrir rascunho do Outlook com o anexo, sem destinatário presumido e sem enviar.
- [ ] Aprovar a spec; qualquer envio continua dependendo do clique explícito do usuário em Outlook.
- [ ] Testar arquivo válido, arquivo removido antes de abrir, Outlook indisponível e caminho com Unicode.
- [ ] Implementar rascunho/attachment; nunca chamar “Send” automaticamente.
- Checkpoint: rascunho abre com o arquivo escolhido; nenhum e-mail sai sem clique; falha não apaga o arquivo.

### 1.3 — Portfólio de cripto, somente leitura (G)

- [ ] Obter decisão do proprietário sobre exchanges/carteiras suportadas e dados a exibir (saldo, ativos, moeda de conversão).
- [ ] Definir permissões somente leitura, armazenamento de credenciais no serviço seguro existente, atualização e dados locais no mini-spec.
- [ ] Não implementar até as fontes e os campos serem escolhidos; chaves de saque, transações e trading ficam fora.
- [ ] Com decisão aprovada, criar fixtures sem credenciais e testes para saldo vazio, resposta incompleta, limite de API e erro de rede.
- [ ] Implementar uma fonte por subfase; conferir total/moeda sem arredondamento enganoso.
- Checkpoint: credencial nunca aparece em log, nenhum endpoint de escrita é chamado e os valores batem com a fonte.

### 1.4 — Cal.com em calendário em vez de lista (P)

- [ ] Ler `NotchBuddy/Sources/App/CalcomPoller.swift` e o card/lista atual no Windows.
- [ ] Definir janela temporal, navegação, fuso horário, eventos simultâneos e estados vazio/erro no mini-spec.
- [ ] Aprovar o desenho antes de alterar uma tela existente.
- [ ] Testar paginação, mudança de dia/fuso, ausência de eventos e erro de autenticação.
- [ ] Implementar a visualização preservando dados e comandos atuais de abertura do evento.
- Checkpoint: datas/horas correspondem ao fuso escolhido e não há evento duplicado ou perdido nos limites da página.

Apple Music continua fora do escopo Windows.

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

## Fase 2C — Pílulas configuráveis e posição livre da ilha (M)

Objetivo: escolher pílulas visíveis, adicionar Grok Bot como agente e permitir arrastar a ilha horizontalmente no topo. Resend/n8n/Vercel continuam disponíveis, desligados por padrão; desativar não apaga credenciais. Claude Code permanece principal; limite de quatro pílulas secundárias. A posição livre muda só X, preservando centro e quatro cantos.

Plano detalhado obrigatório: `docs/superpowers/plans/2026-11-09-custom-pills-and-island-position.md`; desenho: `docs/superpowers/specs/2026-11-09-custom-pills-and-island-position-design.md`.

### 2C.0 — Confirmar hook do Grok Bot

- [ ] Inspecionar eventos/configuração do hook do Orca; fixture sanitizada sem prompt, token ou caminho pessoal.
- [ ] Testar instalação e remoção sem apagar entradas do Orca; adicionar `Agent::Grok`/`agent_grok` só se o contrato observado for compatível.
- [ ] Testar SessionStart, atividade e encerramento; não adicionar cartão de aprovação.
- Checkpoint 2C.0: sessão real produz `agent_grok`; se não houver evento/configuração confiável, parar e rever spec.

### 2C.1 — Seleção e padrões das pílulas

- [ ] Adicionar Grok ao catálogo e à seleção existente de Active pills.
- [ ] Padrão: Claude principal; Codex, Antigravity, Grok e GitHub nas quatro vagas.
- [ ] Migrar só a lista antiga exata Resend/n8n/Vercel/GitHub; preservar qualquer lista customizada e credenciais.
- [ ] Testar catálogo, agente ocioso, limite quatro, default novo e migração em TypeScript/Rust.
- Checkpoint 2C.1: instalação nova usa o padrão novo; configuração personalizada permanece idêntica.

### 2C.2 — Arraste horizontal no topo

- [ ] Adicionar `topCustom` e `islandTopX` normalizado de 0 a 1; centro superior redefine para 0.5.
- [ ] Começar drag só no fundo, fora de controles/Mochi e após limiar; clique abaixo do limiar continua clicando.
- [ ] Limitar X ao monitor e preservar Y/recuo, quatro cantos e escala/origem negativa.
- [ ] Testar persistência ao fechar/reabrir, monitores com escalas diferentes e controles que não podem virar drag.
- Checkpoint 2C.2: arrasta e salva sem roubar cliques nem deixar a ilha fora do monitor.

### 2C.3 — Verificação/documentação

- [ ] Seguir a Tarefa 4 do plano detalhado: migração, Grok idle/ativo, padrão novo, lista customizada e credenciais.
- [ ] Validar drag recolhido/expandido, centro/bordas, cantos antigos, escala diferente de 100% e reabertura.
- [ ] Atualizar README, CHANGELOG e What's New nas 14 línguas; `python3 scripts/test-whats-new.py` passa.
- Checkpoint 2C.3: testes completos e validação manual passam; publicar somente com pedido explícito.

## Fase 3 — Identidade própria, somente se o proprietário decidir

- [x] Releases `windows-vX.Y.Z` do fork, SHA-256 e atualizador apontando para `playertwo1/coucou` já existem.
- [x] Decisão atual: sem certificado pago; instalador não assinado com SHA-256.
- [ ] 3.1 Decidir se Coucou/Mochi/sons devem ganhar nome/personagem/sons próprios; sem decisão, não alterar identidade visual.
- [ ] 3.2 Se aprovado, definir novo `identifier` e plano de migração dos dados/permissões existentes antes de mudar `tauri.conf.json`.
- [ ] 3.3 Testar upgrade da instalação atual, preservação de settings, hooks, permissões e caminho de update antes de publicar.
- Checkpoint 3: não mudar identifier/nome/sons até haver decisão e teste de migração aprovados. Certificado pago continua fora de escopo.

## Parqueado — não iniciar sem escolher escopo

### Segunda Mente no Windows

- [ ] Escolher um escopo: captura+relatório, somente leitura ou paridade total.
- [ ] Ler D-042 em `segundamente/docs/DECISIONS.md` e listar plugins Flutter sem suporte Windows.
- [ ] Criar spec que define o que funciona sem esses plugins e quais dados ficam locais.
- Checkpoint: sem escopo e decisão aprovados, não criar target Windows nem substituir plugins.

### Ponte Notetaker → Segunda Mente via Google Drive

- [ ] Decidir salvar automaticamente ao parar a gravação ou perguntar a cada chamada.
- [ ] Definir aviso, opt-in, formato, diretório e comportamento sem Drive instalado/conectado.
- [ ] Testar que nada é enviado sem opt-in e que reimportar não duplica a transcrição.
- Checkpoint: integração externa só começa após escolha do fluxo e aprovação da spec.

## Checklist de release (executar apenas com pedido explícito)

- [ ] CHANGELOG contém seção desta versão e README tem linha na tabela de versões.
- [ ] `windows/src/whats-new/whats-new.json` tem 1–4 itens em 14 línguas; `python3 scripts/test-whats-new.py` passa.
- [ ] A versão é idêntica em `windows/package.json`, `windows/package-lock.json`, `windows/src-tauri/Cargo.toml`, nas duas entradas de `windows/src-tauri/Cargo.lock` e em `windows/src-tauri/tauri.conf.json`.
- [ ] Build/installer não assinado gerado e SHA-256 conferido; não comprar nem exigir certificado.
- [ ] Tag `windows-vX.Y.Z` enviada ao fork; tag sozinha não inicia build.
- [ ] Rodar `gh workflow run windows.yml -R playertwo1/coucou --ref windows-vX.Y.Z`; conferir workflow, release e asset antes de declarar publicado.
- Nunca executar esta lista de publicação sem o proprietário pedir release.

## Manter o fork atualizado

Antes de cada subfase de código, partir de árvore limpa, atualizar `upstream` e integrar `upstream/main`. Resolver e registrar conflitos antes da subfase; não misturar a resolução de upstream com a feature do checkpoint.
