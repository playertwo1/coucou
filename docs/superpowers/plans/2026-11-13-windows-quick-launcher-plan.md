# Plano — 2.7 Lançador rápido

1. Confirmar que `Ctrl+Alt+L` já encaminha para a view compartilhada Nova sessão e que o cartão reutiliza projeto, agentes e ditado da 2B.6.
2. Acrescentar um teste sintético do evento do atalho, provando que abrir o cartão não chama a ponte de inicialização.
3. No host sintético, disponibilizar fixtures em memória para projeto e quatro agentes, expor um botão que emite o evento do atalho e responder a `launch_session` sem iniciar processos.
4. Rodar os testes, build sintético e verificação de traduções; abrir o cartão no Agent Desktop, enviar prompt fictício e fechar o host.
5. Registrar evidência e limites, criar a versão 0.6.11 e publicar a avaliação no GitHub. Manter aceite real pendente.
Status: concluído em 2026-11-13. Suíte com 649 testes, build de produção e sintético aprovados; o cartão foi enviado pelo controle de fixture do Agent Desktop e o host foi encerrado.
