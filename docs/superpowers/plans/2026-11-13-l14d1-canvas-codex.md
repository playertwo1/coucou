# Plano — L1.4d-1 base Canvas e Codex

1. Registrar a escolha explícita do Canvas em 2026-11-13 e delimitar L1.4d-1 sem alterar o aceite visual anterior.
2. Implementar o engine compatível com as leituras públicas dos callers Windows, usando somente primitivas Canvas originais. Conferir chamadas de `island.ts`, `minibots.ts`, hub/recap/pill/desktop e manter as APIs necessárias.
3. Aplicar o agente de `State.focusTask.id` na ilha e `AgentTask.id` nas mini pílulas. Usar guardas estruturais para não alterar a renderização Mochi fora do alias Win32; no d1, Codex é próprio e os demais caem no genérico.
4. Criar a página de desenvolvimento com a matriz completa de sete agentes × 11 estados, amostras 22/96 px, DPR 1/1,5/2 e referências PNG estáticas dos seis desenhos ainda não implementados. Não incluí-la nas entradas Vite de release.
5. Acrescentar testes Canvas com contexto mínimo instrumentado para estados/emotes, mapa e fallback, `busy` em repouso e `prefers-reduced-motion`.
6. Rodar os quatro comandos solicitados; revisar diff, ausência de timers/RAF próprio e conteúdo público sem caminhos pessoais; atualizar evidência como implementação sintética pronta para inspeção visual.
7. Fazer um commit em pt-BR para d1, enviar somente para `origin`, mostrar a página/link ao proprietário e parar antes de d2.

## Rollback

Um único `git revert` do commit da L1.4d-1 remove engine/integrações/página/testes desta subetapa. Manter decisão Canvas e referências L1.4a/b.
