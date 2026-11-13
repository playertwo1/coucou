# STATE do fork — ponto de retomada

**Atualizado:** 2026-11-13 · **Última release:** [`windows-v0.6.14`](https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.14) (Lumen; login real em avaliação) · **Fase da vez:** [Fase L — Lumen + Segunda Mente](roadmap/fase-l-lumen.md), L0 concluída; L1.4 reativada; L1.4a aprovada visualmente; L1.4b em andamento; L1.3 real em avaliação; L2.1 sintética aprovada e 0.6.14 publicada; falta validar o login ChatGPT real

Este arquivo guarda só o estado atual e a próxima ação. Fases, checkpoints e evidências ficam nos arquivos de `docs/roadmap/`, e a ordem fica no [ROADMAP-FORK](ROADMAP-FORK.md).

## Estado

| Fase | Estado |
|---|---|
| 0, 1, 2 | Pausadas (D-053); ver inventário L0 na Fase L |
| L | Em andamento. L0 concluída; L1.1 B escolhida; L1.2 implementada; L1.3 aprovada sinteticamente; avaliação real da migração pendente; L1.4 reativada em 2026-11-13; L1.4a aprovada visualmente em 2026-11-13; L1.4b em andamento; L2.1 sintética aprovada e release 0.6.14 publicada; login real pendente |
| 2B, 2C | Pausadas (decisão do dono, 2026-11-13) |
| M0–M10 | Viram "Lumen assistente"; começam depois do Checkpoint L7 |
| 3 (identidade) | Incorporada à L1 |

## Trabalho em andamento fora da `main`

- Worktree `../coucou-git-pill`, branch `codex/windows-git-pill`: pílula Git somente leitura.
- Worktree `../coucou-permission-toast-2-1a`, branch `codex/windows-permission-notifications-eval`: avaliação de notificações de permissão.
- Branch `codex/windows-permission-toast-synthetic`.
- Worktree `../coucou-lumen-identity`, branch `codex/l1-lumen-identidade`: commit `c3b2af2` está em `origin/main`; tag e release `windows-v0.6.13` publicadas. CI `43424866776` e CI da release `43428181413` passaram nos testes sintéticos MSI/NSIS; Defender não detectou ameaças nos artefatos do preflight nem nos instaladores finais. L1 aguarda avaliação real do proprietário.
- Na worktree principal há alterações locais ainda não commitadas do app sintético (`windows/synthetic/`, testes e specs de 2026-11-12). Elas são do dono e ficaram fora do commit de reestruturação de 2026-11-13.
- As worktrees acima e as alterações locais do app sintético não foram alteradas nesta sessão. O preflight 0.6.12 `43402455643` foi cancelado; a tag existe, mas não há release publicada.

## Próxima ação

1. O proprietário relatou que a identidade da 0.6.13 aparece ("aparece tudo"). Ainda faltam os resultados por cenário da migração real: tipo de instalação (MSI ou NSIS), settings, hooks, permissões e atualizador.
2. **Decisão e aceite do proprietário (2026-11-13):** sem autorização escrita para usar o Mochi, os personagens do Lumen são originais; a Bússola continua somente como ícone do app. Correção da interpretação inicial: “vamos seguuir entao com as 8” referia-se à lineup. O proprietário esclareceu “falei errado to falando a lineup, gostei deles das imagens que fez das animacoes etc”. O aceite visual cobre a lineup e as pranchas estáticas dos estados visuais que servem de referência para animações; a imagem anexada mostra a lineup dos sete agentes. A L1.4b segue como protótipo isolado sprite × Canvas; a escolha de renderer e a implementação no app continuam pendentes.
3. **L2.1 sintética passou e a 0.6.14 foi publicada em 2026-11-13.** TypeScript, 659 testes Node, build Vite e 660 testes Rust passaram; 8 testes Rust foram ignorados. Os CIs Windows `43477378762` (preflight) e `43482202733` (release) passaram; upgrade sintético MSI/NSIS passou em ambos. Defender não detectou ameaças nos quatro artefatos do preflight nem nos instaladores finais; os hashes finais conferem com GitHub. Depois de atualizar, o proprietário testa o login real. Renovação automática e uso no chat continuam na L2.2.
4. Achados do QwenPaw registrados em [research/qwenpaw.md](research/qwenpaw.md) e marcados "(QwenPaw)" em L2, L3, L4, L6, M0, M1, M5, M8 e M9.

## Pendências do dono

- Informar os resultados reais pendentes da instalação da 0.6.13 (MSI/NSIS, settings, hooks, permissões e atualizador).
- Testar o login ChatGPT real depois da publicação da 0.6.14; nenhum teste real do Sign in with ChatGPT foi executado.
- Escolher entre sprite e Canvas após avaliar a comparação da L1.4b; isso não autoriza por si só a implementação da L1.4c.
- Validações reais abertas nas fases 0, 1 e 2 (ver inventário da L0 na Fase L).
