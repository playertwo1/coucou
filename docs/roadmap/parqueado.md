> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

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

### Conectores externos do pacote Mochi

- [ ] n8n, PowerToys, LocalSend e KDE Connect: só voltam com um caso de uso real descrito pelo proprietário.
- [ ] Antes de qualquer integração, rever a licença e o custo de manter o conector.
- Checkpoint: sem caso de uso aprovado, não instalar nem integrar.

### Ensinar rotina por demonstração (ideia do Understudy)

O usuário faz a tarefa uma vez, o app grava e o modelo extrai uma rotina com parâmetros.

- [ ] Só volta depois do Checkpoint M8 e com um caso de uso real em que "salvar como rotina" (M8.2) não baste.
- [ ] Versão aceitável: gravar só eventos de acessibilidade (app, janela, controle, ação), sem vídeo, sem captura de tela e sem texto digitado; o proprietário revisa os passos antes de qualquer envio ao cérebro.
- Motivo do parqueamento: no Understudy isso depende de vídeo da tela, monitor global de teclado e mouse e envio de quadros ao provedor do modelo. Isso captura senhas e conteúdo privado e contraria as regras de registro e de conteúdo de tela das fases M. O código é Swift, só macOS.
- Checkpoint: sem spec aprovada com esse limite de captura, não gravar nenhum evento global.

### Ideias do Understudy rejeitadas (2026-11-11)

Fonte: `understudy-ai/understudy` (MIT). Só reabrir com decisão explícita do proprietário.

- Ferramenta `bash`/shell livre: contraria "Ferramenta, não shell".
- Localizar controle por captura de tela com segundo modelo (grounding visual): exige um modelo de visão chamado por chave de API a cada clique, envia capturas de tela ao provedor e adivinha posição, o que a M5.5 proíbe. O cérebro por assinatura/CLI não serve para isso.
- Oito canais de mensagem (Telegram, Slack, WhatsApp…) e gateway HTTP/WebSocket: é acesso de fora da rede local, já excluído em 2026-11-09, e a M1.5 só permite stdio ou loopback. O celular já entra pela ligação local.
- Anexar ao Chrome do usuário por extensão (abas já logadas): contraria o perfil isolado da M6.
- Agendamento por cron: já excluído em 2026-11-09.
- Cristalização automática (analisar o histórico de conversas em segundo plano e publicar rotina sozinho): guarda o texto das conversas, gasta a assinatura sem pedido, quebra "0 % de CPU com a ilha escondida" e salva rotina sem clique (M8.2). A parte útil virou "salvar como rotina" na M8.2.
- Níveis de autonomia que sobem sozinhos (`manual` → `full_auto`): no Understudy é só projeto, sem código de promoção; aqui o risco alto pede clique toda vez e isso não é negociável.
- Observação passiva contínua e sugestões proativas: vigilância permanente da tela, sem implementação no próprio Understudy.
- Subagentes, playbooks e workers: a rotina da M8 é uma lista plana de ferramentas; orquestração em estágios não tem caso de uso.
- Reuso de código: runtime Node sobre `pi-agent-core` e helper Swift para macOS; nada encaixa no Tauri/Rust.

### Fora de escopo do Mochi por decisão (2026-11-09)

- Plugin Obsidian Local REST API: o cofre é lido direto pelos arquivos.
- Chave de API paga obrigatória e modelo local como cérebro.
- Acesso do celular pela internet (fora da rede local).
- Agendamento de rotinas por horário.
