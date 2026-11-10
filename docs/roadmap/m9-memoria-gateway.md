> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase M9 — Mochi: memória avançada, gateway e observabilidade (G)

Objetivo: avaliar e, se valer a pena, adicionar memória por significado (Mem0 ou Graphiti), gateway de modelos (LiteLLM) e painel de observabilidade (Langfuse).

Depende de: Checkpoint M3 (para medir a busca simples) e Checkpoint M8.

Regras desta fase:
- Cada item começa por avaliação. Instalar só depois da avaliação aprovada pelo proprietário.
- Tudo local: nenhum dado sai da máquina; nada de serviço na nuvem. A regra "sem telemetria" continua valendo.
- Tudo opcional e desligado por padrão. O Mochi funciona igual sem eles.
- Uma avaliação pode terminar em N/A, com a evidência registrada.

### M9.1 — Medir a necessidade de memória

- [ ] Juntar 10 perguntas reais em que a busca por palavra-chave da M3 falhou ou respondeu mal.
- [ ] Se não houver 10 falhas reais, registrar isso e seguir para a M9.4.
- Checkpoint M9.1: lista de falhas reais, sem conteúdo privado das notas.

### M9.2 — Avaliar Mem0 e Graphiti

- [ ] Para cada um: licença, o que precisa ficar rodando, RAM/CPU em repouso, onde os dados ficam e se funciona sem serviço externo.
- [ ] Testar as 10 perguntas da M9.1 em uma cópia de teste do cofre.
- [ ] Escolher um, ou nenhum.
- Checkpoint M9.2: tabela comparativa e decisão do proprietário registradas.

### M9.3 — Integrar a memória escolhida (condicional à M9.2)

- [ ] Integrar como ferramenta opcional, desligada por padrão.
- [ ] Indexar somente as subpastas autorizadas na M3.2.
- [ ] Oferecer "apagar a memória" em Settings; o cofre não é alterado.
- [ ] Testar: desligada, o Mochi se comporta como antes; 0 % de CPU com a ilha escondida.
- Checkpoint M9.3: as 10 perguntas melhoram de forma medida, ou a integração é revertida.

### M9.4 — Avaliar LiteLLM

- [ ] Listar o que o LiteLLM faria aqui, dado que o cérebro usa as assinaturas (OAuth ou CLI).
- [ ] Verificar se ele funciona com esse tipo de login ou só com chaves de API.
- [ ] Sem caso de uso concreto, marcar N/A com a evidência.
- Checkpoint M9.4: decisão registrada; nada instalado sem caso de uso.

### M9.5 — Avaliar Langfuse

- [ ] Verificar se roda inteiramente local, o que precisa ficar ligado e quanto consome.
- [ ] Comparar com o registro local da M1.4: o que o Langfuse mostra que o registro não mostra.
- [ ] Se exigir serviço sempre ligado sem ganho claro, marcar N/A com a evidência.
- Checkpoint M9.5: decisão registrada; nenhum dado de uso sai da máquina em nenhum cenário.

### M9.6 — Integrar gateway/observabilidade (condicional a M9.4 e M9.5)

- [ ] Só o que foi aprovado; opcional e desligado por padrão.
- [ ] Redigir prompts e conteúdo antes de qualquer gravação.
- Checkpoint M9.6: com tudo desligado, o app se comporta como no Checkpoint M8.

Checkpoint M9: cada um dos quatro itens está integrado com medição, ou marcado N/A com evidência.
