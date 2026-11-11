# Contexto da janela ao arrastar Mochi — plano de implementação

**Status:** rascunho condicionado à aprovação da mini-spec `docs/superpowers/specs/2026-11-10-window-context-attach-design.md`.

## Escopo

Windows somente. Sem alterações nos fluxos de arquivo, nos estilos existentes, nas configurações dos agentes ou em instalações do usuário.

## Etapas

1. Implementar e testar a seleção da janela externa sob o cursor no solto; excluir Coucou e superfícies do desktop e extrair só app/processo e título.
2. Anexar o contexto ao evento do Mochi, restaurá-lo à origem e ligar o contexto ao estado do Chat sem apagar histórico.
3. Reutilizar o chip existente; manter o contexto pendente em falha e consumi-lo após sucesso.
4. Atualizar os adaptadores de Chat para que o contexto de janela possa acompanhar o próximo turno em uma conversa existente; manter contexto de arquivo restrito ao primeiro turno.
5. Rodar `cargo test --lib` em `windows/src-tauri`, `npx tsc --noEmit` e `npm test` em `windows`.
6. Executar `npm run tauri dev` em `windows` para a verificação manual de origem ilha/desktop, Chat vazio/com histórico e alvo não identificável.
7. Registrar os resultados na Fase 1.1. Não fazer commit sem pedido explícito.

## Pontos a conferir

- A coordenada do hit-test corresponde ao cursor no instante do solto e funciona com escalas de tela diferentes.
- Um contexto novo não vaza para mensagens seguintes nem se perde quando o envio falha.
- Alvo não identificado segue o comportamento atual e não inicia um contexto vazio.
