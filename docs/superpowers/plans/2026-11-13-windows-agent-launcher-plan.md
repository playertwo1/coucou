# Plano — 2B.6 Nova sessão com escolha de agente

1. Confirmar checkout limpo, integrar `upstream/main` e conferir os pontos de entrada listados na spec.
2. Escrever testes Rust para os quatro argumentos e prompt literal; cobrir erro de agente ausente antes da inicialização.
3. Implementar `LaunchAgent`, disponibilidade, resultado tipado e spawn direto em console novo com argv do `std::process::Command`; reaproveitar `platform::cli_candidates` e resolver shims `.cmd` sem executá-los.
4. Escrever testes de estado/seleção/cancelamento no modelo `core/launch.ts`; persistir só a escolha local.
5. Atualizar ponte, tela Nova sessão e traduções em `extra.json`; preservar IDs e o seletor de projeto.
6. Ajustar os stubs/fixtures da variante sintética para responder com quatro agentes fictícios e nenhum processo real.
7. Rodar os testes sintéticos da spec, validar o fluxo que atravessa ponte e tela, registrar evidências e limites no roadmap.
8. Atualizar versão Windows para 0.6.7, changelog/What's New nas 14 línguas, criar commit e publicar avaliação no GitHub. Deixar lançamentos reais pendentes para o proprietário.
