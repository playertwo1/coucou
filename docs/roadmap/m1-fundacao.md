> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase M1 — Mochi: fundação (G)

Objetivo: o caminho completo "pedido → cérebro → ferramenta → resultado" funcionando com uma única ferramenta de teste inofensiva. Nenhuma ferramenta real nesta fase.

Depende de: Checkpoint M0.

Antes de M1.1: escrever spec e plano em `docs/superpowers/`, fixando nomes de módulos e arquivos a partir do mapa da M0.6. Uma subfase por commit.

### M1.1 — Contrato e registro de ferramentas

- [ ] Definir o contrato de ferramenta descrito em "Regras das fases M" do índice.
- [ ] Criar o registro: lista de ferramentas habilitadas; o que não está na lista não existe para o modelo.
- [ ] (Understudy) Ferramenta cujo pré-requisito falta (adaptador ausente, permissão negada, fase desligada) não é listada ao modelo, em vez de falhar só na execução. Testar com uma ferramenta de teste marcada como indisponível.
- [ ] Criar a ferramenta de teste `ping`, que só devolve um texto fixo (risco baixo).
- [ ] Testar: ferramenta desconhecida recusada; argumento fora do schema recusado; timeout encerra a chamada.
- Checkpoint M1.1: testes passam; nenhuma ferramenta executa texto como comando.

### M1.2 — Motor de permissões

- [ ] Implementar os três níveis de risco e a regra de clique do índice.
- [ ] Decidir e registrar onde ficam as permissões "sempre permitir" (arquivo de settings atual ou outro).
- [ ] Testar: baixo executa; médio pede na primeira vez e respeita "sempre permitir"; alto pede sempre; revogar volta a pedir; sem resposta não executa.
- Checkpoint M1.2: não existe caminho de código que execute médio ou alto sem decisão registrada.

### M1.3 — Cartão de confirmação

- [ ] Reutilizar o cartão Permitir/Negar existente da ilha, sem mudar o visual.
- [ ] Mostrar: ferramenta, o que será feito em uma frase, nível de risco.
- [ ] Frases novas em `windows/src/i18n/extra.json`, nas 13 línguas.
- [ ] Testar: Permitir, Negar, fechar, timeout e dois pedidos seguidos.
- Checkpoint M1.3: cada clique decide só o pedido mostrado; timeout equivale a negar.

### M1.4 — Registro local

- [ ] Gravar por chamada: ferramenta, hora, risco, decisão e resultado.
- [ ] Não gravar argumentos com texto livre, conteúdo de tela, tokens nem caminhos pessoais.
- [ ] Oferecer "limpar registro" em Settings.
- [ ] Testar que um segredo passado como argumento não aparece no arquivo.
- Checkpoint M1.4: registro legível, só local, e limpo pelo botão.

### M1.5 — Servidor MCP local

- [ ] Expor o registro de ferramentas por MCP, somente local (stdio ou loopback); nunca em interface de rede externa.
- [ ] Toda chamada recebida passa pelo motor de permissões da M1.2.
- [ ] Registrar o servidor na configuração de cada CLI aprovada na M0.2, com backup datado, diff visível e clique.
- [ ] Testar: chamada de fora do loopback recusada; remover o registro restaura o arquivo original.
- Checkpoint M1.5: a CLI lista a ferramenta `ping` e a chama; a configuração de outras ferramentas fica intacta.

### M1.6 — Ligação com o chat e pausa rápida

- [ ] Um pedido no chat da ilha chega ao cérebro com as ferramentas disponíveis e a resposta volta ao chat.
- [ ] (Understudy) Texto externo embutido no pedido ao cérebro (título de janela, nome de arquivo, nome de app) tem caracteres de controle, invisíveis e quebras de linha removidos antes. Testar com um título que contém quebra de linha e uma instrução falsa.
- [ ] Mostrar na ilha o estado: pensando, aguardando clique, executando, feito, falhou.
- [ ] Implementar a pausa rápida do índice e um botão de cancelar a execução em curso.
- [ ] Testar: cérebro indisponível vira erro visível; pausa bloqueia `ping`; cancelar interrompe.
- Checkpoint M1.6: "faça um ping" no chat executa `ping` e mostra o resultado.

Checkpoint M1: o app abre, conversa em texto, mostra o estado e não executa nada fora da lista habilitada. `npx tsc --noEmit`, `npm test`, `cargo test --lib` passam.
