# Anexar contexto da janela ao arrastar Mochi — desenho

Roadmap: Fase 1.1 (`docs/roadmap/fase-1-recursos-mac.md`). Aplicativo Windows em `windows/`.

**Status:** aprovada pelo proprietário em 2026-11-11, **com URL do navegador** (item 2 revisto abaixo).

## Objetivo

Arrastar Mochi sobre uma janela externa deve anexar ao próximo envio do Chat o nome do aplicativo e o título da janela. O histórico atual do Chat permanece visível e não é reiniciado.

## Descoberta

- No Mac, `IslandWindowController.windowContextAtPoint` identifica a janela externa no ponto solto. `WindowContextCapture` obtém o nome do app, título da janela e, para alguns navegadores, URL.
- O Mac envia metadados de janela; não captura conteúdo da página, imagem, clipboard ou arquivos.
- No Windows, `ChatContext::Window` e os adaptadores dos provedores já aceitam app, título e URL. `desktop.rs` ainda trata o solto como retorno à ilha ou reposicionamento; `chat.ts` só exibe e envia contexto de arquivo.
- A especificação atual da Fase 1.1 mistura o gesto de janela com o fluxo existente de arquivo solto na ilha. Esta proposta trata apenas do contexto de janela.

## Comportamento proposto

1. Ao soltar Mochi sobre uma janela externa identificável, usar o processo/app e o título dessa janela como contexto. Ignorar a própria Coucou, a área de trabalho, a barra de tarefas e janelas invisíveis.
2. Para navegadores (Chrome, Edge, Brave, Vivaldi, Opera, Firefox), ler a URL da barra de endereço pela UI Automation do Windows, como o Mac faz com AppleScript. A leitura tem limite de tempo; se falhar, demorar ou a barra estiver vazia, o contexto segue só com app e título. A URL é enviada como o navegador a mostra (o Chromium pode omitir `https://`); nada é inventado. Não capturar texto da página, screenshot, clipboard ou conteúdo de arquivos.
3. Abrir o Chat atual e exibir o contexto no chip já existente, sem alterar o estilo. Não apagar nem reiniciar o histórico.
4. Anexar os metadados uma única vez ao próximo envio do usuário, mesmo que o Chat já tenha mensagens. Se o envio falhar, manter o contexto pendente para a próxima tentativa. Depois de um envio bem-sucedido, o chip pode continuar visível, mas os metadados não são reenviados até outro arraste.
5. Só o arraste do Mochi que já está no desktop anexa contexto (decisão do proprietário em 2026-11-11, confirmada depois de saber que o Mac também anexa ao arrastar para fora da ilha: aqui, tirar da ilha arrastando continua sempre posicionando). Arrastar para fora da ilha continua só posicionando o Mochi. No sucesso, ele volta à posição anterior ao arraste. Reutilizar o som e a emote de aprovação existentes.
6. Se a janela/app não puder ser identificada, não alterar `promptContext`, não enviar metadados e manter o comportamento atual de soltar/reposicionar.
7. O gesto não lê, copia, move, renomeia ou sobrescreve nenhum arquivo. O fluxo de arquivo solto na ilha permanece separado e inalterado.

## Pontos de integração previstos

- `windows/src-tauri/src/platform/windows.rs`: identificar a janela sob o cursor no instante do solto e obter processo/app e título.
- `windows/src-tauri/src/desktop.rs`: anexar o resultado ao evento de solto e restaurar Mochi após um alvo válido.
- `windows/src/island/island.ts` e `windows/src/core/state.ts`: guardar contexto pendente e abrir o Chat.
- `windows/src/views/chat.ts`: mostrar app/título no chip existente e consumir o contexto uma vez por envio bem-sucedido.
- `windows/src-tauri/src/chat.rs` e adaptadores Claude, OpenAI compatível, CLI relay e modelos locais: aplicar o contexto no turno corrente, preservando a regra atual de anexar arquivo apenas ao primeiro turno.
- Testes Rust do hit-test/seleção e dos adaptadores; testes TypeScript proporcionais ao estado e envio.

## Aceite

- Arrastar o Mochi do desktop sobre uma janela externa identificável abre o Chat com app e título corretos no chip; o Mochi volta à origem. Arrastar da ilha continua só posicionando.
- O próximo pedido recebe os metadados uma vez, inclusive num Chat com histórico; o histórico anterior continua presente.
- Uma falha de envio mantém o contexto pendente; um envio bem-sucedido consome-o, sem reenviá-lo nas mensagens seguintes.
- Soltar sobre Coucou, desktop, barra de tarefas ou alvo não identificável não cria contexto e preserva o comportamento atual.
- Num navegador suportado, a URL da aba ativa entra no contexto; sem ela, app e título bastam.
- Nenhum arquivo é alterado e não há captura de página, screenshot ou clipboard.
- Verificação manual no Windows cobre origem ilha/desktop, Chat vazio/com histórico e alvo não identificável.

## Fora do escopo

- Arrastar arquivos diretamente sobre janelas, tipos de arquivo e cópia para inbox.
- Conteúdo de páginas, screenshots, clipboard ou leitura de arquivos.
- Alterações visuais, novos IDs de pílulas ou mudanças no fluxo de aprovação.

## Risco e rollback

O nome do app e o título da janela podem conter informação privada; só são enviados ao provedor selecionado depois do gesto explícito de arrastar e do próximo envio do usuário. O rollback é reverter as mudanças de código; o contexto fica apenas em memória e não cria dados persistentes.
