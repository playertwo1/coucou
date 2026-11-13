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
- [ ] L0.1 Levantar, nas fases 0, 1 e 2, o que só falta validar manualmente ou está a uma etapa do fim. Fechar só isso.
- [ ] L0.2 Marcar o resto das fases 0/1/2 e as fases 2B e 2C como **pausadas (D-053)**, sem apagar nada.
- Checkpoint L0: a lista do que foi fechado e do que foi pausado está registrada neste arquivo.

### L1 — Renomear para Lumen (M; inclui a Fase 3, identidade)
- [ ] L1.1 Protótipo com 2–3 opções de personagem, ícone e sons próprios. O dono escolhe. Nada de Mochi nem dos assets do Coucou (`LICENSE-ASSETS.md`).
- [ ] L1.2 Novo nome, `identifier` e plano de migração de settings, hooks e permissões, conforme os itens 3.2 e 3.3 da [Fase 3](fase-3-identidade.md).
- [ ] L1.3 Testar o upgrade da instalação atual e o caminho do atualizador antes de publicar.
- Checkpoint L1: a release publicada não contém nome, personagem, ícone nem sons do Coucou/Mochi, e o upgrade preserva os dados.

### L2 — Login OAuth do ChatGPT no Lumen (M)
- [ ] L2.1 Portar o login OAuth do ChatGPT da Segunda Mente (`lib/data/services/openai_auth_service.dart`) para o chat do Lumen, com o token guardado no cofre do Windows. Isso cobre o item "Cérebro" das regras M.
- [ ] L2.2 O chat usa esse login, sem chave de API paga obrigatória.
- Checkpoint L2: o chat responde pelo login OAuth no notebook do dono.

### L3 — Anotador de pensamentos e ideias (M)
- [ ] L3.1 O Notetaker deixa de ser gravador de reunião e passa a ser **anotador**: ditado ou captura rápida vira nota.
- [ ] L3.2 Comentários das personas com as mesmas regras do celular. Até o sync existir (L6), os comentários usam as personas importadas manualmente.
- Checkpoint L3: uma nota ditada gera um comentário de persona, sem duplicar.

### L4 — Tarefas no Lumen (M)
Depende de: F11-01 da Segunda Mente (modelo de tarefa fixado).
- [ ] L4.1 Lista única com Hoje, Próximas e Atrasadas, prioridade, subtarefas e busca.
- [ ] L4.2 Atalhos de dia e hora: Hoje, Amanhã, Daqui a 3 dias, Semana que vem; 9h, 14h, 20h; alerta de 20 min.
- [ ] L4.3 Captura por atalho ou ditado gera um cartão de confirmação.
- [ ] L4.4 Aviso do Windows com Adiar, Concluir e Abrir.
- Checkpoint L4: a tarefa criada por voz avisa no horário certo no notebook.

### L5 — E-mail pessoal (M)
- [ ] L5.1 MailCraft como e-mail principal, ligado pelo servidor MCP ou pelo canal de controle (`UCS-Care-Group/mailcraft`). Escopo: ler, resumir e preparar rascunho. Nunca enviar.
- [ ] L5.2 O Outlook clássico (`mail/`) fica como secundário.
- Checkpoint L5: o Lumen resume a caixa de entrada pessoal e prepara um rascunho sem enviar.

### L6 — Sync com a Segunda Mente (G)
Depende de: F12-01 da Segunda Mente (contrato de sync).
- [ ] L6.1 Caixa de correio persistente no relay (`relay/`, Worker com Durable Objects/SQLite): mensagem cifrada fica guardada até o outro lado buscar. Uso medido contra o plano Free.
- [ ] L6.2 Pareamento com a Segunda Mente Android pelo protocolo existente (`docs/ANDROID_LINK.md`, `docs/RELAY_LINK.md`), com revogação.
- [ ] L6.3 Outbox, aplicação idempotente e status "salvo neste PC" separado de "sincronizado".
- [ ] L6.4 Escopo: tarefas, notas, conversas e comentários, personas, preferências e memória resumida. Concluir ou adiar num aparelho cancela o aviso no outro.
- Checkpoint L6: com o celular desligado, a tarefa criada no PC chega ao celular uma vez quando ele reconecta, e o alarme dele toca.

### L7 — Google no Lumen (M)
Depende de: F13-02 da Segunda Mente (login Google próprio).
- [ ] L7.1 Mesmo login Google do celular.
- [ ] L7.2 Backup semanal dos dados do Lumen no Drive, numa subpasta própria.
- [ ] L7.3 Google Calendar: ler eventos e criar evento a partir de tarefa confirmada.
- Checkpoint L7: o backup é restaurado e o evento é criado só com confirmação.

### Depois desta fase
O plano M0–M10 continua como **"Lumen assistente"**, com as mesmas regras M. O modo "mais ativo" (resumos, cobranças e sugestões) é a F14 da Segunda Mente e roda nos dois aparelhos.
