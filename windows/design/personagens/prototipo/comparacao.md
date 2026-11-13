# Comparação L1.4b — Codex

## Artefatos e memória estimada

| Item | Medida | Como interpretar |
|---|---:|---|
| Spritesheet PNG | 32.179 B; 384 × 192 px | Oito quadros RGBA de 96 × 96 px, comprimidos em um PNG. |
| Canvas renderer e controles | 6.933 B UTF-8 | Script inline da página, incluindo desenho, controles e aliases de estado. |
| Página estática completa | 10.439 B | HTML, CSS e JavaScript; a estrutura dos controles é comum à comparação. |
| Atlas sprite decodificado | 294.912 B (288 KiB) | Largura × altura × 4 bytes por pixel; estimativa do bitmap completo em memória. |
| Um buffer Canvas de 96 px | 36.864 B (36 KiB) | 96 × 96 × 4; não inclui overhead do navegador, GPU ou cópias internas. |
| Um buffer Canvas de 22 px | 1.936 B | 22 × 22 × 4; mesma ressalva de overhead. |

Os tamanhos são dos arquivos locais deste protótipo. Sprite decodificado e buffer Canvas são estimativas de pixels, não leituras da memória total do processo.

## Trabalho ocioso e dimensões

- Nenhum `requestAnimationFrame`, timer ou animação está programado no código. O Canvas redesenha somente ao mudar estado/tamanho ou ao mostrar novamente a ilha; quando ocultas, as amostras saem do layout. A inspeção do código indica zero callbacks periódicos; CPU percentual não foi medida em runtime.
- O PNG contém oito quadros de 96 × 96 px em uma grade 4 × 2, com transparência. O controle CSS mostra o quadro em 22 × 22 ou 96 × 96 px. O Canvas recebe exatamente essas dimensões como bitmap e CSS.
- A prévia interativa não foi aberta nesta sessão: o navegador disponibilizado bloqueou navegação para `file://`. A sintaxe JavaScript foi conferida estaticamente; os asserts de navegador e a comparação visual interativa aguardam inspeção pelo proprietário.

## Limites do checkpoint

- Não foi medido o percentual real de CPU de um processo Tauri com a ilha escondida nem a memória total do app.
- Não foi medido o delta de tamanho de um instalador; o protótipo não é integrado ao Tauri.
- Os bytes do PNG e do código Canvas são valores do protótipo e não substituem o tamanho final do instalador.
- A escolha entre sprite e Canvas continua com o proprietário; a L1.4c não começou.
