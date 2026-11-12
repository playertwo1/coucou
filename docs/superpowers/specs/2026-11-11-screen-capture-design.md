# Captura de uma área da tela — proposta

Roadmap: Fase 1.6 (`docs/roadmap/fase-1-recursos-mac.md`). Aplicativo Windows em `windows/`.

**Status:** proposta em 2026-11-11. Aguarda aprovação do proprietário. Sem código até lá.

## O que o Mac faz

`⌘⇧S` dobra a ilha e abre o seletor do sistema (`screencapture -i`). Esc cancela e não deixa arquivo. A imagem fica em `CoucouCaptures` na pasta temporária; só as 20 últimas permanecem. O Mochi engole a imagem e a ilha oferece colar na app que estava na frente, copiar, anotar, ou perguntar no Chat. Com o Flow, ditar em até 3 min cola a imagem e depois as palavras. A imagem só sai da máquina nesse colar ou nessa pergunta.

## O que o Windows já tem

Não há atalho nem comando de captura. O Chat anexa um arquivo solto como caminho no contexto do turno; nenhum provedor recebe os bytes da imagem.

## Proposta

- Atalho novo, desligado até o proprietário escolher a combinação. Ele não reutiliza Win+Shift+S.
- Abrir o recorte do próprio Windows (`ms-screenclip:`). Esc do sistema cancela e não cria arquivo.
- Quando o recorte terminar, ler o PNG da área de transferência e gravar em `%TEMP%\CoucouCaptures`, no máximo 20 arquivos. Não ler a área de transferência em nenhum outro momento.
- A ilha mostra o card com colar, copiar e perguntar no Chat. Anotar e o Flow ficam para uma subfase seguinte.
- Colar devolve o PNG à app que estava na frente e restaura a área de transferência. Copiar deixa o PNG nela.
- Perguntar no Chat usa o chip de arquivo que já existe. Enviar os bytes da imagem a um provedor fica fora desta subfase, porque o Chat ainda não faz isso.
- Cancelar apaga o arquivo desta captura. As outras 19 podem ficar na pasta temporária.

## Fora desta proposta

Anotação, Flow, miniatura arrastável da tela inteira, e visão de imagem no modelo.

## Aceite, quando aprovada

Esc não deixa arquivo. O PNG fica na pasta temporária até colar, copiar ou perguntar. Cancelar apaga o arquivo desta captura. Nada é enviado a um provedor.
