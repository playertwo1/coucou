# STATE do fork — ponto de retomada

**Atualizado:** 2026-11-13 · **Última release:** `windows-v0.6.11` (2026-11-13) · **Fase da vez:** [Fase L — Lumen + Segunda Mente](roadmap/fase-l-lumen.md), L0 concluída; L1.1 aguarda escolha do proprietário

Este arquivo guarda só o estado atual e a próxima ação. Fases, checkpoints e evidências ficam nos arquivos de `docs/roadmap/`, e a ordem fica no [ROADMAP-FORK](ROADMAP-FORK.md).

## Estado

| Fase | Estado |
|---|---|
| 0, 1, 2 | Pausadas (D-053); ver inventário L0 na Fase L |
| L | Em andamento. L0 concluída; L1.1 aguarda escolha → L1.2 → L1.3 → L2 a L7 |
| 2B, 2C | Pausadas (decisão do dono, 2026-11-13) |
| M0–M10 | Viram "Lumen assistente"; começam depois do Checkpoint L7 |
| 3 (identidade) | Incorporada à L1 |

## Trabalho em andamento fora da `main`

- Worktree `../coucou-git-pill`, branch `codex/windows-git-pill`: pílula Git somente leitura.
- Worktree `../coucou-permission-toast-2-1a`, branch `codex/windows-permission-notifications-eval`: avaliação de notificações de permissão.
- Branch `codex/windows-permission-toast-synthetic`.
- Na worktree principal há alterações locais ainda não commitadas do app sintético (`windows/synthetic/`, testes e specs de 2026-11-12). Elas são do dono e ficaram fora do commit de reestruturação de 2026-11-13.
- As worktrees acima e as alterações locais do app sintético não foram alteradas nesta sessão. O preflight 0.6.12 `43402455643` foi cancelado; a tag existe, mas não há release publicada.

## Próxima ação

1. **L1.1:** o proprietário escolhe uma das três direções visuais/sonoras apresentadas nesta sessão.
2. **L1.2:** depois da escolha, definir nome/identifier e o plano de migração de settings, hooks e permissões.
3. **L1.3:** preparar e testar o upgrade da instalação atual e o atualizador antes de qualquer release.

## Pendências do dono

- Escolher a direção do Lumen entre A, B e C (L1.1).
- Validações reais abertas nas fases 0, 1 e 2 (ver inventário da L0 na Fase L).
