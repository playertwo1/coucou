# L1.4b — comparação Codex sprite × Canvas

## Objetivo

Comparar a mesma referência aprovada do Codex em duas renderizações isoladas: sprite PNG e desenho Canvas com primitivas simples. A página mostra os oito estados em dimensões intrínsecas exatas de 22 × 22 e 96 × 96 px, sobre preto, para decisão posterior do proprietário.

## Escopo e limites

- O protótipo vive em `windows/design/personagens/prototipo/`; não importa nem altera código do app.
- Usa o personagem Codex aprovado e oito estados: Parado, Pensando, Trabalhando, Dormindo, Aguardando aprovação, Pergunta, Erro e Concluído.
- Os estados lógicos adicionais existentes (`searching`, `ratelimit`, `dizzy`) são documentados como aliases visuais para Pensando, Dormindo e Pergunta, respectivamente. Nenhum contrato do app muda.
- Controles de estado, tamanho e visibilidade atualizam os dois exemplos juntos. Não há animação, timer ou loop de desenho contínuo.
- CPU em porcentagem do processo Tauri, memória real do app e delta do instalador não são mensuráveis sem integração. O relatório distingue contagem de trabalho agendado, estimativa de memória por pixels decodificados e bytes dos recursos locais; não os apresenta como medição de runtime ou instalador.

## Arquivos

- `windows/design/personagens/prototipo/index.html`: página estática, controles e renderer Canvas.
- `windows/design/personagens/prototipo/codex-spritesheet.png`: oito quadros recortados da prancha transparente aprovada.
- `windows/design/personagens/prototipo/README.md`: como abrir e limites do protótipo.
- `windows/design/personagens/prototipo/comparacao.md`: dimensões, bytes e observações verificadas.
- Este arquivo e `docs/superpowers/plans/2026-11-13-l14b-codex-sprite-canvas.md`.

## Aceite

- Todos os oito estados aparecem nos dois lados com o mesmo estado selecionado.
- Sprite e Canvas aparecem com dimensões exatas de 22 × 22 ou 96 × 96 px; o bitmap intrínseco do Canvas usa esses mesmos valores. O fundo é preto.
- O spritesheet é transparente e não inclui rótulos da prancha.
- O protótipo não inicia trabalho periódico; ocultar a ilha esconde ambos os exemplos.
- Comparação e limitações ficam registradas em pt-BR. O proprietário escolhe sprite ou Canvas antes de qualquer implementação em `windows/src/`.

## Reversão

Excluir somente `windows/design/personagens/prototipo/`. Preservar as referências aprovadas e o registro histórico da L1.4.
