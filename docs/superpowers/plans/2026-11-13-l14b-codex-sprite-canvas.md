# Plano — L1.4b Codex sprite × Canvas

1. Registrar o aceite visual da L1.4a e iniciar L1.4b sem alterar a decisão de identidade original nem a escolha de renderer.
2. Recortar os oito quadros do `codex-estados-transparente.png` para um spritesheet 4 × 2, mantendo transparência e removendo os rótulos.
3. Criar uma página estática pequena com estado, tamanho (22/96 px) e visibilidade compartilhados entre sprite e Canvas. Usar somente primitivas simples no desenho Canvas.
4. Conferir os oito estados, dimensões intrínsecas, transparência e fundo preto; incluir verificações locais para estado, aliases e dimensões.
5. Registrar bytes do PNG e do renderer, custo mínimo de pixels decodificados, ausência de timers/`requestAnimationFrame` e as medições que dependem de integração real.
6. Parar após deixar a comparação pronta para avaliação. A escolha do proprietário é necessária antes de L1.4c.

## Arquivos e interfaces

- Somente `windows/design/personagens/prototipo/` para protótipo e resultados.
- `docs/superpowers/specs/2026-11-13-l14b-codex-sprite-canvas.md` para aceite.
- `docs/STATE-FORK.md`, `docs/ROADMAP-FORK.md`, `docs/roadmap/fase-l-lumen.md`, `docs/roadmap/parqueado.md` e o README das referências para estado e evidência.
- Nenhum export, componente, configuração ou interface do aplicativo é alterado.

## Verificação

- Verificar via inspeção do navegador nos tamanhos 22 e 96 px e em todos os oito estados.
- Usar asserts locais para cardinalidade dos estados, cobertura dos aliases e dimensões de renderização.
- Conferir alfa do PNG e tamanhos dos arquivos. Não rodar a suíte do app porque nenhum código do app será alterado.
- Não alegar CPU percentual de Tauri, memória total em runtime ou delta do instalador; só registrar as métricas locais descritas na spec.

## Rollback

Remover a pasta do protótipo se a comparação for descartada. Manter os arquivos-fonte aprovados e as decisões históricas da L1.4.
