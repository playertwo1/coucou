> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase 1 — Recursos do Mac ainda não escolhidos

Regra: cada item abaixo começa por descoberta e aprovação de um mini-spec. A implementação não começa enquanto a interação exata estiver indefinida.

### 1.1 — Arrastar Mochi sobre uma janela para anexar contexto (M)

- [x] Ler `NotchBuddy/Sources/App/WindowContextCapture.swift`, `IslandWindowController.windowContextAtPoint` e `DesktopMochi.handleDragRelease`; localizar o fluxo Windows de arraste e contexto do Chat.
- [ ] Definir em spec: janela-alvo, tipos de arquivo aceitos, destino (Chat atual ou novo), feedback e comportamento quando a janela/app não puder ser identificada.
- [ ] Aprovar a spec; manter o visual existente e os limites de acesso aos arquivos.
- [ ] Adicionar testes para caminho com espaços/Unicode, arquivo inexistente e destino ausente.
- [ ] Implementar o menor fluxo Windows que anexa o arquivo ao contexto sem movê-lo nem sobrescrevê-lo.
- [ ] Testar manualmente com um arquivo de texto e outro formato já aceito pelo Chat.
- Checkpoint: o anexo correto aparece no contexto; casos inválidos não abrem arquivo diferente nem mudam dados existentes.

### 1.2 — Arquivo solto → rascunho no Outlook clássico (M)

- [x] Inspecionar o COM do Outlook em `mail/outlook.rs`/`mail/mod.rs`, a validação da inbox em `files.rs` e o fluxo de arquivo → e-mail em `IslandViewContent.swift` no Mac.
- [x] Fixar o comportamento de destino/assunto/corpo no mini-spec: abrir rascunho do Outlook com o anexo, sem destinatário presumido e sem enviar.
- [x] Aprovar a spec; qualquer envio continua dependendo do clique explícito do usuário em Outlook.
- [x] Testes automatizados: arquivo regular da inbox, ausente, diretório e fora da inbox; quoting de caminho e assunto Unicode; falha de Outlook mantém o contexto.
- [x] Testar manualmente com arquivo sintético: Outlook clássico indisponível e disponível; conferir assunto/anexo/destinatário/corpo e fechar sem enviar.
- [x] Implementar rascunho/attachment; o script usa `Display()` e nunca chama “Send”.
- Checkpoint: rascunho abre com o arquivo escolhido; nenhum e-mail sai sem clique; falha não apaga o arquivo.

**Status (2026-11-11): parcial —** mini-spec aprovada; implementação e testes automatizados concluídos. O comando Rust valida o arquivo canônico como filho regular da inbox antes de chamar o COM; o builder do rascunho define o assunto pelo nome do arquivo, anexa a cópia da inbox e chama somente `Display()`. A ação aparece no seletor de canvas do upload e na tela DOM, após a cópia terminar; em falha, o arquivo continua como contexto e na inbox. `cargo test --lib` (614 aprovados, 6 ignorados), `npx tsc --noEmit` e `npm test` (584 aprovados) passaram. O teste de link simbólico está condicionado a Unix; não foi executado neste Windows. A tentativa manual encontrou apenas o Outlook novo (`olk.exe`); `GetActiveObject` retornou `MK_E_UNAVAILABLE` e nenhum rascunho abriu. O teste com Outlook clássico continua pendente; checkpoint não fechado.

**Diagnóstico (2026-11-11): parcial, sem defeito de código encontrado —** o Outlook clássico 64-bit (Click-to-Run 16.0) está instalado e registrado no COM (`Outlook.Application` → `OUTLOOK.EXE` 64-bit), e nenhuma chave redireciona o clássico para o novo. Na verificação, só o `olk.exe` rodava na sessão do usuário; `OUTLOOK.EXE` não estava aberto. O log de eventos mostra que o clássico rodou uma vez por cerca de 15 minutos, numa **primeira execução**: criou o perfil e a OST, baixou calendário e OAB e exibiu um alerta inicial. Depois fechou, sem evento de falha. O mesmo prelúdio do app (`powershell.exe` de System32, `-NoProfile -NonInteractive -ExecutionPolicy Bypass -File`, script com BOM, 64-bit, não elevado, sessão 1) retornou `MK_E_UNAVAILABLE` com e sem `APPDATA`/`LOCALAPPDATA` redirecionados: os diretórios temporários da instância dev não influem, porque a ROT depende de sessão e elevação, não dessas variáveis. Para esse caso, o app mostra o texto cru `Outlook is not open`; `mail_draft` não registra o erro, então a mensagem vista na tentativa não foi recuperada por log. Próximo passo manual: com o Outlook clássico aberto e ocioso na caixa de entrada (perfil já criado, sem diálogo), confirmar que `GetActiveObject` responde e repetir o rascunho na instância dev, não elevada como o Outlook.

**Correção (2026-11-11): parcial —** com o Outlook clássico aberto, `GetActiveObject` respondeu. Causa corrigida: o Office só entra na tabela de objetos em execução depois de perder o foco pela primeira vez, então um Outlook recém-aberto parecia fechado. O prelúdio COM, compartilhado por rascunho, lista e busca, agora tenta `GetActiveObject` primeiro. Se falhar e houver `OUTLOOK.EXE` na mesma sessão, usa `New-Object -ComObject Outlook.Application`, que devolve a instância aberta (Outlook é instância única); sem o processo, continua respondendo `notRunning` e nunca abre o Outlook. Testado no PowerShell 5.1 com o prelúdio extraído do código: caminho normal, falha forçada do `GetActiveObject` (4 vezes, sempre a instância aberta com 1 janela, sem processo extra restante) e processo ausente (`notRunning`, sem chamar `New-Object`). A falha do rascunho agora mostra uma mensagem traduzida nas 14 línguas ("Abra o Outlook clássico e tente de novo."). `cargo test --lib` (614 aprovados, 6 ignorados), `npx tsc --noEmit` e `npm test` (584 aprovados) passaram. Falta o teste manual do rascunho na instância dev: anexo, assunto, sem destinatário e fechar sem enviar.

**Teste manual (2026-11-11): FAIL —** dois defeitos na instância dev.
1. *Arrastar parava na barra.* Corrigido no código, falta confirmar à mão. Causa: com a ilha fechada, `alert("upload")` chama `fsm.forceHome()`, cuja transição abre `expand(openingView())`. A passagem pela vista padrão fazia `stopSequenceIfLeaving` desligar a sequência de upload recém-iniciada, e a barra ficava parada até um clique. Só acontecia na primeira soltura com a ilha fechada; com a ilha aberta, `forceHome` não faz nada. Correção: durante `alert(view)`, `openingView()` devolve a própria `view`. Há teste em `tests/upload.test.mjs`. O defeito não vem da 1.2: o código é anterior.
2. *Clicar em e-mail derruba o Outlook clássico.* Aberto. Pelo app, reproduziu 5 vezes, sempre `0xc0000005` no `OUTLOOK.EXE` no mesmo deslocamento, inclusive no Outlook reiniciado pelo Windows; o app mostra `0x800706BE` (falha de RPC). O mesmo script, com o mesmo arquivo e o mesmo ambiente, chamado do terminal, nunca derrubou o Outlook: rascunho vazio, `.txt`, PDF e saída logo após `Display()`. Diferenças restantes: o app inicia o PowerShell sem console (`CREATE_NO_WINDOW`), e no clique a janela em primeiro plano é a ilha. Próximo passo: com o Outlook clássico aberto, testar a mesma chamada com `CreateNoWindow` a partir do terminal para separar as duas hipóteses. As falhas do rascunho agora vão para o log do app (`[mail] draft:`).

**Correção do crash e teste manual (2026-11-11): PASS, relatado pelo proprietário —** checkpoint fechado.
- *Causa.* `canonical_file_in_dir` usa `Path::canonicalize()`, que no Windows devolve o caminho verbatim (`\\?\C:\…`), e `mail_draft` o passava direto a `Attachments.Add`. O Outlook clássico (16.0.20527.20150, 64-bit) morre dentro dessa chamada com esse prefixo. As hipóteses anteriores (PowerShell sem console, ilha em primeiro plano, Outlook minimizado) foram descartadas; os testes do terminal passavam porque usavam o caminho normal.
- *Evidência.* Um trace temporário no script mostrou a morte dentro de `Attachments.Add`. Do terminal, com o Outlook aberto pelo proprietário e um `.txt` sintético: o caminho `C:\…` anexou e o rascunho foi descartado com `Close(1)`, Outlook vivo; o mesmo arquivo com `\\?\C:\…` derrubou o Outlook com a mesma assinatura do app (`0x800706BE` no cliente, `0xc0000005` no `OUTLOOK.EXE`, mesmo deslocamento). Nada foi enviado.
- *Correção.* `outlook::plain_path` tira o prefixo verbatim só do que vai ao Outlook (`\\?\C:\…` → `C:\…`, `\\?\UNC\servidor\pasta` → `\\servidor\pasta`); a validação canônica em `files.rs` não mudou. Teste unitário da conversão e do `draft_script` com o caminho normalizado. O trace temporário foi removido.
- *Verificação.* `cargo test --lib` (614 aprovados, 6 ignorados), `npx tsc --noEmit` e `npm test` (585 aprovados) passaram. Na instância dev isolada, recompilada com a correção, o proprietário soltou um arquivo e clicou em e-mail: o rascunho abriu com o anexo, assunto = nome do arquivo, sem destinatário, e o Outlook continuou aberto; fechado sem enviar. Depois disso, nenhuma falha `[mail] draft:` no log do app e nenhum evento de falha do Outlook. O caso "Outlook indisponível" foi exercitado antes, no mesmo dia (log `Outlook is not open`). O corpo do rascunho não foi relatado à parte. O arrastar parado na barra (item 1 acima) também foi confirmado pelo proprietário.
- *Entrega.* Commit `fba05ee` na `main`, enviado ao `origin` a pedido do proprietário: o recurso 1.2, os consertos acima, o teste `tests/upload.test.mjs`, a spec e o plano. Sem tag nem release. Em aberto, fora do checkpoint: conferir o corpo do rascunho, repetir o caso "Outlook fechado" depois da correção e acompanhar o CI desse push.

### 1.3 — Portfólio de cripto, somente leitura (G)

- [ ] Obter decisão do proprietário sobre exchanges/carteiras suportadas e dados a exibir (saldo, ativos, moeda de conversão).
- [ ] Definir permissões somente leitura, armazenamento de credenciais no serviço seguro existente, atualização e dados locais no mini-spec.
- [ ] Não implementar até as fontes e os campos serem escolhidos; chaves de saque, transações e trading ficam fora.
- [ ] Com decisão aprovada, criar fixtures sem credenciais e testes para saldo vazio, resposta incompleta, limite de API e erro de rede.
- [ ] Implementar uma fonte por subfase; conferir total/moeda sem arredondamento enganoso.
- Checkpoint: credencial nunca aparece em log, nenhum endpoint de escrita é chamado e os valores batem com a fonte.

### 1.4 — Cal.com em calendário em vez de lista (P)

- [ ] Ler `NotchBuddy/Sources/App/CalcomPoller.swift` e o card/lista atual no Windows.
- [ ] Definir janela temporal, navegação, fuso horário, eventos simultâneos e estados vazio/erro no mini-spec.
- [ ] Aprovar o desenho antes de alterar uma tela existente.
- [ ] Testar paginação, mudança de dia/fuso, ausência de eventos e erro de autenticação.
- [ ] Implementar a visualização preservando dados e comandos atuais de abertura do evento.
- Checkpoint: datas/horas correspondem ao fuso escolhido e não há evento duplicado ou perdido nos limites da página.

Apple Music continua fora do escopo Windows.

**Status (2026-11-10): parcial —** a descoberta confirma que o recurso Mac arrasta o Mochi sobre uma janela para anexar metadados da janela. O roadmap misturava esse gesto com o fluxo separado de arquivo solto (tipos de arquivo, caminhos e cópia); a mini-spec proposta esclarece o escopo e aguarda aprovação do proprietário. Implementação não iniciada.
