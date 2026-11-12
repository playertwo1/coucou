> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase M5 — Mochi: computer use (G)

Objetivo: o Mochi opera a interface de aplicativos pelo Agent Desktop (acessibilidade), só quando não houver API nativa (M2).

Depende de: Checkpoint M2 e a classificação do Agent Desktop na M0.1.

Regras desta fase:
- O Agent Desktop roda em processo separado; o app o chama com argumentos, nunca com texto concatenado em shell.
- Só age em aplicativos da lista autorizada pelo proprietário.
- Os testes usam aplicativos de teste (Bloco de Notas, Calculadora), não dados reais.

### M5.1 — Adaptador e diagnóstico

- [ ] Localizar o Agent Desktop instalado, ler a versão e relatar "ausente" sem travar.
- [ ] Testar: executável ausente, versão incompatível, saída inválida, código de saída diferente de zero.
- Checkpoint M5.1: Settings mostra instalado/ausente; nenhuma ação é tentada quando ausente.

### M5.2 — Ler janelas e elementos (risco baixo)

- [ ] Listar janelas e os elementos acessíveis de uma janela.
- [ ] Não incluir no registro o texto lido da tela.
- Checkpoint M5.2: o Mochi descreve os controles do Bloco de Notas.

### M5.3 — Lista de aplicativos autorizados

- [ ] Settings: o proprietário escolhe em quais aplicativos o Mochi pode clicar e digitar.
- [ ] Aplicativo fora da lista: recusa com explicação.
- Checkpoint M5.3: lista vazia por padrão; nada é clicado fora dela.

### M5.4 — Clicar e digitar (risco médio)

- [ ] Clique e digitação em elemento identificado, somente em aplicativo autorizado.
- [ ] Ler a tela de novo depois da ação e confirmar o efeito.
- [ ] (Understudy) O resultado distingue "ação enviada", "efeito confirmado", "elemento não encontrado" e "timeout"; só "efeito confirmado" conta como sucesso.
- Checkpoint M5.4: digitar um texto no Bloco de Notas e confirmar que ele está lá.

### M5.5 — Robustez

- [ ] Reler a janela antes de cada ação; identificador que mudou não é reutilizado.
- [ ] Tratar perda de foco, janela minimizada, interface lenta e timeout.
- [ ] (Understudy) Esperar por uma condição na tela exige duas leituras seguidas iguais antes de declarar "apareceu" ou "não apareceu".
- [ ] (Understudy) Duas falhas seguidas na mesma via (acessibilidade ou web): parar de repetir a mesma chamada e avisar o cérebro para trocar de via ou relatar a falha. Um sucesso zera a contagem.
- [ ] Controle sem acessibilidade: responder "não consigo ver este controle", sem adivinhar posição.
- Checkpoint M5.5: cada um desses casos termina em sucesso verificado ou em erro claro.

### M5.6 — Tarefas de várias etapas

- [ ] Executar uma sequência de passos, observando o estado depois de cada um.
- [ ] Botão de parar interrompe entre passos; a ilha mostra o passo atual.
- [ ] Um passo que falha encerra a sequência.
- [ ] (Understudy) Só uma sequência por vez controla mouse e teclado; um segundo pedido (chat, voz ou celular) é recusado com explicação enquanto a primeira roda.
- Checkpoint M5.6: sequência de 4 passos concluída, e outra interrompida no meio sem passo extra.

### M5.7 — Bloqueios de segurança

- [ ] Recusar: campo de senha, diálogo de credenciais, janela de elevação (UAC) e janela de administrador.
- [ ] Recusar digitar conteúdo do cofre de segredos em qualquer campo.
- Checkpoint M5.7: teste por caso; a recusa aparece com o motivo.

### M5.8 — Fechamento

- [ ] Rodar 5 cenários em aplicativos de teste, com registro, interrupção e autorização.
- [ ] Atualizar `windows/README.md` e o Estado no índice.
- Checkpoint M5: 5 cenários repetíveis; nenhum clique fora da lista autorizada.
