> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase M7 — Mochi: Android (M)

Objetivo: pedir e aprovar ações do Mochi pelo app Android que já existe (`android/`), pela ligação que já existe (`windows/src-tauri/src/phone_link/`).

Depende de: Checkpoint M2. As ferramentas de M3, M5 e M6 chegam ao celular conforme estiverem prontas.

Decisões já tomadas:
- O clique no celular vale como confirmação para qualquer nível de risco.
- Risco alto exige digital ou rosto no Android antes de a aprovação ser enviada.
- Só rede local e só celular pareado. Acesso pela internet está fora de escopo.

### M7.1 — Mapear o que já existe

- [ ] Ler `phone_link/` e o app Android: pareamento, chat, aprovações de agentes, revogação.
- [ ] Anotar o que protege a ligação hoje (criptografia, identidade do aparelho, repetição de mensagem).
- [ ] Listar o que falta para aprovar ferramentas do Mochi; escrever a spec.
- Checkpoint M7.1: spec aprovada antes de mudar o protocolo; versões antigas do app continuam funcionando ou recebem aviso de atualização.

### M7.2 — Pedido pelo celular

- [ ] Um pedido no chat do celular segue o mesmo caminho do chat do PC (M1.6).
- [ ] O celular mostra o estado: pensando, aguardando, executando, feito, falhou.
- Checkpoint M7.2: "volume 20%" pelo celular muda o volume do PC.

### M7.3 — Aprovar risco médio pelo celular

- [ ] O cartão de confirmação aparece no PC e no celular; o primeiro clique decide, o outro some.
- [ ] A aprovação vale só para aquele pedido e expira junto com ele.
- Checkpoint M7.3: uma aprovação antiga reenviada não aprova pedido novo.

### M7.4 — Risco alto com digital ou rosto

- [ ] O Android pede biometria antes de enviar a aprovação de risco alto.
- [ ] Aparelho sem biometria configurada: a aprovação de risco alto fica só no PC.
- [ ] O PC recusa aprovação de risco alto que não venha marcada como confirmada por biometria.
- Checkpoint M7.4: sem biometria, nenhuma ação de risco alto é aprovada pelo celular.

### M7.5 — Revogar e casos de falha

- [ ] Revogar um celular no PC corta pedidos e aprovações na hora.
- [ ] Testar: rede cai no meio, celular fora do Wi-Fi, aprovação que chega depois do timeout, aparelho revogado tentando aprovar.
- [ ] A pausa rápida do PC bloqueia pedidos do celular.
- Checkpoint M7.5: em todos os casos de falha a ação não acontece.

### M7.6 — Fechamento

- [ ] Três comandos simples pelo celular, uma ação de risco médio e uma de risco alto com biometria.
- [ ] Notificações de agentes de programação continuam funcionando como antes.
- [ ] Atualizar a documentação do Android e o Estado no índice.
- Checkpoint M7: tudo acima observado em aparelho real ou emulador, com a versão do app registrada.
