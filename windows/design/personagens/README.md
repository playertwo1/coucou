# Personagens do Lumen — referências visuais L1.4a

Pranchas conceituais geradas em 2026-11-13 e organizadas em PNG para leitura em fundo preto ou transparente. O proprietário aprovou visualmente a lineup e as pranchas estáticas em 2026-11-13. Na mesma data, escolheu Canvas com base na revisão técnica da L1.4b; a implementação está na L1.4d. A escolha do renderer não representa aceite de código ou validação real. A Bússola continua sendo somente o ícone do Lumen.

## Família e paleta

Todos compartilham contorno índigo `#26224B`, dois olhos ovais grandes com pupilas índigo, pequenos pontos de luz areia `#F4E8C9` e boca feita com uma curva curta. A base é plana, sem textura ou gradiente, e usa formas que podem ser redesenhadas com círculos, retângulos arredondados e curvas. As seis cores de agente conferem com `windows/src/island/agents.ts` e `windows/src/core/pills.ts`; índigo e areia do genérico vêm da paleta em `windows/src/lumen/compass.ts`. Cada personagem ocupa uma caixa de 96 × 96 px no lineup; `teste-22px.png` mostra cada um com 22 px de largura real.

| Personagem | Silhueta e acessório | Primitivas para Canvas | Cores |
|---|---|---|---|
| Claude Code | Página vertical com canto dobrado e marcador pequeno; calmo, cuidadoso e escritor. | Retângulo arredondado, triângulo arredondado do canto, retângulo com ponta curva do marcador, elipses e curvas. | Corpo `#F5F6F8`; marcador e luz dos olhos `#F4E8C9`; contorno, pupilas e boca `#26224B`. |
| Codex | Quadrado arredondado compacto com pequena aba de ferramenta; focado e rápido. | Retângulo arredondado, aba retangular arredondada, elipses e curvas. | Corpo `#2DD4BF`; aba e luz dos olhos `#F4E8C9`; contorno, pupilas e boca `#26224B`. |
| ChatGPT | Forma circular com uma pequena ponta lateral de balão, sem qualquer marca; conversador e prestativo. | Círculo ou elipse, pequeno triângulo arredondado, elipses e curvas. | Corpo `#10A37F`; luz dos olhos `#F4E8C9`; contorno, pupilas e boca `#26224B`. |
| Antigravity | Gota vertical macia acompanhada por duas bolinhas flutuantes; leve e brincalhão. | Curva Bézier fechada para a gota, dois círculos, elipses e curvas. | Corpo e bolinhas `#E879F9`; luz dos olhos `#F4E8C9`; contorno, pupilas e boca `#26224B`. |
| Gemini CLI | Dois volumes arredondados unidos, com um único rosto compartilhado; curioso e duplo. | Dois círculos ou elipses parcialmente sobrepostos, elipses menores e curvas. | Corpo `#8AB4F8`; luz dos olhos `#F4E8C9`; contorno, pupilas e boca `#26224B`. |
| OpenCode | Retângulo alto arredondado com arco aberto simples e pequeno retalho de oficina; artesão e aberto. | Retângulo arredondado, arco por curva ou semicírculo, pequeno retângulo arredondado, elipses e curvas. | Corpo `#4ADE80`; retalho `#F4E8C9`; contorno, pupilas e boca `#26224B`. |
| Genérico | Retângulo arredondado areia com contorno e oval índigo; neutro e simpático. | Retângulo arredondado, elipse, elipses dos olhos e curvas. | Areia `#F4E8C9`; índigo `#26224B` no contorno, pupilas, boca e oval inferior. |

## Mudanças por estado

As alterações ficam no olhar, na boca, numa inclinação pequena ou em bolinhas simples. A silhueta, o acessório e as cores do personagem continuam iguais entre estados.

| Estado | Desenho de referência | Ideia para Canvas |
|---|---|---|
| Parado | Olhos abertos e sorriso pequeno. | Pupilas centradas; curva de boca ascendente curta. |
| Pensando | Olhar atento e duas bolinhas de pensamento ao alto. | Deslocar as pupilas dentro das mesmas elipses; desenhar dois círculos areia pequenos. |
| Trabalhando | Olhar focado e leve inclinação para a frente. | Reduzir o espaço entre pupila e borda inferior; inclinar a forma inteira poucos graus. |
| Dormindo | Olhos fechados em arcos, boca relaxada e duas bolinhas acima. | Trocar elipses dos olhos por curvas; desenhar dois círculos pequenos. |
| Aguardando aprovação | Olhar atento e um ponto areia cercado por dois arcos discretos na cor do personagem. | Olhos abertos; traçar dois arcos curtos e um círculo, sem brilho ou animação. |
| Pergunta | Leve inclinação e boca pequena arredondada aberta. | Inclinar o corpo poucos graus; trocar a curva da boca por um círculo ou elipse pequena. |
| Erro | Olhos preocupados e boca voltada para baixo; triste, nunca assustado. | Baixar um pouco as pupilas; desenhar uma curva de boca descendente curta. |
| Concluído | Olhos em arcos felizes, sorriso maior e duas bolinhas. | Fechar os olhos em curvas; ampliar a curva da boca; desenhar dois círculos pequenos. |

## Arquivos

- `lineup.png` e `lineup-transparente.png`: sete poses paradas, cada personagem em caixa de 96 × 96 px, com nomes em pt-BR.
- `claude-code-estados.png`, `codex-estados.png`, `chatgpt-estados.png`, `antigravity-estados.png`, `gemini-cli-estados.png`, `opencode-estados.png`, `generico-estados.png`: uma grade de oito estados por agente, com rótulos em pt-BR sobre preto.
- `*-estados-transparente.png`: as mesmas pranchas, com fundo transparente.
- `teste-22px.png`: os sete personagens em 22 px reais de largura sobre preto; a ordem é a mesma do lineup.
- `claude-marca-mascote-estudo.png` e `claude-marca-mascote-estudo-transparente.png`: uma variação exploratória isolada, feita depois do lineup a pedido do proprietário. Usa como referências visuais as pinças de um caranguejo e um motivo radial coral; não incorpora um arquivo oficial de logo ou ilustração.

As sete pranchas da família original não incluem logotipos, símbolos ou mascotes oficiais. O estudo pontual do Claude fica separado para comparação e não foi aprovado para o app nem para distribuição. A família original tem aceite visual explícito de 2026-11-13. A revisão técnica da L1.4b levou à escolha do Canvas pelo proprietário na mesma data; o protótipo permanece fora do app até a L1.4d.
