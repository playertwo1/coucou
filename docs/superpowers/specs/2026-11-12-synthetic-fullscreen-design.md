# 2.2 — Modo jogo/tela cheia com dados sintéticos

Status: proposta de escopo; implementação não iniciada. O proprietário determinou deixar a validação de uso real para o final e avançar somente com dados sintéticos. Isso não fecha os checkpoints nativos pendentes da 2.1.

## Escopo proposto

- Reutilizar o aplicativo `windows/synthetic`, sem configurações, processos, janelas ou monitores reais como fonte de dados. Manter o host sem IPC e sem backend de produção.
- Criar fixtures de janela e monitor inventados. Considerar tela cheia quando uma janela de app válida, não minimizada, cobre o retângulo inteiro do monitor correspondente; excluir área de trabalho, barra de tarefas e o próprio Coucou. Rejeitar retângulos inválidos. Não declarar detecção de jogo exclusivo provada por geometria sintética.
- Durante tela cheia simulada, esconder a ilha. Eventos comuns de trabalho/conclusão não a reabrem. Pedido de permissão ou pergunta pendente aparece no card existente e continua dependendo de clique; ao encerrar o pedido, a ilha volta a ficar escondida enquanto a tela cheia persistir.
- Ao voltar ao modo normal, restaurar o modo anterior da ilha, respeitando pedido ainda pendente. Não salvar posição, monitor, idioma ou preferências como efeito dessas transições.
- Acrescentar somente um controle de cenário de tela cheia no rodapé de teste, com indicação do estado simulado. Preservar os cards e os IDs de pílulas. Textos novos no catálogo extra nas 13 línguas.
- Isolar a decisão de visibilidade em lógica pura testável e usá-la na variante sintética. Não conectar um detector nativo nem ativar o recurso no app normal nesta etapa.

## Verificação

Testes para normal → tela cheia → normal; retângulos inválidos, origens negativas e escalas já convertidas ao mesmo sistema de coordenadas; janela menor/minimizada/excluída; permissão durante tela cheia, decisão, cancelamento sem decisão e dois pedidos; nenhuma configuração salva. Inspecionar o aplicativo sintético e executar typecheck/build, testes pertinentes e i18n.

Essas provas validam política e fluxo de interface com fixtures. Jogo/vídeo real, Alt+Tab, detecção exclusiva, troca de monitor e encerramento de processo ficam na validação final e não serão marcados concluídos.

## Preparação Git necessária

Após fetch em 2026-11-12, `upstream/main...HEAD` passou a `21 36`. A simulação `git merge-tree --write-tree HEAD upstream/main` encontrou conflito apenas em `windows/src/i18n/extra.json`. A árvore atual contém alterações locais da captura e não pode ser limpa ou integrada por sobrescrita. Proposta: integrar upstream e desenvolver em uma worktree separada, preservando a `main` atual e suas alterações; confirmar esse desvio do pedido original de trabalhar na `main` antes de criar a worktree. Nenhum código novo até a preparação estar resolvida.

Comparação das três versões do catálogo: nenhuma chave tem valores modificados de forma incompatível pelos dois lados; o conflito textual é de adições. A resolução deve preservar as entradas do fork e as do upstream, seguida da verificação de i18n. Essa comparação não aplicou integração ao checkout.
