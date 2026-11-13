> **Histórico — substituído.** Rascunho da prova sintética 2.1a (2026-11-12), recuperado do stash em 2026-11-13. O modelo sintético atual é o da 2.1b (`windows/synthetic/fixtures.ts`: token por aviso, expiração e fechar/expirar sem decidir), e nele **Permitir abre o cartão** em vez de decidir, por decisão posterior do proprietário. Ver `docs/roadmap/fase-2-melhorias-windows.md`.

# Plano da prova sintética 2.1a

Spec: `docs/superpowers/specs/2026-11-12-synthetic-permission-notification-design.md`.

- [x] Especificar a prova sintética e restringi-la a `windows/synthetic`; preservar a árvore local e não tocar no host nativo, no registro, no atalho ou em configurações do Windows.
- [x] Adicionar roteamento puro do aviso sintético para Allow/Deny/Open/Dismiss/Failure/Timeout, vinculado ao ID pendente.
- [x] Mostrar o aviso dentro da janela sintética ao criar um pedido; abrir/dispensar/falhar/expirar não decide e mantém o card.
- [x] Testar ID válido, ID errado/antigo, decisão duplicada e resultados sem decisão.
- [x] Acrescentar strings novas nas 13 línguas e verificar i18n.
- [x] Executar build e testes sintéticos; compilar em target alternativo porque o executável padrão existente estava ocupado.
- [x] Inspecionar aviso e card na janela sintética, incluindo a ação Abrir; cobrir as demais ações com os testes de contrato.

Resultado visual em 2026-11-12: após clicar em Testar permissão, o aviso e o card inventado apareceram. Abrir cartão de permissão ocultou o aviso, deixou o card expandido e atualizou o status, sem decisão. Os resultados dos comandos ficam registrados no README sintético e no roadmap da Fase 2.

Não integrar o backend de toast 2.1b. Mesmo com todos os passos sintéticos aprovados, 2.1a nativa permanece aberta até a prova do callback da Shell do Windows.
