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

### Personagens por agente — estudo assumido pela L1.4 (2026-11-13)

**Decisões do proprietário (2026-11-13):** a decisão anterior de cancelar a L1.4 foi substituída. Sem autorização escrita para usar o Mochi, os personagens do Lumen serão originais; a Bússola continua somente como ícone do aplicativo. O proprietário aprovou visualmente a lineup e as pranchas estáticas dos estados dos sete agentes. Com base na revisão técnica da L1.4b, escolheu Canvas na L1.4c. Essa decisão autoriza a implementação por etapas, sem aprovar código, animações ou uso real.

Fontes: [pesquisa clawd-on-desk](../research/clawd-on-desk.md) (ideias gerais de estados, proporção e pacotes; sem copiar arte ou código) e [pesquisa QwenPaw](../research/qwenpaw.md) (mapa de eventos para estados). As imagens finais e o código dos personagens permanecem originais, sem copiar arte nem incluir logos, símbolos ou mascotes oficiais.

**L1.4a — imagens de referência, sem código do app:**

- [x] Gerar lineup dos sete personagens, uma prancha por personagem com quatro estados obrigatórios e quatro desejáveis, teste de 22 px, versões transparentes e `README.md` em pt-BR em `windows/design/personagens/`.
- [x] O proprietário aprovou visualmente a lineup e as pranchas estáticas em 2026-11-13; o estudo isolado de marca do Claude não foi aprovado para o app.

**L1.4b — protótipo sprite × Canvas:**

- [x] Protótipo Codex isolado e documentação comparativa integrados à `main`.
- [x] O proprietário escolheu Canvas com base na revisão técnica em 2026-11-13.
- [ ] CPU e memória total de Tauri, delta do instalador e comparação em runtime seguem sem medição; consultar `windows/design/personagens/prototipo/comparacao.md`.

**L1.4d — implementação Canvas, fora deste bloco de itens parqueados:**

- [x] d1 (base da família e Codex em 11 estados) tem implementação e testes sintéticos concluídos; o proprietário aprovou a subetapa em 2026-11-13.
- [x] d2 (outros seis personagens nos 11 estados e reforço dos símbolos/expressões) tem implementação, testes sintéticos e aprovação visual do proprietário concluídos em 2026-11-13.
- [x] d3 (animações P1) tem implementação e testes sintéticos concluídos; aguarda revisão visual do proprietário antes de iniciar d4.
- [ ] d4 (animações P2) aguarda aprovação de d3.

**Histórico do escopo anterior enquanto o estudo estava parqueado:** a proposta inicial era gerar imagens de um agente nos quatro estados `idle`, `thinking`, `working` e `sleeping`; a L1.4a ampliou as referências para sete agentes e oito estados visuais.

Checkpoint atual: a seleção do Canvas e os aceites visuais de d1 e d2 estão registrados; d3 aguarda revisão visual antes de d4. Nada aqui fecha o aceite real da L1.4.

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
