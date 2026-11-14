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

### Personagens por agente (estudo de aparência)

**Reaberto por decisão do proprietário em 2026-11-13.** O proprietário não tem autorização escrita para usar o Mochi. O estudo volta a tratar de personagens originais do Lumen para os espaços de personagem (ilha e pílulas); a Bússola continua somente como ícone do aplicativo. Isso não desfaz retroativamente o cancelamento histórico da L1.4 nem aprova os personagens, imagens ou implementação. O app ainda não foi alterado nesta etapa.

Fontes: [pesquisa clawd-on-desk](../research/clawd-on-desk.md) (formato de pacote de personagem e estados) e [pesquisa QwenPaw](../research/qwenpaw.md) (mapa de eventos para estados).

**Etapa 1 — imagens de referência, sem código (em preparação):**

- [ ] Criar uma família original de sete personagens: Claude Code, Codex, ChatGPT, Antigravity, Gemini CLI, OpenCode e agente genérico. Usar as cores já adotadas no app; compartilhar proporção e linguagem facial, variando silhueta, acessório e cor.
- [ ] Salvar em `windows/design/personagens/`: `lineup.png`, uma prancha de estados para cada agente, `teste-22px.png` e `README.md` em pt-BR com primitivas, cores e mudanças por estado.
- [ ] Mostrar o material ao proprietário e aguardar aprovação ou pedido de ajustes. Não iniciar a Etapa 2 antes dessa decisão.

**Etapa 2 — protótipo Codex sprite × código, fora da release (bloqueada pela aprovação da Etapa 1):**

- [ ] Criar `personagens/<id>/personagem.json` nos modos `codigo` e `sprite`, cobrindo os 11 estados de `BotStateName`, os campos `caiPara` opcionais, variação enquanto o estado durar, tempos mínimos e caixa do corpo.
- [ ] Desenhar a versão em código no Canvas e trocar quadros do sprite pelo loop do app, pausado quando a ilha estiver escondida.
- [ ] Medir legibilidade a 22 e 96 px, CPU com a ilha escondida (meta 0 %), CPU visível, memória e aumento do instalador. Mostrar os resultados e aguardar o proprietário escolher sprite ou código.

**Etapa 3 — implementação (bloqueada pela escolha do proprietário na Etapa 2):**

- [ ] Preparar spec e plano antes do código; criar motor novo com a interface pública do `BotEngine`, selecionar personagem pelo agente e apontar o alias do Vite para o motor novo.
- [ ] Atualizar `LICENSE-ASSETS.md` para declarar os personagens originais do Lumen; executar as validações da etapa e seguir o checklist de release antes de publicar.
- Limites em todas as etapas: não usar nem imitar Mochi, Coucou ou Clawd; não incluir logos ou mascotes oficiais de empresas. A pesquisa externa informa formato e eventos, não autoriza copiar arte, texto ou código. Não inferir aceite real a partir de teste sintético ou publicação.
- Checkpoint: a Etapa 1 aguarda decisão do proprietário; sem aprovação explícita, a Etapa 2 não começa. A implementação do app permanece fora do escopo até a escolha da Etapa 2.

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
