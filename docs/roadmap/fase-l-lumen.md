> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase L — Lumen + Segunda Mente

Origem: decisões D-050 a D-055 do projeto Segunda Mente (`playertwo1/segundamente-app`, `docs/DECISIONS.md`). As perguntas e respostas completas estão em `docs/questionario/2026-11-13-lumen-desktop-e-todo.md` daquele repositório. Elas mandam sobre esta fase.

Objetivo: este fork vira o **Lumen**, o lado desktop da Segunda Mente. É um produto só com o app Android: as mesmas tarefas, notas, personas e conversas, trocadas pelo sync. O Flutter fica só no celular.

Depende de: nada para L0 e L1. As outras etapas dependem do que está indicado em cada uma.

Regras específicas desta fase, além das do índice:
- **Idioma:** o Lumen é só em pt-BR (D-053.7). Frases novas desta fase vão só em português. A regra das 13 línguas não vale aqui, e as traduções que vieram do upstream ficam como estão.
- **Conteúdo do trabalho:** entra só a agenda, as tarefas e as ideias do dono. Dados de clientes, contas, valores ou documentos internos do trabalho não entram. O e-mail é só a conta pessoal.
- **Nada é enviado sozinho:** e-mail, mensagem ou evento com convidados.
- **A IA propõe e o dono confirma:** tarefa ou data ambígua nunca é gravada sem confirmação.

### L0 — Fechar o que está quase pronto (P)
- [x] L0.1 Levantar, nas fases 0, 1 e 2, o que só falta validar manualmente ou está a uma etapa do fim. Fechar só isso.
- [x] L0.2 Marcar o resto das fases 0/1/2 e as fases 2B e 2C como **pausadas (D-053)**, sem apagar nada.
- [x] Checkpoint L0: a lista do que foi fechado e do que foi pausado está registrada neste arquivo.

**Registro L0 (2026-11-13): concluída.** Nenhum checkpoint incompleto foi promovido sem cumprir sua evidência. Permanecem fechados com evidência registrada: Fase 0.4 (permitir, negar, sem clique e foco do terminal) e Fase 1.2 (rascunho Outlook com arquivo sintético, sem envio). Fase 0.5a segue N/A por decisão do proprietário; 1.3 e 1.4 seguem descartadas. Os resultados sintéticos já registrados nas etapas 2.1b–2.8a continuam aprovados apenas no escopo sintético.

| Fase | O que falta para fechar | Estado após L0 |
|---|---|---|
| 0 | 0.1–0.3, 0.10, 0.13 e 0.14 têm PASS relatado pelo proprietário, mas faltam versão/cenários/resultados exigidos no registro; 0.6 tem relato de reinício bem-sucedido, sem contagem de instâncias. 0.5b–c, 0.7–0.9, 0.11–0.12 e 0.15 ainda precisam das observações reais descritas em cada checkpoint; 0.11 também depende de hardware de dois monitores. | **Pausada (D-053)**; 0.4 permanece fechado e 0.5a N/A. Nenhum outro checkpoint foi fechado nesta L0. |
| 1 | 1.1 precisa do arraste real nos alvos listados; 1.5 precisa completar navegador/outro app/sem alvo; 1.6 continua com falha e correção parcial, sem prova do ciclo completo; 1.7 tem provas sintéticas e do ciclo de 3 s, mas faltam conferência visual real no app, hover físico, bateria abaixo de 20% e outras leituras reais. A renderização visual sintética de 1.7b/1.7d já está registrada. | **Pausada (D-053)**; 1.2 permanece fechado; 1.3 e 1.4 permanecem descartadas. |
| 2 | 2.1a ainda não comprovou o callback nativo; 2.1b–2.7 têm checkpoints sintéticos e versões de avaliação publicadas, mas falta o aceite real do proprietário. 2.8a tem PASS sintético, mas 0.6.12 não tem release publicada; a tag existe e o preflight `43402455643` foi cancelado, sem varredura dos assets finais. 2.8b não começou, 2.9 não começou, 2.10 depende de dois monitores e 2.11 não tem evidência manual detalhada. | **Pausada (D-053)**; nenhum aceite real foi inferido da publicação ou dos testes sintéticos. |
| 2B e 2C | As etapas e dependências ainda abertas permanecem documentadas nos próprios arquivos. | **Pausadas (D-053)**; conteúdo e checklists preservados. |

Os relatos gerais do proprietário nas fases 0 e 2 ficam registrados como relatos, mas não fecham checkpoints cujo critério exige resultados por cenário. A reabertura das fases pausadas depende de nova decisão do proprietário.

### L1 — Renomear para Lumen (M; inclui a Fase 3, identidade)
- [x] L1.1 Protótipo de 3 opções originais de personagem, ícone e paleta sonora apresentado ao proprietário em 2026-11-13; escolha B registrada em 2026-11-13. Nada de Mochi nem dos assets do Coucou (`LICENSE-ASSETS.md`).
  - **A — Farol facetado:** companheiro-prisma assimétrico; ícone com três feixes; azul-noite, ciano e âmbar. Paleta: toque de vidro em duas notas para aviso, duas notas ascendentes para confirmação e nota grave suave para recusa/cancelamento.
  - **B — Bússola de papel:** guia de quatro faces dobradas ao redor de um ponto; ícone de rosa-dos-ventos; índigo, areia e terracota. Paleta: toque seco de madeira para aviso, três notas de marimba ascendentes para confirmação e duas notas descendentes abafadas para recusa/cancelamento.
  - **C — Broto-guia:** ramo geométrico com duas folhas e raiz luminosa; ícone de folhas sobre um caminho; grafite, creme e lima. Paleta: sopro curto com uma nota dedilhada para aviso, duas notas dedilhadas e uma nota alta para confirmação e toque grave com cauda de ar para recusa/cancelamento.
  - Prancha visual comparativa gerada nesta sessão e apresentada ao proprietário. Com B escolhida, a paleta sonora é sintetizada pelo Web Audio; nenhum arquivo de áudio externo é distribuído.
- **Decisão B do proprietário:** Bússola de papel; paleta índigo, areia e terracota; sons sintetizados em tempo de execução. O desenho do personagem e do ícone é original e não inclui assets do Coucou/Mochi.
- [x] L1.2 Nome `Lumen`, `identifier` `app.segundamente.lumen` e `mainBinaryName` `lumen`; plano de migração registrado em `docs/superpowers/specs/2026-11-13-lumen-identidade-migracao.md` e `docs/superpowers/plans/2026-11-13-lumen-identidade-migracao.md`.
  - As pastas `%APPDATA%\\Coucou` e `%LOCALAPPDATA%\\Coucou`, o caminho do hook `bin\\coucou-hook.exe`, AUMID/CLSID de notificações e o serviço do Credential Manager ficam estáveis para preservar settings, hooks e permissões. O UpgradeCode MSI continua igual; NSIS instala Lumen ao lado do Coucou, sem remover a instalação antiga. O atualizador passa a usar assets `Lumen-Windows-*` de `playertwo1/coucou` e leva releases antigas à página de releases.
- [x] L1.3 Teste sintético de upgrade MSI/NSIS: CI Windows `43424866776` e CI da release `43428181413` passaram no build/empacotamento e instalaram sobre o Coucou 0.6.11 com marcadores sintéticos, confirmando preservação dos dados; também confirmaram instalação NSIS lado a lado. A release `windows-v0.6.13` foi publicada. Microsoft Defender examinou os artefatos de preflight e os instaladores finais, sem detecções (assinaturas `1.463.281.0`, eventos 1001). Nenhum teste foi executado no perfil real do proprietário.
- **Registro histórico — decisão do proprietário (2026-11-13, posteriormente substituída):** manter os personagens atuais do Coucou sem alterações; a Bússola Lumen fica somente como ícone do aplicativo. A L1.4 de personagens por agente foi cancelada. Não gerar imagens nem sprites e não alterar os personagens.
- **Registro histórico — L1.4 cancelada antes da reabertura:** naquele momento, o plano original abaixo foi substituído pela decisão de cancelamento e ficou suspenso; a decisão foi revogada em 2026-11-13, conforme o registro atual.
  - Imagens de referência para Claude Code, Codex, ChatGPT, Antigravity, Gemini CLI, OpenCode e agente genérico, com estados e teste a 22 px.
  - Protótipo comparativo de sprite e Canvas a 22 px e 96 px, carga ociosa, memória e tamanho do instalador.
  - Escolha do proprietário sobre o renderer e implementação da alternativa.
  - O plano anterior propunha aprovação real; a L1.4 reaberta define subetapas e não fecha o aceite visual nem real sem evidência.
- **Decisão atual do proprietário (2026-11-13):** sem autorização escrita para usar o Mochi, os personagens serão originais do Lumen; a Bússola continua somente como ícone do aplicativo.
- [x] **L1.4a — Imagens de referência, sem código do app.** Foram gerados sete personagens originais (Claude Code, Codex, ChatGPT, Antigravity, Gemini CLI, OpenCode e genérico), com oito estados visuais por personagem, lineup de 96 px, teste em 22 px e versões com fundo transparente em `windows/design/personagens/`.
  - **Aceite visual do proprietário (2026-11-13):** “vamos seguuir entao com as 8” referia-se à lineup; o proprietário esclareceu “falei errado to falando a lineup, gostei deles das imagens que fez das animacoes etc”. O aceite cobre a lineup e as pranchas estáticas dos estados, não o comportamento animado nem a integração ao app.
- [x] **L1.4b — Protótipo Codex sprite × Canvas**, entregue fora da release e integrado à `main`. A comparação mantém lado a lado a referência aprovada e o desenho em Canvas nos oito estados e a 22/96 px. A página interativa e a prancha estão no repositório para conferência.
  - **Limites registrados:** CPU e memória total de Tauri, tamanho final do instalador e comparação de runtime não foram medidos. O relatório só afirma contagens estáticas e estimativas de pixels; a comparação não representa aceite de movimentos ou validação real.
- [x] **L1.4c — Escolha do renderer:** em 2026-11-13, com base na revisão técnica da L1.4b, o proprietário escolheu Canvas. Esta decisão autoriza o início da L1.4d; não declara aceite do código, da execução real nem do checkpoint L1.4.
- [ ] **L1.4d — Engine Canvas por agente**, em subetapas com um commit cada; ao fim de cada uma, apresentar a página de conferência e parar para avaliação do proprietário.
  - [x] **L1.4d-1 — Base da família e Codex:** implementação e testes sintéticos concluídos. Engine compatível, primitivas comuns, Codex em 11 estados e página de desenvolvimento com a matriz completa de 7 agentes × 11 estados em 22/96 px e DPR 1/1,5/2. Nesta subetapa, as seis artes restantes são referências PNG aprovadas; seus renderers Canvas ficam para d2.
    - [x] Revisão visual aprovada pelo proprietário em 2026-11-13. O aceite cobre somente a subetapa d1; não fecha o checkpoint real L1.4.
  - [x] **L1.4d-2 — Outros seis personagens nos 11 estados:** implementação em Canvas e testes sintéticos concluídos para Claude Code, ChatGPT, Antigravity, Gemini CLI, OpenCode e Genérico, mantendo o Codex aprovado de d1, mapeamento pelos IDs reais do código, fallback para Genérico, `searching` (lupa e varredura horizontal dos olhos), `ratelimit` (múltiplas gotas na cabeça, olhos caídos e boca ofegante; nunca dormindo), `dizzy` (olhos em espiral e balanço leve; nunca pergunta), destaques distintos nos estados (`thinking`, `searching`, `approval`, `question`, `error`, `finished`, `sleeping`) e matriz 7 × 11 em Canvas na página `l14d1-conferencia.html`.
    - [x] Revisão visual aprovada pelo proprietário em 2026-11-13. O aceite cobre somente a subetapa d2; não fecha o checkpoint real L1.4.
  - [x] **L1.4d-3 — Animações P1** implementadas em `windows/src/lumen/compass-engine.ts` (`working`, `thinking`, `searching`, `approval`, `ratelimit`, `sleeping`, `dizzy`, entradas de `finished`/`error`/`approval`/`question`/`dizzy`/`ratelimit`, curvas de `blink`/`squash`/`gulp`/`slap`/`greet`/`triggerEmote` e partículas móveis orientadas a `update(dt)` sem timers próprios, com retorno de `busy=false` em `idle` parado e respeito a `prefers-reduced-motion`) + controles dev de prévia P1 na página `l14d1-conferencia.html` e testes sintéticos verdes. Spec e plano: `docs/superpowers/specs/2026-11-13-l14d3-animacoes-p1.md` e `docs/superpowers/plans/2026-11-13-l14d3-animacoes-p1.md`.
    - [x] Revisão visual aprovada pelo proprietário em 2026-11-13. O aceite cobre somente a subetapa d3; não fecha o checkpoint real L1.4.
  - [x] **L1.4d-4 — Animações P2** implementadas em `windows/src/lumen/compass-engine.ts` (humor do PC `updateMood` reusando `mood.ts` incluindo pente horizontal de RAM para `PC Memória`, `working` com mini monitor e teclado, coreografia autônoma periódica de `isMini`, inércia secundária `physDx`/`physDy` e transição de `outfitPresence`, mantendo `busy=false` no repouso `CALM` e supressão sob `prefers-reduced-motion`) + prévia P2 na página `l14d1-conferencia.html` e testes sintéticos verdes. Spec e plano: `docs/superpowers/specs/2026-11-13-l14d4-animacoes-p2.md` e `docs/superpowers/plans/2026-11-13-l14d4-animacoes-p2.md`.
    - [x] Revisão visual aprovada pelo proprietário em 2026-11-14. O aceite cobre somente a subetapa d4; a validação real no app para fechar `L1.4d` e o checkpoint real `L1.4` continua aberta.
- [ ] Animações P3 ficam adiadas às fases correspondentes: nota ao salvar (L3), sino/adiar/check de tarefa (L4), carta ao resumir e sem sugerir envio (L5), estados distintos de salvo/sincronizado (L6), caixa guardada na nuvem durante backup (L7).
- **Avaliação real da 0.6.13 (2026-11-13):** o proprietário relatou que "aparece tudo" (nome, ícone e identidade visíveis após instalar). Sem resultado ainda: tipo de instalação usado (MSI ou NSIS), settings preservados, hooks, permissões (permitir, negar, sem clique) e atualizador.
- Checkpoint L1: identidade visual/sons originais e migração sintética passaram antes da publicação. Lumen 0.6.13 está publicada; cenários reais de migração continuam **em avaliação do proprietário**. A L1.4a e L1.4d-1/d-2/d-3/d-4 têm aceite visual explícito; Canvas foi escolhido na L1.4c. O checkpoint real L1.4, L1.3 ou L1 não está fechado.

### L2 — Login OAuth do ChatGPT no Lumen (M)
- [x] L2.1 Implementação sintética aprovada em 2026-11-13: autenticação oficial Sign in with ChatGPT para cliente local de código aberto, PKCE, callback em `127.0.0.1`, validação OIDC, contas separadas e credenciais no cofre do sistema. A chave OpenAI existente continua independente. `npx tsc --noEmit`, 659 testes Node, `npm run build`, 660 testes Rust (8 ignorados) e `python scripts/test-whats-new.py windows` passaram. Preflight Windows `43477378762` e workflow de release `43482202733` passaram, incluindo upgrade sintético MSI/NSIS; Microsoft Defender não detectou ameaças nos artefatos do preflight nem nos instaladores finais. A versão `windows-v0.6.14` foi publicada e seus hashes conferem com os digests do GitHub. Login com conta real permanece **NOT_RUN**, aguardando o proprietário. Spec e plano: `docs/superpowers/specs/2026-11-13-l2-chatgpt-oauth.md` e `docs/superpowers/plans/2026-11-13-l2-chatgpt-oauth.md`.
- [ ] (QwenPaw) Conferir conceitos de PKCE e callback em `providers/oauth/chatgpt.py`; não copiar armazenamento de tokens nem tratar esse código como contrato oficial. A confirmação de que não exige chave paga segue a documentação oficial SIWC para clientes locais de código aberto.
- [ ] L2.2 O chat usa esse login, sem chave de API paga obrigatória.
- Checkpoint L2: aberto até o proprietário validar login real no notebook. O uso do login pelo chat, com atualização de tokens, pertence à L2.2.

### L3 — Anotador de pensamentos e ideias (M)
- [ ] L3.1 O Notetaker deixa de ser gravador de reunião e passa a ser **anotador**: ditado ou captura rápida vira nota.
- [ ] L3.2 Comentários das personas com as mesmas regras do celular. Até o sync existir (L6), os comentários usam as personas importadas manualmente. (QwenPaw) Formato de referência para a persona importada: identidade e estilo, perfil do usuário e regras em partes separadas.
- Checkpoint L3: uma nota ditada gera um comentário de persona, sem duplicar.
- Animação P3 (adiada até a L3): quando uma ideia virar nota, o personagem escreve uma notinha com uma caneta.

### L4 — Tarefas no Lumen (M)
Depende de: F11-01 da Segunda Mente (modelo de tarefa fixado).
- [ ] L4.1 Lista única com Hoje, Próximas e Atrasadas, prioridade, subtarefas e busca.
- [ ] L4.2 Atalhos de dia e hora: Hoje, Amanhã, Daqui a 3 dias, Semana que vem; 9h, 14h, 20h; alerta de 20 min.
- [ ] L4.3 Captura por atalho ou ditado gera um cartão de confirmação.
- [ ] L4.4 Aviso do Windows com Adiar, Concluir e Abrir. (QwenPaw) Referência em Rust: `console/src-tauri/src/notification_delivery/windows.rs` (toast com AUMID e ativação COM). Manter o AUMID atual do app (L1.2).
- Checkpoint L4: a tarefa criada por voz avisa no horário certo no notebook.
- Animação P3 (adiada até a L4): um sino aparece no lembrete; ao adiar, o personagem empurra o sino; ao concluir, traça um check.

### L5 — E-mail pessoal (M)
- [ ] L5.1 MailCraft como e-mail principal, ligado pelo servidor MCP ou pelo canal de controle (`UCS-Care-Group/mailcraft`). Escopo: ler, resumir e preparar rascunho. Nunca enviar.
- [ ] L5.2 O Outlook clássico (`mail/`) fica como secundário.
- Checkpoint L5: o Lumen resume a caixa de entrada pessoal e prepara um rascunho sem enviar.
- Animação P3 (adiada até a L5): uma carta cai na mão ao resumir a caixa; a pose nunca sugere que algo foi enviado.

### L6 — Sync com a Segunda Mente (G)
Depende de: F12-01 da Segunda Mente (contrato de sync).
- [ ] L6.1 Caixa de correio persistente no relay (`relay/`, Worker com Durable Objects/SQLite): mensagem cifrada fica guardada até o outro lado buscar. Uso medido contra o plano Free.
- [ ] L6.2 Pareamento com a Segunda Mente Android pelo protocolo existente (`docs/ANDROID_LINK.md`, `docs/RELAY_LINK.md`), com revogação.
- [ ] L6.3 Outbox, aplicação idempotente e status "salvo neste PC" separado de "sincronizado".
- [ ] L6.4 Escopo: tarefas, notas, conversas e comentários, personas, preferências e memória resumida. Concluir ou adiar num aparelho cancela o aviso no outro. (QwenPaw) A memória resumida atualiza cada conclusão por uma de quatro ações (criar, corroborar, refinar, corrigir), em vez de acumular notas repetidas; o formato é fixado com a Segunda Mente no contrato F12-01.
- Checkpoint L6: com o celular desligado, a tarefa criada no PC chega ao celular uma vez quando ele reconecta, e o alarme dele toca.
- Animação P3 (adiada até a L6): duas bolinhas percorrem o trajeto de sync; poses diferentes distinguem “salvo neste PC” de “sincronizado”.

### L7 — Google no Lumen (M)
Depende de: F13-02 da Segunda Mente (login Google próprio).
- [ ] L7.1 Mesmo login Google do celular.
- [ ] L7.2 Backup semanal dos dados do Lumen no Drive, numa subpasta própria.
- [ ] L7.3 Google Calendar: ler eventos e criar evento a partir de tarefa confirmada.
- Checkpoint L7: o backup é restaurado e o evento é criado só com confirmação.
- Animação P3 (adiada até a L7): uma nuvenzinha guarda uma caixa durante o backup.

### Depois desta fase
O plano M0–M10 continua como **"Lumen assistente"**, com as mesmas regras M. O modo "mais ativo" (resumos, cobranças e sugestões) é a F14 da Segunda Mente e roda nos dois aparelhos. (QwenPaw) Referência para a F14: o heartbeat, que roda perguntas fixas por intervalo e só dentro de uma janela de horário ativo.
