> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase M10 — Mochi: release (M)

Objetivo: conferir o conjunto antes de publicar o assistente. A publicação em si usa o [checklist de release](release-checklist.md) e só acontece com pedido explícito do proprietário.

Depende de: Checkpoints M1 a M8. A M9 não bloqueia a release.

### M10.1 — Extensão

- [ ] Adicionar uma ferramenta nova de teste sem alterar interface, motor de permissões nem registro.
- Checkpoint M10.1: a mudança fica restrita ao arquivo da ferramenta e à sua entrada na lista.

### M10.2 — Segurança

- [ ] Repetir os testes de recusa: ferramenta fora da lista, risco alto sem clique, pasta não autorizada, site fora da lista, aplicativo fora da lista.
- [ ] Repetir os testes de conteúdo malicioso em nota e em página.
- [ ] Procurar segredos, cookies e caminhos pessoais no registro e nos logs.
- Checkpoint M10.2: nenhuma ação de risco alto sem confirmação; nenhuma credencial em log.

### M10.3 — Recursos e recuperação

- [ ] Medir CPU e RAM em repouso, durante voz e durante uma tarefa; 0 % de CPU com a ilha escondida.
- [ ] Encerrar o app à força no meio de uma tarefa; ao reabrir, nada é retomado sozinho.
- [ ] Testar com Agent Desktop e Agent Browser ausentes: o resto funciona.
- Checkpoint M10.3: números registrados; nenhuma ação é repetida depois de uma queda.

### M10.4 — Documentação e licenças

- [ ] `windows/README.md`: instalar, configurar permissões, pausa rápida, problemas comuns, desinstalar.
- [ ] Listar as dependências novas e suas licenças; conferir as obrigações de cada uma.
- [ ] Conferir que nenhum ativo ou trecho de terceiros entrou sem licença registrada.
- Checkpoint M10.4: lista de dependências e licenças revisada pelo proprietário.

### M10.5 — Instalação limpa

- [ ] Instalar em uma segunda máquina ou conta limpa do Windows; repetir os 10 comandos da M2.7.
- [ ] Atualizar a partir da versão anterior: settings, hooks e permissões preservados.
- [ ] Desinstalar: registros do servidor MCP nas CLIs são removidos, com os arquivos restaurados.
- Checkpoint M10: instalação limpa, atualização e desinstalação testadas. Publicar somente com pedido explícito.
