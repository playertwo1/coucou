# 2.2 — Modo jogo/tela cheia com dados sintéticos

Status: aprovada para implementação e avaliação sintética em 2026-11-13. A decisão do proprietário é implementar cada etapa, comprová-la com dados sintéticos, publicar uma versão e deixar o aceite de uso real para ele.

## Escopo proposto

- Usar fixtures inventadas nos testes e no aplicativo sintético; testes não consultam configurações, processos, janelas ou monitores reais.
- No app Windows, considerar tela cheia quando a janela de primeiro plano, visível e não minimizada cobre o monitor onde a ilha está posicionada; excluir janelas do Coucou, área de trabalho e barra de tarefas. Rejeitar retângulos inválidos. A detecção é geométrica e não afirma detectar o modo exclusivo de DirectX.
- Esconder a janela nativa da ilha durante tela cheia. Uma permissão ou pergunta pendente mostra a ilha existente; ao encerrar o pedido, escondê-la novamente se tela cheia continuar ativa.
- Ao voltar ao modo normal, mostrar de novo a mesma janela, preservando modo, posição e configurações salvas. Não alterar configurações como efeito da transição.
- Acrescentar um controle sintético de tela cheia no rodapé da variante de teste. Preservar os cards e IDs de pílulas. Não adicionar texto à interface normal.
- O algoritmo puro de retângulo e política recebe fixtures nos testes Rust; a variante `windows/synthetic` testa as transições de interface e pedidos pendentes. A versão publicada inclui o detector Windows para avaliação real pelo proprietário.

## Verificação

Testes para normal → tela cheia → normal; retângulos inválidos, origens negativas, janela menor/minimizada/excluída, monitor da ilha versus outro monitor, permissão durante tela cheia e decisão; confirmar que nenhuma configuração salva muda. Inspecionar o aplicativo sintético e executar typecheck/build, testes pertinentes e i18n.

Essas provas validam o algoritmo e fluxo de interface com fixtures. Jogo/vídeo real, Alt+Tab, detecção exclusiva, troca física de monitor e encerramento de processo ficam na validação do proprietário e não serão marcados concluídos por testes sintéticos.

## Preparação Git necessária

Após fetch em 2026-11-12, `upstream/main...HEAD` passou a `21 36`. A simulação `git merge-tree --write-tree HEAD upstream/main` encontrou conflito apenas em `windows/src/i18n/extra.json`. A árvore atual contém alterações locais da captura e não pode ser limpa ou integrada por sobrescrita. Proposta: integrar upstream e desenvolver em uma worktree separada, preservando a `main` atual e suas alterações; confirmar esse desvio do pedido original de trabalhar na `main` antes de criar a worktree. Nenhum código novo até a preparação estar resolvida.

Comparação das três versões do catálogo: nenhuma chave tem valores modificados de forma incompatível pelos dois lados; o conflito textual é de adições. A resolução deve preservar as entradas do fork e as do upstream, seguida da verificação de i18n. Essa comparação não aplicou integração ao checkout.
