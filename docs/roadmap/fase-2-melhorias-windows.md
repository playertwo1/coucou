> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase 2 — Melhorias próprias do Windows

Cada item segue a sequência: descoberta do código atual → mini-spec/aceite → testes da lógica → implementação → teste manual → checkpoint. As referências a arquivos abaixo são pontos de entrada; registrar no mini-spec os arquivos exatos depois da descoberta.

### 2.1 — Notificações nativas com Permitir/Negar (M)

**Estado atual (2026-11-12): APROVADO PARA AVALIAÇÃO.** Por decisão explícita do proprietário nesta conversa, os testes sintéticos de 2.1a e 2.1b valem para avançar e publicar uma versão de avaliação mesmo com o callback da Shell de 2.1a ainda sem prova. Uma ação Allow abre o cartão completo; Deny decide somente o pedido vinculado. O usuário fará a validação real após atualizar. A aceitação real segue pendente; tela cheia continua na 2.2.

**Descoberta (2026-11-12):** fluxo de pedidos mapeado em `island/hooks.ts` → `core/bridge.ts` → `lib.rs` → `pipe.rs`; há fila de cinco, reconhecimento em 800 ms e espera por decisão de 108 s. Não foi encontrado backend de toast no app. O crate `windows` já existe; identidade e ativação de botões no dev/NSIS/MSI precisam de prova nativa. Proposta em `docs/superpowers/specs/2026-11-12-native-permission-notifications-design.md` e plano em `docs/superpowers/plans/2026-11-12-native-permission-notifications-plan.md`, ainda sem aprovação. Divisão proposta: 2.1a viabilidade, 2.1b integração, 2.1c validação. Nenhum código ou checkpoint concluído; checkout permanece com as alterações locais da 1.6. Tela cheia depende da descoberta da 2.2 e continua pendente.

**Aprovação (2026-11-12):** proprietário aprovou a mini-spec nesta conversa. Prova nativa 2.1a ainda não iniciada: `git status` continua com as alterações locais preservadas; upstream contido (`0 35` após fetch). A aprovação da interação não remove a exigência de checkout limpo para código novo. Nenhum checkpoint fechado.

- [x] Mapear o fluxo atual de pedidos de permissão em `windows/src/island/hooks.ts`, os comandos de aprovação em `windows/src-tauri/` e a API nativa do Windows disponível no app. Mapeamento na spec; viabilidade dos callbacks ainda pendente.
- [x] Definir no mini-spec quando usar toast (ilha escondida/tela cheia), conteúdo permitido e prazo de expiração. Spec aprovada em 2026-11-12; integração com tela cheia explicitamente adiada até a 2.2.
- [x] Escrever testes sintéticos de roteamento: Allow abre o cartão para revisão; Deny, fechar/ignorar e timeout.
- [x] Implementar ações de toast ligadas ao mesmo pedido pendente da ilha.
- [x] Confirmar sinteticamente que nenhum caminho aprova sem clique e que timeout mantém o fallback do terminal.
- [x] Testar sinteticamente ilha visível/oculta, duas solicitações e notificação expirada; tela cheia segue para 2.2.
- Checkpoint: clique explícito decide o pedido correspondente; nenhum toast atrasado decide pedido de outra sessão.

**Prova 2.1a (2026-11-12): parcial —** proprietário autorizou exceção pontual ao checkout limpo somente para essa prova, preservando trabalho local e sem commit. Criado executável separado em `windows/probes/permission-toast`, sem ligação com IPC/permissões reais ou alteração do manifesto do app. Usa o crate `windows` já disponível, identidade e atalho próprios, removidos na saída. No Windows 11 Pro build 26300, `Setting` retornou `0x80070490`, mas `Show` retornou sucesso e houve `Dismissed(TimedOut)`. Em 90 s nenhum clique chegou ao callback; espera terminou sem decisão. Não há confirmação visual nem prova de Permitir/Negar/corpo, expiração nativa, evento de falha ou NSIS/MSI. Remoção do toast retornou sucesso; chave e atalho estavam ausentes depois da saída. Dois testes Rust da prova, `npm test` (614), `npm run build` (inclui TypeScript) e `node scripts/gen-strings.mjs --check` passaram. O teste de i18n passou a incluir as fontes da prova, cobrindo seus textos nas 13 línguas. Detalhes e comandos no README da prova. 2.1a e checkpoint 2.1 continuam abertos; não iniciar 2.1b.

**Retorno do proprietário (2026-11-12): FAIL —** a notificação sintética não apareceu. O sucesso de `Show` e `Dismissed(TimedOut)` não comprovaram entrega. Na inspeção, o caminho usado para Programs corresponde à pasta conhecida do Windows e o executável rodou na mesma sessão interativa do Explorer. Não foi encontrada a propriedade opcional `ToastEnabled`; sua ausência não prova bloqueio nem liberação. Identidade/ativação e eventual supressão continuam em diagnóstico, sem alterar configurações do Windows. A prova passa a interromper se `Setting` retornar erro, evitando repetir um teste visual com identidade não reconhecida. 2.1a segue aberta.

**Segundo reteste (2026-11-12): FAIL —** `SHQueryUserNotificationState=5` (aceita notificações), `Setting=0` (habilitada) e `Show` com sucesso, mas o proprietário novamente confirmou ausência visual. Eventos 2416/2418/3052/3153 registram recepção e encaminhamento à sessão 1, não apresentação na tela. Causa inconclusiva; o erro inicial de identidade não explica sozinho o problema. Processo terminou com código 1 sem registrar limpeza; artefatos próprios foram removidos após validar destino/identidade, e remoção do histórico retornou sucesso. Dois testes Rust da prova e `git diff --check` passaram. Nenhuma integração ou checkpoint fechado.

**Confirmação visual posterior (2026-11-12):** na retentativa com o Coucou instalado 0.6.2 aberto, o proprietário viu o toast e clicou em Permitir. Exibição confirmada; callback ainda não comprovado, pois o processo terminou por timeout. A prova isolada agora implementa ativador COM Win32 próprio e temporário, sem vínculo com permissões reais. Três testes Rust passaram, incluindo a interface COM e rejeição de identidade/pedido inválidos. O teste direto da interface não comprova entrega de clique pela Shell; nova repetição nativa em validação. 2.1a continua aberta.

**Ambiente exclusivamente sintético (2026-11-12):** a pedido do proprietário, criada versão desktop separada em `windows/synthetic`, sem backend de produção ou IPC nativo e com perfil WebView novo por execução. Interface/card existentes, projeto Jardim, sessão e pedidos inventados; clipboard em memória, arquivos externos e conexões da página bloqueados. Cliques automatizados em Permitir/Negar registraram somente decisões sintéticas; reiniciar zerou os dados. Perfil separado confirmado no processo WebView filho. Typecheck/build sintético, `npm test` (618), verificação de traduções e dois testes Rust do host passaram. Executável `windows/target/synthetic-host/debug/coucou-synthetic.exe`; comando `npm run synthetic` em `windows/`. Próximos testes devem usar somente essa variante, sem dados ou contas reais. Notificação nativa ainda não conectada a ela; 2.1a e checkpoint permanecem abertos.

**Reteste nativo com dados sintéticos (2026-11-12): INCONCLUSIVO —** os quatro testes Rust passaram. No Windows 11 Pro build 26300, a prova isolada retornou `SHQueryUserNotificationState=5`, `Setting=0` e sucesso em `Show`, mas aguardou 90 s e terminou sem ativação. O Agent Desktop não conseguiu abrir a Central de Notificações nem trazer a janela Coucou ao primeiro plano; nenhum clique foi feito. Esta execução não prova falha nem sucesso do callback da Shell. Limpeza verificada: processo, identidade AUMID, CLSID COM e atalho ausentes. 2.1a continua aberta e 2.1b bloqueada.

**Decisão do proprietário (2026-11-12):** aprovação fora da ordem autorizada para 2.1b com evidência sintética e publicação de avaliação. 2.1a callback e clique nativos permanecem sem comprovação; não marcar aceite real como concluído.

- [x] Modelo sintético 2.1b: pedidos independentes, expiração, fechamento sem decisão, ação repetida, ID antigo e reinício.
- [x] Integração de avaliação: toast só para permissão aceita com a ilha oculta; Allow abre o cartão para revisão, Deny responde pelo pipe, identidade/atalho em NSIS/MSI.
- [x] Checkpoint sintético 2.1b aprovado pelo proprietário para avaliação.
- [ ] Validação real do proprietário: toast visível, Allow abrindo o cartão certo, Deny negando só o pedido certo, fechamento/expiração sem decisão, pedidos simultâneos e atualização NSIS/MSI.
- Checkpoint real 2.1: em avaliação; callback da Shell ainda não comprovado. A 2.2 segue com prova sintética e avaliação Windows separada.

**Versão de avaliação 0.6.5 (2026-11-12):** publicada em [Windows 0.6.5](https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.5). A tag `windows-v0.6.5` aponta para `bb6d48f907e73be91ed26c2844ab808ceb827604`. O preflight do branch (`43346487966`) passou; o workflow manual no tag (`43348587966`) concluiu com sucesso e publicou a release e os dois instaladores. O push da tag não iniciou o workflow automaticamente, então ele foi executado manualmente no próprio tag.

**Verificação dos instaladores 0.6.5:** os assets finais foram baixados, seus SHA-256 conferiram com os digests publicados pelo GitHub e os dois arquivos exatos passaram por exame personalizado do Microsoft Defender (evento 1001, exame `{9AD2DD74-E9E4-4DCE-8E77-D2954870AA9F}`, 2026-11-12 23:10, zero eventos de detecção). Ambos não têm assinatura digital, como esperado. Setup `Coucou-Windows-0.6.5-setup.exe` (12.149.586 bytes): `baf5092fdfaf1b7034a2a31a4d7184f782dd00b8dfba7aace870a09586ac05e9`. MSI `Coucou-Windows-0.6.5.msi` (15.749.120 bytes): `2f062e8c430e9a63f9882a3d17ce7d0b8eb86b240b7289e21cd2e6cd5c2c61d1`.

**Verificações sintéticas e build:** `npm test` (632 aprovados), `cargo test --offline --locked --workspace` (637 testes do app e 36 do hook relay aprovados; 7 ignorados), `npm run build`, `npm run synthetic:build`, verificação de strings/What's New e `npm audit --audit-level=high` (zero vulnerabilidades) passaram.

O callback de clique da Shell e o comportamento real da notificação continuam pendentes de validação pelo proprietário; a publicação é avaliação e não aceite de runtime. Próximo desenvolvimento: 2.2.

### 2.2 — Modo jogo/tela cheia (P)

- [x] Mapear geometria de janelas e monitores e o ciclo de visibilidade da ilha. Não havia detector de tela cheia no app.
- [x] Definir em [mini-spec](../superpowers/specs/2026-11-12-synthetic-fullscreen-design.md) a detecção geométrica do primeiro plano no monitor da ilha, o tratamento de permissão/pergunta pendente e os limites para modo exclusivo.
- [x] Escrever testes com monitores/janelas fictícios para retângulos inválidos, origem negativa, janela excluída/minimizada, pedido pendente e restauração.
- [x] Implementar detecção Windows e ocultação/reaparecimento da janela nativa sem alterar posição ou preferências salvas.
- [ ] Testar jogo ou vídeo real, Alt+Tab, trocar monitor e encerrar processo em tela cheia.
- Checkpoint sintético: PASS; aceite de runtime pelo proprietário pendente. A detecção considera janela em primeiro plano cobrindo por completo o monitor da ilha; modo exclusivo não é inferido.

**Verificação sintética (2026-11-13):** três testes Rust de geometria/política, 16 testes da variante sintética, `npm test` (638/638), `cargo test --offline --locked --lib` (640 passaram, 7 ignorados), `npm run build`, `npm run synthetic:build`, `npx tsc --noEmit`, `node scripts/gen-strings.mjs --check` e `git diff --check` passaram. O app esconde a janela nativa e a mostra enquanto há permissão/pergunta pendente; os testes usaram apenas fixtures. Não houve teste manual de jogo, vídeo, Alt+Tab nem hardware multi-monitor.

**Versão de avaliação 0.6.6 (2026-11-13):** publicada em [Windows 0.6.6](https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.6), tag no commit `3791e68213875c718e06989a29406c03a52d00e6`. O preflight do branch (`43358819580`) e o workflow manual no tag (`43360619914`) passaram; a release foi publicada e `windows-latest` atualizado.

**Verificação dos instaladores 0.6.6:** baixei os assets finais e conferi os SHA-256 com os digests do GitHub. O Microsoft Defender examinou o diretório exato que continha somente esses dois arquivos: exame personalizado `{701433C6-30AC-49E6-A16E-7DD805310301}`, concluído em 2026-11-13 01:09, sem evento de detecção 1116. Setup `Coucou-Windows-0.6.6-setup.exe` (12.151.033 bytes): `73168be43220e227b51655cc028ea581e7bb6e268c91e2c0dc16ce7c48238e36`. MSI `Coucou-Windows-0.6.6.msi` (15.753.216 bytes): `41cf1dda5cc37bc4b9e06abd2c721e5c65d07a350776f38780cc1f0b47d8848a`.

Jogo/vídeo real, Alt+Tab e troca física de monitor continuam pendentes para o proprietário após atualizar. A detecção geométrica não prova modo exclusivo.

### 2.3 — Custo e tokens por sessão (M; depende da paridade de agentes)

- [x] Depois da Etapa 2B.6, inventariar a fonte local de uso para Claude, Codex, Antigravity e Hermes; fontes sem formato local documentado ficam explicitamente indisponíveis.
- [x] Definir no [mini-spec](../superpowers/specs/2026-11-13-windows-agent-usage-design.md) unidades/custos confiáveis, períodos e agrupamento; preço ausente não é estimado.
- [x] Criar fixtures sintéticas e testes para JSONL truncado, modelo sem preço, sessão duplicada e projeto ausente.
- [x] Implementar leitura somente local do histórico Codex suportado, sem upload nem telemetria; os demais agentes continuam indisponíveis.
- [x] Testar soma por sessão/projeto/dia e estado “indisponível” quando faltar fonte confiável.
- Checkpoint sintético: PASS; totais reproduzíveis e dado desconhecido nunca aparece como zero confirmado. UI sintética conferida pelo Agent Desktop com registros inventados; app sintético encerrado após a inspeção.

**Verificação sintética (2026-11-13):** `npm test` (644 aprovados), `cargo test --offline --locked --workspace --quiet` (645 testes do app e 36 do relay aprovados; 8 ignorados), `npm run build`, `npm run synthetic:build`, build do host sintético, `node scripts/gen-strings.mjs --check` e `git diff --check` passaram. A interface sintética exibiu os valores fictícios: 80/150 tokens por dia, Jardim/Oficina por projeto e custo indisponível. O leitor limita arquivos e bytes, ignora symlinks e conteúdo de prompts, deduplica eventos/sessões e marca histórico incompleto.

**Limites:** somente o formato local documentado do Codex é lido; Claude, Antigravity e Hermes aparecem como indisponíveis. Custos ficam indisponíveis porque tokens/modelo não comprovam valor faturado. A validação com o histórico real do proprietário fica pendente após atualizar.

**Versão sintética de avaliação 0.6.8 (2026-11-13):** publicada em [Windows 0.6.8](https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.8), tag no commit `067f007538999bf7f3b448375bf31b3b98521a83`. O preflight (`43373366547`) e o workflow do tag (`43374598888`) passaram; `windows-latest` foi atualizado.

**Instaladores 0.6.8:** os assets finais foram baixados e os SHA-256 conferiram com os digests do GitHub. Exame personalizado do Microsoft Defender no diretório contendo somente os dois instaladores terminou em 2026-11-13 03:02 (evento 1001, `{A96B58EF-6ED6-49F0-A5D6-8AE03BC8C8C9}`), sem detecção 1116. Setup (12.179.178 bytes): `f6d0805b9581a26f7ab307b8a816aa445c56847b950e954e3f02bc25baa93c8b`. MSI (15.794.176 bytes): `0f54a2efcafd4d41ff98dab7a72f0765b807ec33a96efcac81bb5e4a0ba45dc5`.

### 2.4 — Pílula do Git (P)

- [x] Localizar a pasta do projeto da última sessão de workspace em foco e confirmar que `integration_git` é um ID novo.
- [x] Definir em [mini-spec](../superpowers/specs/2026-11-12-git-pill-design.md) branch, arquivos alterados, ahead/behind, diff e estados sem repositório/sem upstream.
- [x] Fixar o ID estável `integration_git`, exclusivo do Windows.
- [x] Testar repositório limpo, arquivos modificados/criados, detached HEAD, sem upstream, contagens ahead/behind, diretório inválido e troca entre projetos de duas sessões.
- [x] Implementar leitura somente local com argumentos fixos; não executar fetch, pull, checkout, commit ou push.
- [x] Teste sintético da interface confirma que Details abre o cartão expandido, Refresh e View diff usam a pasta da sessão ativa e exibem o diff como texto; aplicação sintética mostrou `synthetic://Jardim`, 2 arquivos e ahead 1 / behind 0.
- [x] Verificações em 2026-11-12: `npm test` (624/624), `cargo test --lib` (633 passaram, 7 ignorados), 4 testes Rust do Git, validador What's New em 14 línguas, `node scripts/gen-strings.mjs --check`, `npm run build`, `npm run synthetic:build`, `git diff --check` e rustfmt do novo módulo.
- [x] Publicada em 2026-11-12: [Windows 0.6.4](https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.4); builds de preflight (`43316936877`) e do tag (`43320291969`) passaram, assim como a publicação de `windows-latest`.
- [x] Os hashes dos assets finais diferiram do preflight; baixei os dois instaladores publicados, confirmei os digests SHA-256 contra o GitHub e examinei os arquivos exatos com Microsoft Defender, sem detecções. Setup: `7df3c421a07fbbeabe6b852211eb4ce5ac00545883091bc881880ee2d51c06e9`; MSI: `5d0e36a723bce1ab4baeb3f1e794eabf30eee673859d64a66afe0dd3934d9931`.
- [ ] Validação real do proprietário: atualizar para Windows 0.6.4 e conferir projeto ativo, remoção do repositório e diff.
- Limites conhecidos: conteúdo de arquivos não rastreados não aparece no `git diff`; ahead/behind usa refs locais e pode ficar desatualizado sem fetch.
- Checkpoint sintético: PASS. Checkpoint real: aberto até a validação do proprietário; simulação não fecha o runtime.

### 2.5 — Focar a aba exata do Windows Terminal (M)

- [x] Descobrir identificadores de janela/tab/pane disponíveis para a sessão e APIs suportadas pela versão instalada do Windows Terminal.
- [x] Definir fallback: se não houver identificação inequívoca, focar a janela do Terminal como hoje e não uma aba arbitrária.
- [x] Testar duas abas com o mesmo título, painel dividido, sessão encerrada e Terminal ausente.
- [x] Implementar foco pela identidade da sessão; nunca executar texto/comando como efeito de foco.
- Checkpoint sintético: PASS; aceite de runtime pelo proprietário pendente.

**Verificação sintética (2026-11-13):** mini-spec em [Windows Terminal tab focus](../superpowers/specs/2026-11-13-windows-terminal-tab-focus-design.md). A seleção usa nomes UI Automation de `TabItem`, reavalia a ordem em cada solicitação e só seleciona uma correspondência única com o nome da pasta. Títulos duplicados, ausência de correspondência, UIA indisponível, sessão encerrada ou Terminal ausente mantêm o fallback de foco da janela; arrastar arquivos em uma aba ambígua copia os caminhos sem colá-los em uma aba incerta. Não lê o buffer nem executa texto/comandos.

O Windows Terminal sintético apresentou duas abas `Synthetic Duplicate` com o mesmo título e recusou a seleção ambígua; outra instância sintética apresentou uma aba `Synthetic Split` com dois painéis, sem tratar painel como aba extra. Os processos sintéticos foram encerrados. `npm test` (644), `cargo test --offline --locked --workspace --quiet` (647 testes do app e 36 do relay aprovados; 8 ignorados), `npm run build`, `npm run synthetic:build`, build do host sintético, verificação das traduções/What's New em 14 idiomas e `git diff --check` passaram.

**Limites:** esta comprovação usa títulos e sessões inventados. O foco da aba de sessões reais e o comportamento em uma instalação do proprietário ainda aguardam avaliação após atualizar.

**Versão sintética de avaliação 0.6.9 (2026-11-13):** publicada em [Windows 0.6.9](https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.9), tag no commit `856a82d64fe39b39e1d1647c7f4241f2ef9b5074`. O preflight (`43378038467`) e o workflow manual do tag (`43379679895`) passaram; `windows-latest` foi atualizado.

**Instaladores 0.6.9:** os assets finais foram baixados e seus SHA-256 conferiram com os digests do GitHub. Exame personalizado do Microsoft Defender no diretório contendo somente os dois instaladores terminou em 2026-11-13 03:49 (evento 1001, `{A9243818-AD1B-4C0E-A080-58EC20391DDD}`), sem evento de detecção 1116. Setup (12.183.969 bytes): `df18d9087b9d8e9c67fe55a94527e2a53f6ec2dc5718f2eb50c5a370a4c4f4c2`. MSI (15.794.176 bytes): `824a5b868019e018eab4b1e4ab3ad37e14f330df1d27015becb6b26b8254b02d`.

### 2.6 — Histórico e busca de sessões (M)

- [x] Inventariar os registros locais documentados do Codex, retenção e campos seguros; limitar leitura aos limites existentes do parser e não indexar prompts, respostas ou ferramentas.
- [x] Definir em [mini-spec](../superpowers/specs/2026-11-13-windows-session-history-design.md) busca local por projeto/agente/data, sem segundo índice persistido nem exclusão de arquivos do Codex; remoção feita pelo Codex desaparece na leitura seguinte.
- [x] Criar testes com fonte ausente, JSONL incompleto, sessão duplicada, identificador inválido e consulta sem resultado.
- [x] Implementar busca em metadados Codex e abertura explícita pela CLI com argumentos separados, cwd verificado e falha fechada sem CLI/metadados válidos.
- [x] Conferir que a busca é somente leitura e que a ação da interface chama a fixture de abertura sem iniciar uma sessão real.
- Checkpoint sintético: PASS; nenhuma telemetria, prompt, resposta, caminho ou arquivo de sessão exposto na interface/logs.

**Verificação sintética (2026-11-13):** `npm test` (646 aprovados), `cargo test --offline --locked --workspace --quiet` (649 testes do app e 36 do hook relay aprovados; 8 ignorados), `npm run build`, `npm run synthetic:build`, build do host sintético, `node scripts/gen-strings.mjs --check`, `python scripts/test-whats-new.py` e `git diff --check` passaram. No Agent Desktop, a variante sintética exibiu as sessões inventadas Jardim/Oficina; as buscas por “Jardim” e “Oficina” deixaram apenas a sessão correspondente, e os botões de abertura sintéticos apareceram. O callback sintético aceita somente IDs de fixture; nenhum processo Codex foi iniciado.

**Limites:** só o layout local documentado do Codex é suportado; não há indexação de conteúdo de conversa. A confirmação com sessões reais e a abertura de uma sessão pelo proprietário ficam pendentes após atualizar.
**Versão sintética de avaliação 0.6.10 (2026-11-13):** publicada em [Windows 0.6.10](https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.10), tag no commit `7ac0ad2451a8caeceab7b2216d14d712f2e7d2fb`. O preflight (`43382716887`) e o workflow manual do tag (`43383864762`) passaram; `windows-latest` foi atualizado.

**Instaladores 0.6.10:** baixei os dois assets finais; tamanho e SHA-256 conferem com os digests do GitHub. Exame personalizado do Microsoft Defender no diretório contendo somente os dois instaladores terminou em 2026-11-13 04:40 (evento 1001, `{C83FE64B-7FD6-42A2-945C-E3128B931EA2}`), sem detecção 1116. Setup (12.189.239 bytes): `396d880aa0a809dd100255430e12a316ea00643a712c411c644e8fedfceffab8`. MSI (15.806.464 bytes): `4b22633a2b5b194674f4767cd148fd71e181a8748db1d39b4eac2687a7953bb6`.


### 2.7 — Lançador rápido (P; depende da Etapa 2B.6)

- [x] Reutilizar Nova sessão e o seletor compartilhado de agente/projeto da Etapa 2B.6; não criar um lançador separado.
- [x] Registrar no [mini-spec](../superpowers/specs/2026-11-13-windows-quick-launcher-design.md) `Ctrl+Alt+L`, foco inicial, projeto/agente, ditado e início explícito.
- [x] Testar aspas, `;`, `&`, Unicode e quebra de linha; o prompt chega intacto como argumento, sem interpolação de shell.
- [x] Testar CLI ausente/removida, pasta/projeto removido, cancelamento e retorno sem iniciar uma sessão.
- [x] Cobrir os quatro agentes e confirmar que a escolha fica visível no cartão.
- Checkpoint sintético: PASS; envio somente após ação explícita; permissão permanece independente.

**Verificação sintética (2026-11-13):** a suíte `npm test` passou com 649 testes após incluir cobertura do atalho, envio fictício, agentes, prompt e pasta removida. `npx tsc --noEmit`, `node scripts/gen-strings.mjs --check`, `npm run build`, `npm run synthetic:build`, build do host sintético, `python scripts/test-whats-new.py` e `git diff --check` passaram. O Agent Desktop abriu o cartão via evento sintético `newSession`, mostrou Codex e o projeto `Coucou`, aceitou `synthetic "quote"; & á你好` e acionou o botão de fixture. A interface mostrou “Modo sintético: nenhum processo de agente será iniciado”; a lista de processos não mostrou CLI filho.

**Limites:** o teste de teclado nativo `Ctrl+Alt+L` não foi enviado pela automação porque o Agent Desktop headless não confirmou foco da janela; o teste automatizado verifica o mapeamento e o roteamento do atalho, e o harness abriu o mesmo cartão. Ditado e CLIs instaladas não foram exercitados com dispositivos/contas reais. Aceite real do proprietário permanece pendente.

**Versão sintética de avaliação 0.6.11 (2026-11-13):** publicada em [Windows 0.6.11](https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.11), tag no commit `9bbf5cdfbb77888ca1439acaf1d015e3f87950c2`. O preflight (`43390352040`) e o workflow do tag (`43391881054`) passaram; `windows-latest` foi atualizado.

**Instaladores finais 0.6.11:** baixados da release e conferidos com os digests SHA-256 do GitHub. O exame personalizado do Microsoft Defender no diretório contendo somente os dois instaladores terminou em 2026-11-13 05:30 (evento 1001, `{B0975DC9-3D62-499E-9A9F-E8A7AA47D479}`), sem evento 1116. Setup (12.191.583 bytes): `e0c6d17f77d31b44c2ecd8b57f1a53793bcc81d141f12eed29758b8c6ccc727b`. MSI (15.806.464 bytes): `3c6bc710dde8f195774c470cd0ed48238c30e60016797a0e83d056f217e45033`.

### 2.8 — Vigia de testes/builds (M)

#### 2.8a — Comandos locais

- [x] Observar somente `npm test` e `cargo build` em Bash, PowerShell e ferramentas de shell compatíveis; associar pelo diretório de trabalho e ID estável da chamada.
- [x] Testar execuções simultâneas, diretório fora do projeto principal, ausência de contexto, saída não zero, cancelamento e encerramento sem evento final.
- [x] Extrair somente o resultado mínimo do hook; não relançar nem alterar o comando e descartar logs/respostas.
- [x] Mostrar o resultado na pílula do agente e na pasta capturada na chamada; deduplicar conclusão e expirar chamadas pendentes antigas sem inventar resultado.
- Checkpoint sintético: PASS. Exit code zero é verde; falha fica vermelha; cancelamento e resultado desconhecido nunca aparecem como sucesso.

**Evidência sintética (2026-11-13):** a suíte cobre chamadas simultâneas em projetos diferentes com conclusão fora de ordem, execução fora da pasta principal, comando não suportado, falta de ID/pasta, sucesso, erro, cancelamento, forma de resultado desconhecida, duplicata e conclusão ausente após expiração. O hook Rust remove saída e erro antes do repasse e envia apenas o status numérico. O Agent Desktop confirmou na interface o resultado fictício `npm test · ✓ · Coucou` e o aviso “Somente dados sintéticos”; o executável sintético foi encerrado após a verificação.

**Verificações sintéticas (2026-11-13):** `npm test` passou (656/656); `cargo test --offline --locked -p coucou-hook` passou (37/37); `npx tsc --noEmit`, `node scripts/gen-strings.mjs --check`, `python scripts/test-whats-new.py`, `npm run build`, `npm run synthetic:build`, build do host sintético e `git diff --check` passaram.

**Limites:** a observação depende dos hooks dos agentes suportados e não rastreia processos arbitrários de terminal. Sem ID estável, pasta ou evento final, não é possível atribuir um resultado; chamada sem conclusão expira sem estado final. O status real dos hooks e a experiência do proprietário aguardam avaliação na versão 0.6.12.

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
- [x] Manual pendente: Connect em uma CLI desconectada conclui o login e o estado vira "Conectado" ao reabrir Settings.
- Checkpoint 2.11: nenhum arquivo de agente gravado sem diff + clique; nenhum token exibido ou registrado.
- Status (2026-11-10): PASS relatado pelo proprietário ("todas já feitas"); sem detalhes de versão, cenários ou logs — evidência do checkpoint não registrada.
