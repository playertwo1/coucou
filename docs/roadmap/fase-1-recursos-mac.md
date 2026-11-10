> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

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
