# 2.7 — Lançador rápido

Status: aprovado para verificação sintética em 2026-11-13, conforme a decisão do proprietário de publicar uma versão por etapa e deixar o teste real para depois.

## Escopo

- Reutilizar o cartão Nova sessão da 2B.6, sem criar um segundo lançador.
- `Ctrl+Alt+L` abre esse cartão e foca o campo do prompt.
- Projeto e agente selecionados ficam visíveis; ditado continua usando o controle existente.
- A sessão só é solicitada por clique em Enviar ou Enter. O prompt segue pelo argumento seguro já coberto pela 2B.6.
- No build sintético, os quatro agentes e o projeto são fixtures em memória. Enviar registra apenas uma tentativa fictícia e mostra que nenhum processo será executado.

## Validação sintética

- Testar o atalho global e confirmar que ele abre a view `launch` sem chamar `launch_session`.
- Cobrir agente/projeto escolhidos, prompt com aspas, `;`, `&`, Unicode e quebras de linha, CLI ausente, projeto/pasta ausente, cancelar e agente removido usando os testes existentes da 2B.6.
- No Agent Desktop, abrir o cartão sintético, escolher Codex, conferir o projeto e enviar texto fictício; confirmar a mensagem sintética de bloqueio e que nenhum processo de agente apareceu.
- Fechar o host sintético e verificar que não ficou em execução.

## Limites e rollback

O aceite em Windows real, incluindo foco do atalho e execução de cada CLI instalada, continua pendente do proprietário. Reverter somente o controle de teste, o teste de atalho, este documento e o registro no roadmap; não há migração nem alteração de configuração externa.
