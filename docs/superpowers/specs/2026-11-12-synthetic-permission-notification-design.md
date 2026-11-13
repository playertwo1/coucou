> **Histórico — substituído.** Rascunho da prova sintética 2.1a (2026-11-12), recuperado do stash em 2026-11-13. O modelo sintético atual é o da 2.1b (`windows/synthetic/fixtures.ts`: token por aviso, expiração e fechar/expirar sem decidir), e nele **Permitir abre o cartão** em vez de decidir, por decisão posterior do proprietário. Ver `docs/roadmap/fase-2-melhorias-windows.md`.

# 2.1a — Simulação sintética do aviso de permissão

## Escopo

Exercitar dentro de `windows/synthetic` o contrato de decisão proposto para o toast: a ação precisa apontar para o pedido sintético pendente; somente Allow/Deny decidem; abrir, dispensar, falhar ou expirar não decide.

O aviso é um painel dentro da janela sintética. Não chama a API de toast do Windows, COM, registro, atalho, `pipe::answer` ou qualquer serviço nativo. O comando de fixture nunca é executado.

## Comportamento

- **Test permission** cria um pedido inventado e mostra o card atual e o aviso sintético com ID, agente, ferramenta e comando inventado.
- **Allow / Deny** consomem uma vez somente o ID pendente correspondente e fecham o aviso e o card sintéticos.
- **Open permission card** fecha o aviso, mantém o pedido pendente e abre o card sem decidir.
- **Dismiss/ignore**, **Simulate notification failure** e **Simulate notification timeout** fecham apenas o aviso. O card e o pedido continuam pendentes, sem entrada no ledger de decisões.
- IDs resolvidos, forjados ou desconhecidos não aceitam ação. Duplo clique não cria segunda decisão.
- Textos novos ficam em `extra.json` nas 13 línguas.

## Aceite

- Testes verificam Allow/Deny por ID, uso único e rejeição de ID inválido/antigo.
- Open, dismiss, failure e timeout não gravam decisão e preservam o pedido para o card.
- Inspeção do executável sintético confirma o aviso, os botões e o fallback para o card.
- Build, testes sintéticos pertinentes e verificação de i18n passam.

Esta simulação não prova entrega, visibilidade nem callback de um toast real. O checkpoint nativo 2.1a permanece aberto.
