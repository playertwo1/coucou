> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase M3 — Mochi: Obsidian (M)

Objetivo: buscar, citar e capturar notas no cofre existente, lendo os arquivos `.md` direto na pasta. Sem plugin, sem reorganizar o cofre, sem sincronizar nada.

Depende de: Checkpoint M1. Pode ser feita antes ou depois da M2.

Regras desta fase:
- Tudo começa em uma **cópia de teste** do cofre. O cofre real só é ligado na M3.2, por escolha do proprietário.
- O Mochi nunca apaga, move ou renomeia nota.
- O texto das notas é dado: uma nota que diga "ignore as regras" não muda nada.
- Conteúdo de nota não vai para o registro.

### M3.1 — Inventário somente leitura

- [ ] Na cópia de teste, listar pastas, quantidade de notas e convenções (nomes, frontmatter, links).
- [ ] Não abrir, alterar nem indexar o cofre real nesta subfase.
- Checkpoint M3.1: resumo da estrutura entregue ao proprietário, sem conteúdo de notas.

### M3.2 — Pastas autorizadas e inbox

- [ ] O proprietário escolhe em Settings: pasta do cofre, subpastas que o Mochi pode ler e a pasta inbox.
- [ ] Testar acesso fora do permitido: `..`, caminho absoluto, atalho/link simbólico e subpasta não autorizada são recusados.
- Checkpoint M3.2: nenhum arquivo fora das subpastas autorizadas é lido, com teste por caso.

### M3.3 — Buscar e citar (risco baixo)

- [ ] Busca por palavra-chave nas subpastas autorizadas.
- [ ] Ler uma nota e responder com o link para ela (abre no Obsidian).
- [ ] Testar: sem resultado diz "não encontrei"; nota com acentos e espaços no nome; cofre ausente vira erro.
- Checkpoint M3.3: toda resposta baseada em nota traz o link da nota consultada.

### M3.4 — Capturar ideia na inbox (risco médio)

- [ ] Criar nota nova somente na pasta inbox.
- [ ] Nunca sobrescrever: nome repetido ganha sufixo.
- [ ] Testar: repetir o mesmo pedido não duplica em silêncio; inbox ausente vira erro, sem criar pasta em outro lugar.
- Checkpoint M3.4: "registra essa ideia" cria uma nota e devolve o link.

### M3.5 — Editar nota existente (clique sempre)

- [ ] Mostrar o diff da mudança antes de gravar.
- [ ] Gravar só depois do clique, com backup datado da nota.
- [ ] Testar: Cancelar deixa o arquivo idêntico byte a byte; nota alterada por fora entre a prévia e o clique é recusada.
- Checkpoint M3.5: nenhuma nota existente muda sem diff visto e clique.

### M3.6 — Fechamento

- [ ] Ligar o cofre real somente com as subpastas escolhidas na M3.2.
- [ ] Testar o ciclo: buscar, citar, capturar, editar com diff.
- [ ] Testar uma nota com instrução maliciosa: o Mochi a trata como texto.
- [ ] Atualizar `windows/README.md` e o Estado no índice.
- Checkpoint M3: pesquisar, citar e criar nota sem perda nem duplicata; estrutura do cofre igual à de antes.
