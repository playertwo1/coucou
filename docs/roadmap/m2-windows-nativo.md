> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase M2 — Mochi: controle nativo do Windows (M)

Objetivo: comandos de rotina do Windows por APIs nativas, sem PowerShell montado por texto e sem Agent Desktop.

Depende de: Checkpoint M1.

Cada subfase entrega uma ferramenta completa: schema, risco, execução, verificação, testes e uma frase de teste manual no chat.

### M2.1 — Volume e mudo (risco baixo)

- [ ] Ler e definir volume master (0–100) e mudo pela API de áudio.
- [ ] Depois de agir, ler o estado e devolvê-lo.
- [ ] Testar: valor fora da faixa recusado; sem dispositivo de áudio vira erro claro.
- Checkpoint M2.1: "volume 20%" e "tira o som" funcionam e relatam o valor final.

### M2.2 — Brilho (risco baixo)

- [ ] Brilho da tela interna do notebook pela interface nativa.
- [ ] Monitor externo só quando o monitor responder por DDC/CI; caso contrário, responder "indisponível neste monitor".
- [ ] Testar em desktop sem tela interna: erro honesto, nenhum valor inventado.
- Checkpoint M2.2: brilho muda onde é suportado; hardware testado fica anotado.

### M2.3 — Listar e abrir aplicativos (risco baixo)

- [ ] Listar aplicativos instalados.
- [ ] Abrir somente um aplicativo escolhido dessa lista; nunca um caminho ou comando vindo do pedido.
- [ ] Testar: nome ambíguo pede escolha; aplicativo ausente vira erro; nome com `;` ou `&` não executa nada.
- Checkpoint M2.3: "abre o VS Code" abre o aplicativo certo.

### M2.4 — Janelas (risco baixo)

- [ ] Listar janelas; mover, redimensionar, minimizar e encaixar lado a lado.
- [ ] Guardar as posições anteriores e oferecer "desfazer" da última organização.
- [ ] Tratar monitores com escalas e origens diferentes; janela elevada (administrador) vira erro claro.
- [ ] Com um só monitor, registrar HARDWARE INDISPONÍVEL para o teste de dois monitores.
- Checkpoint M2.4: "organize as janelas para programar" arruma e "desfaz" restaura.

### M2.5 — Mídia (risco baixo)

- [ ] Tocar, pausar, próxima e anterior, reutilizando a sessão de mídia que a pílula de música já usa.
- [ ] Sem player ativo: responder isso, sem abrir nada.
- Checkpoint M2.5: os comandos agem no player ativo e em nenhum outro.

### M2.6 — Energia (risco médio e alto)

- [ ] Bloquear a tela: risco médio.
- [ ] Suspender, reiniciar e desligar: risco alto, clique toda vez, com aviso de trabalho não salvo.
- [ ] Testar: negar não faz nada; timeout não faz nada.
- Checkpoint M2.6: nenhuma ação de energia ocorre sem clique; o registro mostra a decisão.

### M2.7 — Fechamento

- [ ] Escolher 10 comandos de rotina; executar cada um 3 vezes pelo chat.
- [ ] Testar: retomar da suspensão, aplicativo ausente, dispositivo de áudio trocado.
- [ ] Atualizar `windows/README.md` e o Estado no índice.
- Checkpoint M2: 10 comandos com sucesso repetível; toda falha aparece como falha, com motivo.
