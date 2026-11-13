> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

**Estado: Pausada (D-053, 2026-11-13).** Etapas, dependências, checklists e evidências permanecem preservados; não iniciar trabalho até nova decisão do proprietário.

## Fase 2C — Pílulas configuráveis e posição livre da ilha (M)

Objetivo: escolher pílulas visíveis, adicionar Grok Bot como agente e permitir arrastar a ilha horizontalmente no topo. Resend/n8n/Vercel continuam disponíveis, desligados por padrão; desativar não apaga credenciais. Claude Code permanece principal; limite de quatro pílulas secundárias. A posição livre muda só X, preservando centro e quatro cantos.

Plano detalhado obrigatório: `docs/superpowers/plans/2026-11-09-custom-pills-and-island-position.md`; desenho: `docs/superpowers/specs/2026-11-09-custom-pills-and-island-position-design.md`.

### 2C.0 — Confirmar hook do Grok Bot

- [ ] Inspecionar eventos/configuração do hook do Orca; fixture sanitizada sem prompt, token ou caminho pessoal.
- [ ] Testar instalação e remoção sem apagar entradas do Orca; adicionar `Agent::Grok`/`agent_grok` só se o contrato observado for compatível.
- [ ] Testar SessionStart, atividade e encerramento; não adicionar cartão de aprovação.
- Checkpoint 2C.0: sessão real produz `agent_grok`; se não houver evento/configuração confiável, parar e rever spec.

### 2C.1 — Seleção e padrões das pílulas

- [ ] Adicionar Grok ao catálogo e à seleção existente de Active pills.
- [ ] Padrão: Claude principal; Codex, Antigravity, Grok e GitHub nas quatro vagas.
- [ ] Migrar só a lista antiga exata Resend/n8n/Vercel/GitHub; preservar qualquer lista customizada e credenciais.
- [ ] Testar catálogo, agente ocioso, limite quatro, default novo e migração em TypeScript/Rust.
- Checkpoint 2C.1: instalação nova usa o padrão novo; configuração personalizada permanece idêntica.

### 2C.2 — Arraste horizontal no topo

- [ ] Adicionar `topCustom` e `islandTopX` normalizado de 0 a 1; centro superior redefine para 0.5.
- [ ] Começar drag só no fundo, fora de controles/Mochi e após limiar; clique abaixo do limiar continua clicando.
- [ ] Limitar X ao monitor e preservar Y/recuo, quatro cantos e escala/origem negativa.
- [ ] Testar persistência ao fechar/reabrir, monitores com escalas diferentes e controles que não podem virar drag.
- Checkpoint 2C.2: arrasta e salva sem roubar cliques nem deixar a ilha fora do monitor.

### 2C.3 — Verificação/documentação

- [ ] Seguir a Tarefa 4 do plano detalhado: migração, Grok idle/ativo, padrão novo, lista customizada e credenciais.
- [ ] Validar drag recolhido/expandido, centro/bordas, cantos antigos, escala diferente de 100% e reabertura.
- [ ] Atualizar README, CHANGELOG e What's New nas 14 línguas; `python3 scripts/test-whats-new.py` passa.
- Checkpoint 2C.3: testes completos e validação manual passam; publicar somente com pedido explícito.
