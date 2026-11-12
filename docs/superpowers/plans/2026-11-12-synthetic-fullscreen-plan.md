# Plano da 2.2 sintética

1. Confirmar o escopo e a execução em worktree separada, pois upstream ganhou 21 commits e há alterações locais na main. A simulação de integração encontrou conflito no catálogo extra; preservar as entradas dos dois lados sem renomear IDs ou redesenhar a interface.
2. Integrar upstream na árvore de trabalho isolada, registrar resolução e verificar árvore limpa/upstream contido antes de código novo. Não apagar, mover ou limpar a main atual. Não misturar a integração com o código da 2.2.
3. Implementar lógica pura de classificação/visibilidade e fixtures inventadas; integrar somente ao aplicativo sintético. Controlar todas as entradas que poderiam reabrir a ilha, sem decidir pedidos automaticamente.
4. Testar transições, pedidos e preservação das configurações; acrescentar controle de cenário e traduções completas.
5. Compilar e inspecionar o executável sintético, registrar resultados e deixar os testes reais para o final conforme pedido. Não marcar aceites nativos como concluídos nem criar release/push.
