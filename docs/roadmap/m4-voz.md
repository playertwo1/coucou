> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase M4 — Mochi: voz ligada às ferramentas (P)

Objetivo: falar com o Mochi e ele usar as ferramentas das fases M2 e M3. Reusa a voz que já existe (`windows/src-tauri/src/voice/`: ditado Parakeet, resposta falada, "OK Coucou"). Nenhum motor de voz novo.

Depende de: Checkpoint M2, e das validações 0.1 (ditado) e 0.3 ("OK Coucou") da Fase 0 com resultado PASS.

### M4.1 — Pedido falado chega às ferramentas

- [ ] O texto reconhecido por "OK Coucou" e pelo ditado do chat segue o mesmo caminho do pedido digitado (M1.6).
- [ ] Testar: "volume 20%" falado executa a ferramenta de volume.
- Checkpoint M4.1: não existe caminho separado para voz; as permissões são as mesmas do chat.

### M4.2 — Confirmação continua sendo clique

- [ ] Ação de risco médio ou alto pedida por voz mostra o cartão; dizer "sim" não aprova.
- [ ] O Mochi avisa por voz que está aguardando o clique.
- Checkpoint M4.2: nenhuma aprovação acontece por voz.

### M4.3 — Interromper

- [ ] Um botão e um atalho param a fala e cancelam a ferramenta em execução.
- [ ] A ilha mostra sempre que o microfone está ativo.
- [ ] Nenhum áudio é guardado depois da transcrição.
- Checkpoint M4.3: interromper funciona durante a fala e durante uma ação; não sobra arquivo de áudio.

### M4.4 — Teste em pt-BR

- [ ] Montar 20 frases fixas de comando (volume, brilho, apps, janelas, notas).
- [ ] Falar cada uma 2 vezes; registrar quantas foram entendidas e executadas corretamente.
- [ ] Testar com ruído de fundo e com microfone desconectado.
- [ ] Fixar na spec, antes do teste, a taxa mínima aceitável.
- Checkpoint M4.4: taxa medida e registrada, sem guardar áudio.

### M4.5 — Comparar com whisper.cpp / Piper (condicional)

- [ ] Só executar se a M4.4 ficar abaixo da taxa mínima ou a voz de resposta for rejeitada pelo proprietário.
- [ ] Rever as licenças (Piper é GPL) antes de qualquer teste de integração.
- [ ] Repetir as 20 frases com o candidato; trocar só se o ganho for claro.
- Se a M4.4 passar, marcar N/A com o resultado medido.
- Checkpoint M4.5: troca decidida com números, ou N/A registrado.

Checkpoint M4: comandos em pt-BR funcionam por voz, a interrupção é confiável e não há gravação permanente.
