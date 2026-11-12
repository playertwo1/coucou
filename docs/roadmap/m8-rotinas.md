> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase M8 — Mochi: rotinas (M)

Objetivo: sequências salvas de ferramentas, como "modo programar" (abre os apps, arruma as janelas, ajusta o volume). Uma rotina só usa ferramentas que já existem.

Depende de: Checkpoint M2. Rotinas podem incluir ferramentas de M3, M5 e M6 quando essas fases estiverem fechadas.

### M8.1 — Formato

- [ ] Uma rotina é uma lista ordenada de chamadas de ferramenta com argumentos fixos, guardada nos dados do app.
- [ ] Validar cada passo contra o schema da ferramenta ao salvar e ao executar.
- [ ] (Understudy) Além dos argumentos fixos, um passo pode usar parâmetros declarados na rotina (nome, tipo e valor padrão), como a pasta do projeto em "modo programar". O valor recebido é validado contra o schema da ferramenta antes de executar.
- [ ] Testar: ferramenta inexistente, argumento inválido, parâmetro fora do schema e arquivo corrompido são recusados.
- Checkpoint M8.1: rotina inválida não é salva nem executada.

### M8.2 — Criar e aprovar

- [ ] O proprietário vê a lista completa de passos antes de salvar.
- [ ] Qualquer alteração na rotina exige nova aprovação.
- [ ] O modelo pode propor uma rotina, mas não pode salvá-la sem o clique.
- [ ] (Understudy) Depois de uma tarefa de várias etapas concluída com sucesso, oferecer "salvar como rotina" a partir das chamadas da sessão em memória (não do registro em disco). Passa pela mesma tela de aprovação; nada é analisado em segundo plano.
- Checkpoint M8.2: não existe rotina salva que o proprietário não tenha visto.

### M8.3 — Executar

- [ ] Cada passo passa pelo motor de permissões; passo de risco alto pede clique toda vez, mesmo dentro de rotina aprovada.
- [ ] Parar no primeiro passo que falhar e dizer qual foi.
- [ ] Botão de parar e pausa rápida interrompem entre passos.
- Checkpoint M8.3: rotina de 4 passos executa em ordem; falha no passo 2 impede os passos 3 e 4.

### M8.4 — Disparar

- [ ] Disparo pelo chat, por voz e pelo celular, pelo nome da rotina.
- [ ] Agendamento por horário fica fora desta fase; só entra com pedido explícito e spec própria.
- Checkpoint M8.4: "modo programar" funciona pelas três entradas.

### M8.5 — Fechamento

- [ ] Criar a rotina real "modo programar" com o proprietário e executá-la 3 vezes.
- [ ] Conferir o registro de cada execução.
- [ ] Atualizar `windows/README.md` e o Estado no índice.
- Checkpoint M8: rotina criada, aprovada, executada e interrompida conforme descrito.
