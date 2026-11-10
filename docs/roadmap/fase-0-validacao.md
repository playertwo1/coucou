> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

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
- [x] Ditar uma frase de teste no VS Code; conferir que o texto aparece uma vez no campo focado.
- [x] Repetir no navegador e no Windows Terminal, um alvo de cada vez.
- [x] Se o Windows pedir acesso ao microfone, conceder apenas pelo diálogo clicado pelo usuário.
- [x] Passar se o modelo carrega e a frase chega sem duplicação aos três alvos; registrar separadamente qualquer falha.
- Checkpoint: registrar versão, idioma, três resultados e erro/log sanitizado, sem guardar áudio privado.
- Status (2026-11-09): PENDENTE A PEDIDO DO PROPRIETÁRIO — só a abertura da build e a presença dos modelos foram verificadas; os testes de ditado nos três alvos não foram executados.
- Status (2026-11-10): PASS relatado pelo proprietário ("todas já feitas"); sem detalhes de versão, cenários ou logs — evidência do checkpoint não registrada.

### 0.2 — Notetaker em chamada

- [x] Escolher uma chamada de teste no Meet, Teams ou Discord; anotar qual aplicativo e se é navegador ou desktop.
- [x] Clicar para conceder permissões de áudio que o Windows solicitar.
- [x] Gravar um trecho de teste, parar a gravação e conferir transcrição e resumo na lista de notas.
- [x] Confirmar que parar a gravação encerra a captura e que a nota continua disponível após reabrir a lista.
- Checkpoint: registrar aplicativo, fonte de áudio, presença de transcrição/resumo e falhas; não guardar áudio ou fala real como fixture.
- Status (2026-11-09): BLOQUEADO — aguarda uma chamada de teste escolhida pelo proprietário; nenhuma gravação foi iniciada.
- Status (2026-11-10): PASS relatado pelo proprietário ("todas já feitas"); sem detalhes de versão, cenários ou logs — evidência do checkpoint não registrada.

### 0.3 — « OK Coucou » com Anthropic

- [x] Usar somente uma chave já configurada pelo usuário; se não houver, marcar BLOQUEADO e não pedir para colar o segredo no chat/log.
- [x] Enviar uma pergunta curta sem dados pessoais e conferir a resposta na ilha.
- [x] Conferir que indisponibilidade de rede/chave é apresentada como erro e não grava o segredo em logs.
- Checkpoint: resultado PASS/FAIL/BLOQUEADO e mensagem sanitizada.
- Status (2026-11-09): BLOQUEADO — Settings → Chat indicou que não há chave Anthropic configurada; nenhuma pergunta foi enviada.
- Status (2026-11-10): PASS relatado pelo proprietário ("todas já feitas"); sem detalhes de versão, cenários ou logs — evidência do checkpoint não registrada.

### 0.4 — Hook do Claude Code e Windows Terminal

- [x] Conferir se o hook está instalado; antes de instalar/atualizar, criar backup datado, mostrar o diff e obter confirmação explícita.
- [x] Executar uma ação que gere pedido de permissão; confirmar que a ilha mostra Permitir/Negar.
- [x] Clicar Negar e confirmar que o agente recebe a recusa; repetir e clicar Permitir.
- [x] Repetir sem clicar: o Coucou não pode aprovar sozinho; o pedido deve continuar no terminal.
- [x] Usar “Abrir terminal” e confirmar que a janela da sessão correta vem à frente.
- Checkpoint: confirmar cada uma das três decisões (permitir, negar, sem clique) e o terminal-alvo. Não marcar aprovado se só a tela do cartão foi vista.
- Status (2026-11-09): APROVADO — hooks instalados após aprovação explícita (12 handlers, backup datado). Testes na pasta temporária confiada, com `claude --permission-mode default` no Windows Terminal (o `defaultMode: auto` do usuário e comandos só de leitura como `echo` não geram `PermissionRequest`). Cada rodada pediu a ferramenta Write para criar um arquivo de texto na pasta. Negar: pedido 34084-1, clique Negar, hook respondeu deny, arquivo não criado. Permitir: pedido 34084-2, clique Permitir, hook respondeu allow, `coucou-allow.txt` criado. Sem clique: pedido 34084-17 sem decisão na ilha; o log registrou `timed out — terminal takes over` após ~108 s e o arquivo não foi criado; a pergunta passou ao terminal. Abrir terminal: no cartão de sessão encerrada, trouxe à frente a aba da sessão correta (`coucou-noclick2`) entre três abas na mesma pasta. Observação: um clique destinado a um cartão do Antigravity aprovou o cartão seguinte do Claude Code ~1 s depois (fora da proteção de 600 ms); rodada descartada e repetida. Validado só com `--permission-mode default`, não no modo `auto`.

### 0.5 — Spotify, uso do plano e resumo semanal

#### 0.5a — Spotify

- [ ] Iniciar ou pausar uma reprodução real de teste no Spotify.
- [ ] Conferir título/artista/estado na pílula e que os controles não agem sobre outro player.
- Checkpoint: registrar cliente Spotify usado e resultado.
- Status (2026-11-09): N/A — o proprietário não usa Spotify. A pílula de mídia será validada com o YouTube Music (mesmo cartão e controles, `integration_youtubemusic`), que só é reconhecido como app instalado (PWA do Chrome/Edge ou app desktop), não como aba comum do navegador.

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

- [x] Verificar o estado atual da opção de iniciar com o Windows; não alterá-la sem autorização.
- [x] Se estiver habilitada, combinar um reinício de teste, salvar o trabalho aberto e reiniciar.
- [x] Após entrar no Windows, confirmar que uma única instância abre e a ilha fica utilizável. (Relato do proprietário em 2026-11-10: "reiniciei e funcionou"; contagem de instâncias não medida por mim.)
- [ ] Se a opção estiver desligada e o proprietário autorizar habilitá-la, repetir o reinício; caso contrário, registrar BLOQUEADO.
- Checkpoint: estado anterior/posterior da opção, número de instâncias e resultado após login.
- Status (2026-11-09): estado anterior DESLIGADO — `autostart: false` em `%APPDATA%\Coucou\settings.json`, nenhuma entrada do Coucou em `HKCU\...\CurrentVersion\Run`, uma instância em execução. O proprietário autorizou habilitar a opção e fazer o reinício de teste; resultado após login pendente.
- Preparação (2026-11-09 23:15): build de release de `8c7226c` instalada por cima da 0.6.2 (Desinstalar programas mostra 0.6.3; Settings mostra "Você tem a 0.6.3"). A build dev não serve para este teste: o autostart grava o caminho do exe em execução, e o exe de debug depende do servidor de desenvolvimento. "Abrir ao iniciar" ligado (`autostart: true`); `HKCU\...\Run\Coucou` = `C:\Users\notefael\AppData\Local\Coucou\coucou.exe --autostart`, habilitado em `StartupApproved\Run`; uma instância do app instalado em execução. Falta: reiniciar, entrar no Windows e conferir instância única e ilha utilizável.

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
- [x] Clicar no microfone do Chat, ditar e conferir inserção no campo correto; confirmar que ditar não envia a mensagem.
- [x] Repetir em Nova sessão; confirmar que ditar não inicia sessão automaticamente.
- [x] Testar cancelamento, campo vazio e negação da permissão de microfone.
- Checkpoint: quatro resultados (Chat, Nova sessão, cancelar, negar permissão).
- Status (2026-11-10): PASS relatado pelo proprietário ("todas já feitas"); sem detalhes de versão, cenários ou logs — evidência do checkpoint não registrada.

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
- [x] Pressionar Ctrl+Alt+I, clicar para conceder microfone se solicitado e ditar uma frase de teste.
- [x] Parar a gravação; conferir transcrição, data/hora e nota salva.
- [x] Cancelar/recusar o microfone e confirmar que nenhuma nota falsa é criada.
- Checkpoint: nota salva, cancelamento e permissão, sem incluir transcrição pessoal neste arquivo.
- Status (2026-11-10): PASS relatado pelo proprietário ("todas já feitas"); sem detalhes de versão, cenários ou logs — evidência do checkpoint não registrada.

### 0.14 — Modo reunião

- [x] Estado visual/silêncio durante gravação implementado.
- [x] Começar a gravar no Notetaker e confirmar o estado de reunião da ilha.
- [x] Confirmar que avisos menores ficam silenciosos durante a gravação.
- [x] Gerar um pedido de aprovação/pergunta de teste e confirmar que esse alerta continua visível/sonoro conforme o comportamento previsto.
- [x] Parar a gravação e confirmar a saída do modo reunião.
- Checkpoint: estados antes/durante/depois e avisos verificados.
- Status (2026-11-10): PASS relatado pelo proprietário ("todas já feitas"); sem detalhes de versão, cenários ou logs — evidência do checkpoint não registrada.

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
