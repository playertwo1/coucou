# O que aproveitar do clawd-on-desk para personagens do Lumen

**Leitura feita em:** 2026-11-13
**Repositório consultado:** [rullerzhou-afk/clawd-on-desk](https://github.com/rullerzhou-afk/clawd-on-desk), guias `docs/guides/guide-theme-creation.md` e `docs/guides/state-mapping.md`
**Licença:** AGPL-3.0. **Nada de código, texto do esquema ou arte pode ser copiado**: isso obrigaria o Lumen inteiro a virar AGPL. Só ideias e conceitos, escritos do nosso jeito.

## Resumo

É um pet de desktop (Electron) que mostra o estado de agentes como Claude Code, Codex, Cursor, Gemini CLI e outros. Os personagens vêm em temas: uma pasta com um manifesto JSON e os arquivos de animação (SVG, APNG, WebP, GIF, PNG).

O personagem principal, "Clawd", é o mascote do Claude Code (Anthropic) e fica fora, assim como os personagens próprios do projeto (Calico, Cloudling, Hash Sage, Whale-chan).

Só os dois guias foram lidos; o código não foi lido. As afirmações sobre CPU e segurança vêm do que o projeto documenta.

## O que vale aproveitar (como ideia)

| Ideia | Por que serve ao Lumen |
|---|---|
| Personagem como pacote: pasta com manifesto e arquivos | O mesmo formato aceita personagem desenhado em código ou em sprite, então os dois podem ser comparados sem reescrever nada. |
| Estado lógico separado do visual, com "cai para" | Com 4 visuais (parado, pensando, trabalhando, dormindo) o personagem já funciona; os outros estados usam um desses até ganharem arte própria. |
| Variações sorteadas que se mantêm enquanto o estado dura | O personagem não troca de desenho a cada chamada de ferramenta. |
| Tempo mínimo e retorno automático por estado | Evita tremedeira entre estados; "concluído" e "erro" voltam sozinhos. |
| Níveis de trabalho por número de sessões ou subagentes | Mostra na ilha quando vários agentes trabalham ao mesmo tempo. |
| Exceções por agente documentadas (ex.: fim de turno do Gemini não vira "concluído") | Vale uma tabela igual para os nossos hooks. |
| Caixa do corpo e linha de base para padronizar tamanho | Personagens diferentes com o mesmo tamanho visual nas pílulas de 22 px. |
| Sons por nome lógico | Encaixa na paleta sintetizada; um pacote pode trocar ou desligar o som. |
| Pacote de terceiros tratado como não confiável, com validador | Obrigatório se um dia houver personagens do usuário: SVG sem script, sem URL externa, sem caminho fora da pasta. |
| Fluxo de arte: imagem gerada, PNG transparente, 4–12 quadros, exportação em 2–3× | Serve para pedir arte ao Codex. |

## O que não vale

| Item | Motivo |
|---|---|
| GIF e SVG animados pelo navegador | O próprio projeto avisa do gasto de CPU em telas de alta taxa de atualização. Conflita com 0 % de CPU com a ilha escondida; quadros devem ser trocados pelo loop do app, que para quando a ilha some. |
| Pet solto na tela, modo mini, reações a clique, easter eggs | O Lumen vive na ilha; complexidade sem ganho agora. |
| Catálogo de acessórios com cobertura total | Complexo; o app já tem o guarda-roupa (`windows/src/mochi/wardrobe.ts`). |
| Ajustes por arquivo (escala, viewBox, hitbox por estado, amostragem) | Esquema grande demais para o nosso caso. |
| Baixar temas de um repositório sob demanda | Rede e risco de cadeia de suprimentos. |
| GIF em pixel art | Transparência binária, serrilhada na ilha escura. |

## Ideia de formato: pacote de personagem do Lumen (v1)

Proposta para quando houver novos personagens. Não tem etapa aberta no roadmap.

```
personagens/<id>/
  personagem.json
  quadros/            ← só no modo sprite (WebP/PNG em folha de sprites)
```

`personagem.json`:
- `id`, `nome`, `agentes` (por exemplo `["codex"]`, ou `["*"]` para o genérico);
- `modo`: `"codigo"` (chama um desenhista Canvas registrado no app) ou `"sprite"` (folha de quadros e taxa de quadros);
- `estados`: os 11 estados de `BotStateName` (`windows/src/core/layout.ts`). Obrigatórios: `idle`, `thinking`, `working`, `sleeping`. Os outros (`searching`, `approval`, `question`, `error`, `finished`, `ratelimit`, `dizzy`) podem declarar `caiPara`;
- variações por estado, mantidas enquanto o estado dura;
- níveis por número de sessões;
- tempos mínimos e retorno automático;
- caixa do corpo e linha de base;
- sons por nome lógico, apontando para o sintetizador.

Regras:
- v1 só com pacotes embutidos no app; pacotes do usuário ficam para depois, com validador e limpeza de SVG.
- O loop de quadros é o do app e para com a ilha escondida.
- Nenhum pacote usa Mochi, Coucou, Clawd, logos ou mascotes de empresas.
