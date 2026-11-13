# Notificações nativas de permissão no Windows

Roadmap: Fase 2.1. Status: mini-spec aprovada pelo proprietário em 2026-11-12 nesta conversa. O proprietário também autorizou exceção pontual ao checkout limpo para executar somente a prova 2.1a, preservando as alterações locais e sem commit. Integração 2.1b ainda não autorizada por essa exceção.

## Descoberta verificada em 2026-11-12

- `windows/src/island/hooks.ts` aceita pedidos somente dos agentes já suportados por `takesCard`, separa perguntas de permissões, limita a fila a cinco e reconhece pedidos com `Bridge.approvalAck`. Pausa, excesso de pedidos e agentes sem suporte devolvem a pergunta ao terminal. Manter essas decisões.
- `windows/src/core/bridge.ts` encaminha `approval_decision`, `approval_ack` e `approval_decline` a `windows/src-tauri/src/lib.rs`.
- `windows/src-tauri/src/pipe.rs` mantém remetentes por `request_id`. `ACK_TIMEOUT` é 800 ms e `DECISION_TIMEOUT` é 108 s depois do reconhecimento; o relay tem seu próprio limite. `send` remove o pedido ao decidir. Uma resposta para um ID removido não alcança outro pedido.
- Não foi encontrado backend de toast nem plugin de notificações no manifesto. O crate `windows` já existe; habilitar módulos de notificações/XML é a primeira opção a investigar, sem adicionar dependência por rotina.
- O app distribui NSIS e MSI, com identificador `fr.louisraille.coucou`. Esse identificador não prova registro de identidade de toast nem ativação dos botões. Falta validar o registro necessário nos dois instaladores e na execução dev.
- Não foi localizada detecção dedicada de tela cheia no módulo Windows. Ela é descoberta própria da 2.2, não deve ser presumida pronta.
- Checkout com alterações locais da 1.6; após fetch, `upstream/main...HEAD` = `0 35`. Nenhum código novo desta etapa pode começar enquanto esse bloqueio persistir.

## Comportamento proposto

1. Windows apenas, Coucou em execução. Não reabrir o aplicativo por um toast antigo nem criar um protocolo público que aceite `allow` por linha de comando.
2. Registrar a visibilidade da ilha antes de o pedido abri-la. Se estava escondida, oferecer toast além do card existente. Com a ilha visível, manter somente o card. A 2.1 não oculta a ilha nem altera posição ou IDs de pílulas.
3. Inicialmente, tela cheia conserva o comportamento existente do card e o fallback do terminal. A integração com detecção de tela cheia fica explicitamente pendente da 2.2 e não conta como aceite comprovado da 2.1.
4. Toast apenas para uma permissão que já foi aceita pelo roteamento atual. Perguntas com alternativas, pedidos recusados e pedidos sem ID não ganham botões de decisão. Não reconhecer um pedido só porque se tentou exibir toast; manter o reconhecimento do fluxo atual do card.
5. Ações: Permitir e Negar. Clicar no corpo abre o card correspondente sem decidir. Fechar, expirar, falhar ao exibir ou não interagir nunca significa permitir ou negar; o card e o prazo do terminal continuam como hoje.
6. Mostrar nome do agente, ferramenta e resumo do alvo. Não incluir prompt, saída de ferramenta, conteúdo de arquivo, caminho completo, token ou credencial. Se não for possível apresentar um resumo completo e seguro do alvo, Permitir abre o card para revisão e exige o clique final no card; nunca aprovar um comando oculto por truncamento ou redação. Negar pode encerrar o pedido exato. Validar escaping de XML e comprimentos.
7. O callback nativo vincula uma ação permitida a um identificador opaco, criado por execução do app. Um registro em memória associa esse identificador a `request_id`, sessão, agente e prazo. Não confiar em dados arbitrários de argumentos de ativação. Nenhum conteúdo do pedido fica no argumento.
8. Antes de decidir, validar a associação, existência do pedido, prazo e ação. Usar uma única operação de consumo para card, toast e demais superfícies; primeiro clique válido vence. A ação deve percorrer o mesmo tratamento de decisão/recap do card, sem duplicar registros. Só o pedido consumido desaparece da fila; se outro card está na frente, mantê-lo.
9. Expiração do toast não ultrapassa o prazo real do pedido no backend. Invalidar e remover toast quando houver decisão, desconexão, fim do turno, pausa ou timeout. A validade em memória é obrigatória mesmo que o Windows ainda exiba uma notificação antiga. Reiniciar o app invalida todas as associações.
10. Notificações desabilitadas, Não perturbe ou falha de registro mantêm card/terminal; não mudar configurações do Windows. Nenhum som adicional ao já usado pelo pedido.
11. Frases novas em `windows/src/i18n/extra.json`, nas 13 línguas, com a verificação existente. Card, pílulas e demais telas mantêm o visual atual.

## Divisão antes de implementar

- **2.1a — Viabilidade nativa:** depois de checkout limpo, provar toast sintético com botões e callback no processo em execução usando as APIs já acessíveis. Nada conectado a permissões reais. Identificar registro/AUMID/ativação e desinstalação corretos para NSIS e MSI; não usar identidade de outro aplicativo. Se exigir dependência adicional ou mudança de instalação maior, revisar esta proposta antes de continuar. Sem essa prova, não declarar a API adequada.
- **2.1b — Integração e testes:** só depois de 2.1a validada e proposta aprovada, integrar identificação, decisão única, fila e remoção. Sem alterar timeouts existentes como atalho para viabilizar toasts.
- **2.1c — Prova no aplicativo:** usar pedidos sintéticos, exercitar botões por clique humano e registrar versão, Windows, pacote, cenário e resultado. Tela cheia fica pendente até a integração validada da 2.2. Nenhum checkpoint é fechado por compilação.

## Arquivos e interfaces previstos

- Novo `windows/src-tauri/src/permission_notifications.rs`: registro volátil de associações, exibição/remoção e callback WinRT. Nomes finais dependem da prova 2.1a.
- `windows/src-tauri/Cargo.toml`, `src/lib.rs`: recursos da dependência Windows existente, inicialização e comandos internos de exibição/remoção. Não exportar um comando genérico de aprovação por toast.
- `windows/src-tauri/src/pipe.rs`: consultar/consumir pedido válido e unificar o ciclo de encerramento. `recap` deve registrar apenas decisão realmente consumida, uma vez; localizar todos os chamadores antes de mudar a interface.
- `windows/src/island/hooks.ts`, `windows/src/core/bridge.ts`, `windows/src/core/state.ts`: visibilidade anterior, publicação do pedido aceito, fila e reconciliação da decisão de outra superfície com o card.
- `windows/src-tauri/nsis/hooks.nsh` e configuração MSI: tocar somente se a descoberta demonstrar que o registro de identidade é necessário. Preservar identificadores e remover apenas registro pertencente ao Coucou na desinstalação.
- `windows/tests/hooks.test.mjs` e testes Rust do registro/pipe: regressões de roteamento e corrida. `windows/src/i18n/extra.json`: textos traduzidos.

## Aceite e verificações

- Dois pedidos simultâneos de sessões diferentes: cada botão decide somente seu pedido, incluindo o que está na fila; não troca nem encerra o card do outro.
- Clique duplicado, card contra toast, argumento inválido, ID ausente/forjado, pedido resolvido no terminal, fim de sessão, timeout e reinício: nenhuma segunda decisão nem decisão em pedido novo.
- Fechar/ignorar/expirar toast e falha de notificação: zero aprovações; o terminal retoma conforme o protocolo existente.
- Nenhum reconhecimento adicional estende a espera. A fila continua com limite de cinco. Perguntas não recebem `allow`/`deny`.
- Resumo que perderia contexto ao ser reduzido ou redigido exige revisão no card. XML malicioso e Unicode não mudam a estrutura dos botões.
- Manual: ilha visível, escondida, dois pedidos, negação, permissão por clique explícito, expiração e notificações indisponíveis; pacotes NSIS e MSI. Tela cheia exige prova posterior e permanece pendente.
- Comandos: `cargo test --lib`, `npx tsc --noEmit`, `npm test`, `npm run build`, `node scripts/gen-strings.mjs --check`. Não executar aprovação real durante testes automatizados.

## Rollback

Desabilitar o backend de toast e remover seus callbacks/associações restaura o card e o terminal existentes. Não migrar configurações de agentes nem gravar permissões permanentes. Se houver registro de identidade no instalador, documentar os recursos exatos e remover somente os pertencentes ao Coucou; nunca apagar registros de outros apps.

## Decisão posterior do proprietário (2026-11-12)

O proprietário autorizou concluir e aprovar sinteticamente a 2.1b, publicar uma versão de avaliação e avançar no roadmap antes da prova do callback nativo da 2.1a. O fluxo de avaliação mantém Allow abrindo o cartão para revisão quando o resumo é genérico; Deny usa a decisão única do pipe. Isso não transforma o resultado inconclusivo da Shell em aceite real. A validação real será feita pelo proprietário após atualizar o aplicativo.

## Referências primárias

- [Evento Activated: clique/toque e assinatura pelo app em execução](https://learn.microsoft.com/en-us/uwp/api/windows.ui.notifications.toastnotification.activated).
- [ExpirationTime: prazo após o qual a notificação não deve ser exibida](https://learn.microsoft.com/en-us/uwp/api/windows.ui.notifications.toastnotification.expirationtime). Esse prazo não substitui a validação do pedido no Coucou.
- [Esquema dos botões de toast](https://learn.microsoft.com/en-us/uwp/schemas/tiles/toastschema/element-action).
- [Toast para app desktop e identidade](https://learn.microsoft.com/en-us/windows/win32/shell/quickstart-sending-desktop-toast).
