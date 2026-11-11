# Arquivo solto → rascunho no Outlook clássico — desenho

Roadmap: Fase 1.2 (`docs/roadmap/fase-1-recursos-mac.md`). Aplicativo Windows em `windows/`.

**Status:** mini-spec aprovada pelo proprietário; implementação e testes automatizados concluídos em 2026-11-11; verificação manual pendente.

## Objetivo

Depois que um arquivo for solto na ilha e copiado para a inbox do Coucou, permitir que o usuário escolha **Send by email** para abrir um rascunho no Outlook clássico com esse arquivo anexado. O fluxo nunca envia a mensagem.

## Descoberta

- O Mac oferece a ação de e-mail depois do arquivo solto. No build normal, a tela pede destinatário e só envia depois do botão; o padrão de assunto é o nome do arquivo. Esta fase propõe o fluxo Windows mais restrito que consta no roadmap: abrir um rascunho sem destinatário e sem envio.
- `windows/src-tauri/src/mail/outlook.rs` já usa COM `GetActiveObject('Outlook.Application')` e não inicia o Outlook. O Outlook novo não expõe esse objeto COM.
- O mesmo arquivo contém `send_script`, que chama `$m.Send()` e é usado por um fluxo de plano de e-mail após clique. Esse script não serve para esta feature; o rascunho precisa de um builder separado que chame apenas `Display()`.
- `files::ingest` copia o arquivo original para a inbox privada do Coucou, sem sobrescrever nomes existentes. O caminho que vem da WebView é entrada não confiável. `chat.rs` já valida arquivos dentro da inbox, mas o helper atual é privado ao módulo.
- A tela Windows de escolha após upload tem “Perguntar ao Chat” e “Cancelar”. “Send by email” já consta na tabela de traduções compilada.
- Durante a sequência de upload, a tela ativa é desenhada em `upload/canvas.ts`; `views/upload.ts` mantém a implementação DOM correspondente. A ação precisa existir nos dois caminhos.

## Comportamento proposto

1. O arquivo só abre como anexo depois do clique em **Send by email** no cartão de escolha após upload; soltar o arquivo, por si só, não abre Outlook.
2. Criar o rascunho no Outlook clássico já em execução, pelo COM existente. Não iniciar processo nem mudar para o Outlook novo. Se COM não estiver disponível, mostrar erro no cartão de nota existente e manter o arquivo na inbox.
3. Deixar destinatário vazio e usar o nome do arquivo, com extensão, como assunto. Não preencher o corpo; preservar a assinatura que o Outlook inserir conforme a configuração do usuário.
4. Anexar o arquivo copiado dentro da inbox do Coucou. No comando Rust, canonizar e validar que o caminho é um arquivo regular diretamente dentro da inbox. Rejeitar arquivo ausente, pasta, caminho fora da inbox ou link que escape dela antes de chamar Outlook.
5. Não mover, renomear, apagar ou sobrescrever o arquivo. Não chamar `Send()` em nenhum caminho desta feature. O usuário decide qualquer envio na própria janela do Outlook.
6. Erro do Outlook, timeout ou arquivo removido não apaga nem altera a cópia da inbox nem o original.
7. Reutilizar o estilo de botão já presente na tela e a tradução existente; não redesenhar o cartão.
8. Quando Outlook abrir o rascunho, mostrar a nota localizada `Draft opened in Outlook.` e limpar apenas o contexto do arquivo em memória para não deixar uma ação antiga selecionada. A cópia na inbox permanece. Em falha, mostrar a nota de erro existente e manter o arquivo na inbox.

## Pontos de integração previstos

- `windows/src-tauri/src/files.rs` e `chat.rs`: expor um único helper de validação para caminhos da inbox e reutilizá-lo no Chat e no comando de e-mail.
- `windows/src-tauri/src/mail/outlook.rs`: adicionar builder separado para criar item, anexar caminho, definir assunto e abrir com `Display()`. O teste deve afirmar que não há `Send()` e que aspas, espaços e Unicode são preservados.
- `windows/src-tauri/src/mail/mod.rs` e `windows/src-tauri/src/lib.rs`: comando Tauri que valida o caminho antes de executar o script.
- `windows/src/core/bridge.ts`, `windows/src/upload/canvas.ts`, `windows/src/views/upload.ts`, `windows/src/views/views.ts` e `windows/src/island/island.ts`: ação de escolha, chamada e erro; desabilitar as ações de arquivo até a cópia da inbox terminar; a cópia permanece associada ao arquivo até o usuário cancelar/descartar.
- `windows/src/i18n/extra.json`: localizar a confirmação nova de rascunho aberto; reutilizar a tradução existente de `Send by email`.
- Testes Rust para validação de caminho e script; testes TypeScript proporcionais para a ação e retenção do arquivo em caso de falha.

## Aceite

- Um arquivo válido abre um rascunho visível no Outlook clássico com o anexo correto, assunto igual ao nome do arquivo, destinatário vazio e corpo sem texto do Coucou.
- Após abrir, Coucou confirma o resultado sem manter o arquivo como contexto ativo; a cópia da inbox continua intacta.
- A automação usa somente `Display()`; nenhum e-mail é enviado.
- Arquivo inexistente, caminho fora da inbox ou diretório não abre rascunho e não modifica arquivos.
- Caminhos com espaços, aspas simples e Unicode são tratados corretamente.
- Outlook clássico fechado, Outlook novo ou falha de COM mostra erro e preserva arquivo e inbox.
- Verificação manual usa um arquivo sintético; confirma assunto/anexo/destinatário no rascunho e fecha sem enviar. Não usar conteúdo real do usuário.

## Fora do escopo

- Destinatário presumido, corpo gerado, envio automático, Resend ou chamada a `Send()`.
- Abrir ou iniciar Outlook quando estiver fechado; suporte ao Outlook novo.
- Mudanças no fluxo de planos de e-mail, nas regras do Mail ou no visual existente além da ação necessária.

## Risco e rollback

O Outlook pode inserir a assinatura configurada pelo usuário ao exibir um rascunho; o Coucou não altera essa configuração. Reverter o código remove a ação; rascunhos já abertos continuam sob controle do usuário. Arquivos de origem e cópias na inbox não são removidos pelo fluxo.
