# Arquivo solto → rascunho no Outlook clássico — plano de implementação

**Status:** implementação e testes automatizados concluídos em 2026-11-11; verificação manual pendente.

## Escopo

Windows somente. Criar rascunho visível e nunca enviar. Não iniciar Outlook, não tocar na configuração global de e-mail e preservar arquivo original e cópia da inbox.

## Etapas

1. [x] Extrair para `files.rs` a validação canônica do arquivo regular da inbox e reutilizá-la em `chat.rs`; cobrir arquivo válido, inexistente, diretório e caminho externo. O teste de link externo roda apenas em Unix.
2. [x] Adicionar builder COM de rascunho em `mail/outlook.rs`; cobrir quoting com Unicode/aspas e afirmar que o script chama `Display()` sem `Send()`.
3. [x] Adicionar comando Tauri `mail_draft`, validando o arquivo antes de executar Outlook; registrar em `lib.rs` e `core/bridge.ts`.
4. [x] Acrescentar **Send by email** ao cartão de escolha em `upload/canvas.ts` e `views/upload.ts`, preservando as posições atuais no canvas; habilitar as ações após a cópia à inbox. Em falha, manter o arquivo; após sucesso, mostrar a confirmação e limpar só o contexto em memória. Adicionar tradução da confirmação.
5. [x] Rodar `cargo test --lib` (614 aprovados, 6 ignorados), `npx tsc --noEmit` e `npm test` (584 aprovados).
6. [ ] Pedir a verificação manual do proprietário em `npm run tauri dev` com arquivo sintético e Outlook clássico. Confirmar o rascunho e fechar sem enviar.
7. [x] Registrar os resultados na Fase 1.2. Não fazer commit sem pedido explícito.

## Pontos a conferir

- Entradas da WebView não conseguem anexar caminhos fora da inbox, inclusive via symlink.
- Arquivo removido entre upload e clique não abre um rascunho incompleto e não apaga o original.
- O script de rascunho não reutiliza `send_script` nem contém uma chamada `Send()`.
- Outlook indisponível ou timeout deixa a cópia da inbox intacta.
