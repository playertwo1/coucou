# STATE do fork — ponto de retomada

**Atualizado:** 2026-11-13 · **Última release:** [`windows-v0.6.13`](https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.13) (Lumen, 2026-11-13; avaliação real pendente) · **Fase da vez:** [Fase L — Lumen + Segunda Mente](roadmap/fase-l-lumen.md), L0 concluída; L1.1 escolhida (B); L1.2 implementada; L1.3 sintética aprovada; L1.4 (personagens por agente) aberta

Este arquivo guarda só o estado atual e a próxima ação. Fases, checkpoints e evidências ficam nos arquivos de `docs/roadmap/`, e a ordem fica no [ROADMAP-FORK](ROADMAP-FORK.md).

## Estado

| Fase | Estado |
|---|---|
| 0, 1, 2 | Pausadas (D-053); ver inventário L0 na Fase L |
| L | Em andamento. L0 concluída; L1.1 B escolhida; L1.2 implementada; L1.3 aprovada sinteticamente; Lumen 0.6.13 publicada; avaliação real parcial (identidade visível; migração sem resultado); L1.4 aberta → L2 a L7 |
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

1. O proprietário já relatou que a identidade da 0.6.13 aparece ("aparece tudo"). Faltam os resultados por cenário de instalação (MSI ou NSIS), settings, hooks, permissões e atualizador.
2. **L1.4:** o Codex gera as imagens de referência dos personagens por agente; depois, protótipo comparativo sprite × código e escolha do proprietário (ver [Fase L](roadmap/fase-l-lumen.md)).
3. A L1 fecha com o aceite real da migração e o Checkpoint L1.4. Só então começa a L2.
4. Achados do QwenPaw registrados em [research/qwenpaw.md](research/qwenpaw.md) e marcados "(QwenPaw)" em L2, L3, L4, L6, M0, M1, M5, M8 e M9.

## Pendências do dono

- A direção visual B foi escolhida; depois de instalar, o proprietário decidiu manter a Bússola só como ícone e voltar a ter personagens por agente (L1.4). Faltam os resultados dos cenários de migração da 0.6.13.
- Aprovar as imagens de referência e escolher sprite ou código (L1.4c).
- Validações reais abertas nas fases 0, 1 e 2 (ver inventário da L0 na Fase L).
